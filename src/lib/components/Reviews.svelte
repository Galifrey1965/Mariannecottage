<script lang="ts">
	import { t, formatDate, type Locale, type Messages } from '$lib/i18n';

	interface Review {
		authorName: string;
		authorPhoto: string | null;
		rating: number;
		text: string;
		languageCode: string;
		publishTime: string | null;
		relativeTime: string;
	}

	interface RatingData {
		ratingValue: number;
		ratingCount: number;
		googleMapsUri: string | null;
		reviews: Review[];
	}

	interface Props {
		messages: Messages;
		lang: Locale;
		rating: RatingData | null;
		// Up to 2 reviews chosen at random server-side (see +page.server.ts).
		// They flank the CTA so the row reads [review, CTA, review].
		featured?: Review[];
	}

	let { messages, lang, rating, featured = [] }: Props = $props();

	// One reviewer either side of the "leave a review" CTA. With <2 reviews the
	// row simply has fewer cards; with 0 it's just the CTA.
	const leftReview = $derived(featured[0] ?? null);
	const rightReview = $derived(featured[1] ?? null);

	function formatPublishDate(iso: string | null, fallback: string): string {
		if (!iso) return fallback;
		try {
			return formatDate(lang, new Date(iso), { year: 'numeric', month: 'long' });
		} catch {
			return fallback;
		}
	}

	const reviewUrl = $derived(rating?.googleMapsUri ?? 'https://www.google.com/maps');
</script>

