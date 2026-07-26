// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the clients before importing — supabase.ts builds them at module load.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'http://x', PUBLIC_SUPABASE_ANON_KEY: 'k' }
}));
vi.mock('$env/dynamic/private', () => ({
	env: { SUPABASE_SERVICE_ROLE_KEY: 'k' }
}));

// A deliberately thin fake of the query builder: records what the helper asked
// for, and resolves whatever the test queued up. Enough to pin the retention
// boundary and the notify_error truncation without standing up a database.
interface Captured {
	table: string;
	op: 'delete' | 'update' | 'insert';
	ltColumn?: string;
	ltValue?: string;
	eqValue?: string;
	payload?: Record<string, unknown>;
}

let captured: Captured[] = [];
let deleteResult: { data: unknown; error: unknown } = { data: [], error: null };
let insertResult: { data: unknown; error: unknown } = { data: { id: 'enq-1' }, error: null };
let writeResult: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock('@supabase/supabase-js', () => ({
	createClient: () => ({
		from(table: string) {
			return {
				delete() {
					const rec: Captured = { table, op: 'delete' };
					captured.push(rec);
					return {
						lt(column: string, value: string) {
							rec.ltColumn = column;
							rec.ltValue = value;
							return {
								select: async () => deleteResult
							};
						}
					};
				},
				update(payload: Record<string, unknown>) {
					const rec: Captured = { table, op: 'update', payload };
					captured.push(rec);
					return {
						eq: async (_column: string, value: string) => {
							rec.eqValue = value;
							return writeResult;
						}
					};
				},
				insert(payload: Record<string, unknown>) {
					captured.push({ table, op: 'insert', payload });
					return {
						select: () => ({
							single: async () => insertResult
						})
					};
				}
			};
		}
	})
}));

import {
	purgeOldEnquiries,
	createEnquiry,
	markEnquiryNotifyFailed,
	markEnquiryNotified
} from './supabase';

beforeEach(() => {
	captured = [];
	deleteResult = { data: [], error: null };
	insertResult = { data: { id: 'enq-1' }, error: null };
	writeResult = { data: null, error: null };
});

// Rounded from the cutoff the helper computes, so the fixtures below sit an
// unambiguous distance either side of the 24-month boundary.
function monthsAgo(n: number): Date {
	const d = new Date();
	d.setMonth(d.getMonth() - n);
	return d;
}

describe('purgeOldEnquiries — 24-month GDPR retention', () => {
	it('deletes on a created_at cutoff 24 months in the past', async () => {
		await purgeOldEnquiries();

		expect(captured).toHaveLength(1);
		expect(captured[0].table).toBe('enquiries');
		expect(captured[0].op).toBe('delete');
		expect(captured[0].ltColumn).toBe('created_at');

		const cutoff = new Date(captured[0].ltValue as string).getTime();
		// Within a day of exactly 24 months ago — tolerance covers month-length
		// variation and the clock ticking during the test.
		expect(Math.abs(cutoff - monthsAgo(24).getTime())).toBeLessThan(24 * 60 * 60 * 1000);
	});

	it('sweeps rows older than 24 months and spares rows inside the window', async () => {
		await purgeOldEnquiries();
		const cutoff = new Date(captured[0].ltValue as string).getTime();

		const rows = [
			{ id: 'ancient', created_at: monthsAgo(48) },
			{ id: 'just-too-old', created_at: monthsAgo(25) },
			{ id: 'just-inside', created_at: monthsAgo(23) },
			{ id: 'recent', created_at: monthsAgo(1) }
		];
		const deleted = rows.filter((r) => r.created_at.getTime() < cutoff).map((r) => r.id);
		const survived = rows.filter((r) => r.created_at.getTime() >= cutoff).map((r) => r.id);

		expect(deleted).toEqual(['ancient', 'just-too-old']);
		expect(survived).toEqual(['just-inside', 'recent']);
	});

	it('returns the number of rows deleted', async () => {
		deleteResult = { data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], error: null };
		expect(await purgeOldEnquiries()).toBe(3);
	});

	it('returns 0 when nothing was old enough to purge', async () => {
		deleteResult = { data: [], error: null };
		expect(await purgeOldEnquiries()).toBe(0);
	});

	it('throws when the delete fails, so the sweep can log it', async () => {
		deleteResult = { data: null, error: new Error('permission denied') };
		await expect(purgeOldEnquiries()).rejects.toThrow(/permission denied/);
	});

	it('purges spam rows on the same clock — no shorter window', async () => {
		await purgeOldEnquiries();
		// A status filter would mean spam was being special-cased; a
		// misclassified genuine enquiry deserves the full recovery period.
		expect(JSON.stringify(captured[0])).not.toContain('status');
	});
});

describe('createEnquiry', () => {
	it('writes the row and returns its id', async () => {
		const id = await createEnquiry({
			name: 'Jane',
			email: 'jane@example.com',
			message: 'Is the cottage free in September?',
			locale: 'en',
			status: 'new'
		});
		expect(id).toBe('enq-1');
		expect(captured[0]).toMatchObject({
			table: 'enquiries',
			op: 'insert',
			payload: { name: 'Jane', status: 'new', spam_reason: null }
		});
	});

	it('records the spam reason when one was given', async () => {
		await createEnquiry({
			name: 'Bot',
			email: 'bot@example.invalid',
			message: 'cheap watches for sale here',
			locale: 'en',
			status: 'spam',
			spam_reason: 'honeypot'
		});
		expect(captured[0].payload).toMatchObject({ status: 'spam', spam_reason: 'honeypot' });
	});
});

describe('markEnquiryNotified / markEnquiryNotifyFailed', () => {
	it('stamps admin_notified_at on the right row', async () => {
		await markEnquiryNotified('enq-9');
		expect(captured[0].op).toBe('update');
		expect(captured[0].eqValue).toBe('enq-9');
		expect(captured[0].payload).toHaveProperty('admin_notified_at');
	});

	it('truncates a verbose provider error to 500 characters', async () => {
		await markEnquiryNotifyFailed('enq-9', 'x'.repeat(2_000));
		expect((captured[0].payload as { notify_error: string }).notify_error).toHaveLength(500);
	});

	it('stores a short error unchanged', async () => {
		await markEnquiryNotifyFailed('enq-9', 'Brevo error 401: unauthorized IP');
		expect((captured[0].payload as { notify_error: string }).notify_error).toBe(
			'Brevo error 401: unauthorized IP'
		);
	});
});
