/**
 * Netlify Image CDN helper.
 * Builds a /.netlify/images transform URL for a given static image path.
 * Falls back to the raw src path during SSR (server-side render) and local dev,
 * where the Netlify CDN is not available.
 *
 * Usage:
 *   <img src={cdnSrc('/images/poi/omaha-beach/1.jpg', 800)} />
 *
 * Netlify free tier: 2,500 unique transforms/month.
 * Each unique (url + width + format) combination counts as one transform.
 */
export function cdnSrc(src: string, width: number): string {
	if (typeof window === 'undefined') return src;
	return `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&fm=webp`;
}

/**
 * Generates a srcset string for responsive images via Netlify CDN.
 * Falls back to the raw src path during SSR.
 *
 * Usage:
 *   <img srcset={cdnSrcset('/images/poi/omaha-beach/1.jpg', [400, 800, 1200])} />
 */
export function cdnSrcset(src: string, widths: number[]): string {
	if (typeof window === 'undefined') return '';
	return widths
		.map((w) => `${cdnSrc(src, w)} ${w}w`)
		.join(', ');
}
