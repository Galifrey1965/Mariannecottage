// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '$lib/server/supabase';
import type { Locale } from '$lib/i18n';

declare global {
	// Vite injects these at build time via the `define` block in vite.config.ts.
	const __APP_VERSION__: string;
	const __BUILD_DATE__: string;

	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			user: User | null;
			profile: UserProfile | null;
			lang: Locale;
		}
		interface PageData {
			user?: User | null;
			profile?: UserProfile | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
