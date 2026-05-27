import type { PageServerLoad } from './$types';

// Pick up to 2 reviews at random from the full pool (loaded into layout data
// by +layout.server.ts) to flank the "leave a review" CTA on the home page.
// Done server-side per request so a page refresh rotates which two show —
// without a hydration mismatch (the client just renders what the server chose).
export const load: PageServerLoad = async ({ parent }) => {
	const { rating } = await parent();
	const pool = rating?.reviews ?? [];
	// Prefer reviews that actually have text — a blank "Rated 5 stars" card is a
	// weak showing. Fall back to the full pool only if fewer than 2 have text.
	const withText = pool.filter((r) => r.text && r.text.trim().length > 0);
	const base = withText.length >= 2 ? withText : pool;
	const featuredReviews = [...base].sort(() => Math.random() - 0.5).slice(0, 2);
	return { featuredReviews };
};