{#if rating}
	<div class="reviews">
		<header class="reviews-header">
			<div class="rating-summary" aria-label={t(messages, 'home.reviews.aria_summary', {
				rating: rating.ratingValue.toFixed(1),
				count: String(rating.ratingCount)
			})}>
				<span class="stars" aria-hidden="true">
					{#each Array(5) as _, i}
						<svg class="star" class:filled={i < Math.round(rating.ratingValue)} viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2l2.95 6.91L22 10l-5.5 4.78L18.18 22 12 18.27 5.82 22l1.68-7.22L2 10l7.05-1.09L12 2z" />
						</svg>
					{/each}
				</span>
				<span class="rating-value">{rating.ratingValue.toFixed(1)}</span>
				<span class="rating-count">
					{t(messages, 'home.reviews.from_count', { count: String(rating.ratingCount) })}
				</span>
			</div>
		</header>

		<div class="cards">
			{#snippet reviewCard(review: Review)}
				<article class="card review" lang={review.languageCode}>
					<div class="card-stars" aria-label={t(messages, 'home.reviews.aria_stars', { rating: String(review.rating) })}>
						{#each Array(5) as _, j}
							<svg class="star small" class:filled={j < review.rating} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M12 2l2.95 6.91L22 10l-5.5 4.78L18.18 22 12 18.27 5.82 22l1.68-7.22L2 10l7.05-1.09L12 2z" />
							</svg>
						{/each}
					</div>

					{#if review.text}
						<blockquote class="review-text">{review.text}</blockquote>
					{:else}
						<p class="review-text-empty">{t(messages, 'home.reviews.no_text')}</p>
					{/if}

					<footer class="review-footer">
						<span class="review-author">{review.authorName}</span>
						<span class="review-date">
							{formatPublishDate(review.publishTime, review.relativeTime)}
						</span>
					</footer>
				</article>
			{/snippet}

			{#if leftReview}
				{@render reviewCard(leftReview)}
			{/if}

			<a class="card placeholder" href={reviewUrl} target="_blank" rel="noopener noreferrer">
				<div class="placeholder-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 2l2.95 6.91L22 10l-5.5 4.78L18.18 22 12 18.27 5.82 22l1.68-7.22L2 10l7.05-1.09L12 2z" />
					</svg>
				</div>
				<h3 class="placeholder-title">{t(messages, 'home.reviews.placeholder.title')}</h3>
				<p class="placeholder-body">{t(messages, 'home.reviews.placeholder.body')}</p>
				<span class="placeholder-cta">{t(messages, 'home.reviews.placeholder.cta')}</span>
			</a>

			{#if rightReview}
				{@render reviewCard(rightReview)}
			{/if}
		</div>

		{#if rating.googleMapsUri && featured.length > 0}
			<div class="reviews-footer">
				<a class="see-all" href={rating.googleMapsUri} target="_blank" rel="noopener noreferrer">
					{t(messages, 'home.reviews.see_all')}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M7 17L17 7" />
						<path d="M7 7h10v10" />
					</svg>
				</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.reviews {
		max-width: 1200px;
		margin: 0 auto;
	}

	.reviews-header {
		display: flex;
		justify-content: center;
		margin-bottom: 2.5rem;
	}

	.rating-summary {
		display: inline-flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.65rem 1.5rem;
		background: var(--theme-bg);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-pill);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.stars {
		display: inline-flex;
		gap: 2px;
		color: #d4a017;
	}

	.star {
		width: 1.15rem;
		height: 1.15rem;
		opacity: 0.25;
	}
	.star.filled {
		opacity: 1;
	}
	.star.small {
		width: 0.95rem;
		height: 0.95rem;
	}

	.rating-value {
		font-family: var(--theme-font-display);
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--theme-warm);
		line-height: 1;
	}

	.rating-count {
		font-size: 0.9rem;
		color: var(--theme-text-muted);
	}

	.cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		align-items: stretch;
	}
	/* review | leave-a-review | review, all on one line from tablet up */
	@media (min-width: 768px) {
		.cards {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.card {
		display: flex;
		flex-direction: column;
		padding: 1.75rem;
		background: var(--theme-bg);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md, 12px);
		min-height: 14rem;
		transition: transform 0.25s ease, box-shadow 0.25s ease;
	}

	.review {
		gap: 1rem;
	}

	.review:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	}

	.card-stars {
		display: flex;
		gap: 2px;
		color: #d4a017;
	}

	.review-text {
		flex: 1;
		font-family: var(--theme-font-body);
		font-style: italic;
		color: var(--theme-text);
		line-height: 1.65;
		margin: 0;
		font-size: 0.98rem;
		quotes: '\201C''\201D';
		text-wrap: pretty;
	}
	.review-text::before {
		content: open-quote;
		color: var(--theme-accent);
		font-family: var(--theme-font-display);
		font-size: 2.5rem;
		line-height: 0;
		vertical-align: -0.4em;
		margin-right: 0.15em;
		opacity: 0.7;
	}
	.review-text::after {
		content: close-quote;
	}

	.review-text-empty {
		flex: 1;
		font-family: var(--theme-font-body);
		color: var(--theme-text-muted);
		font-style: italic;
		margin: 0;
		font-size: 0.95rem;
	}

	.review-footer {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
		padding-top: 0.85rem;
		border-top: 1px solid var(--theme-border, rgba(0, 0, 0, 0.08));
	}

	.review-author {
		font-family: var(--theme-font-display);
		font-weight: 500;
		color: var(--theme-warm);
		font-size: 0.95rem;
	}

	.review-date {
		font-size: 0.82rem;
		color: var(--theme-text-muted);
	}

	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		padding: 1.75rem 1.5rem;
		text-align: center;
		text-decoration: none;
		color: var(--theme-text);
		background: var(--theme-surface);
		border: 1px dashed var(--theme-border, rgba(0, 0, 0, 0.18));
	}

	.placeholder:hover {
		background: var(--theme-bg);
		border-color: var(--theme-accent);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	}

	.placeholder-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: var(--theme-accent);
		opacity: 0.85;
	}
	.placeholder-icon svg {
		width: 100%;
		height: 100%;
	}

	.placeholder-title {
		font-family: var(--theme-font-display);
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--theme-warm);
		margin: 0;
	}

	.placeholder-body {
		font-size: 0.92rem;
		color: var(--theme-text-muted);
		line-height: 1.55;
		margin: 0;
		max-width: 18rem;
	}

	.placeholder-cta {
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--theme-accent);
		padding-top: 0.25rem;
	}

	.reviews-footer {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}

	/* Match the outlined pill used by other section CTAs (Home `.cta-button`).
	   Previously this was a plain underlined text link, which read as a
	   different control class to the rest of the site. */
	.see-all {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 2.25rem;
		background: transparent;
		color: var(--theme-accent);
		font-family: var(--theme-font-body);
		font-weight: 600;
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 1px solid var(--theme-accent);
		border-radius: var(--theme-radius-pill);
		text-decoration: none;
		transition: background 0.25s ease, color 0.25s ease;
	}

	.see-all:hover {
		background: var(--theme-accent);
		color: var(--theme-bg);
	}

	.see-all svg {
		width: 1rem;
		height: 1rem;
	}
</style>
