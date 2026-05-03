// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { diffBcAvailability } from './bc-sync';

describe('diffBcAvailability (S-01 stale-block clearing)', () => {
	const today = '2026-05-03';

	it('blocks all currently-blocked future dates', () => {
		const result = diffBcAvailability(
			['2026-05-10', '2026-05-11', '2026-05-12'],
			[],
			today
		);
		expect(result.toBlock.sort()).toEqual(['2026-05-10', '2026-05-11', '2026-05-12']);
		expect(result.toFree).toEqual([]);
	});

	it('frees previously-BC-blocked rows no longer in the feed', () => {
		const result = diffBcAvailability(
			['2026-05-10'],
			[
				{ date: '2026-05-10', available: false },
				{ date: '2026-05-11', available: false },
				{ date: '2026-05-12', available: false }
			],
			today
		);
		expect(result.toFree.sort()).toEqual(['2026-05-11', '2026-05-12']);
		expect(result.toBlock).toEqual(['2026-05-10']);
	});

	it('does not touch rows already marked available', () => {
		const result = diffBcAvailability(
			[],
			[{ date: '2026-05-10', available: true }],
			today
		);
		expect(result.toFree).toEqual([]);
	});

	it('ignores past dates in feed and existing rows', () => {
		const result = diffBcAvailability(
			['2026-04-01', '2026-05-10'],
			[
				{ date: '2026-04-15', available: false },
				{ date: '2026-05-12', available: false }
			],
			today
		);
		expect(result.toBlock).toEqual(['2026-05-10']);
		expect(result.toFree).toEqual(['2026-05-12']);
	});

	it('returns empty diff for empty feed and no existing BC rows', () => {
		const result = diffBcAvailability([], [], today);
		expect(result).toEqual({ toBlock: [], toFree: [] });
	});

	it('treats today itself as in-range (>= today)', () => {
		const result = diffBcAvailability(
			[today],
			[{ date: today, available: false }],
			today
		);
		expect(result.toBlock).toEqual([today]);
		expect(result.toFree).toEqual([]);
	});

	it('frees a row dated today that has dropped out of the feed', () => {
		const result = diffBcAvailability(
			[],
			[{ date: today, available: false }],
			today
		);
		expect(result.toFree).toEqual([today]);
	});
});
