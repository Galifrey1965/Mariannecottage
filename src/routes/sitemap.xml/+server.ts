import type { RequestHandler } from './$types';

const LOCALES = ['en', 'fr', 'de'];
const BASE_URL = 'https://mariannecottage.netlify.app';

const PATHS = [
	'/',
	'/rooms',
	'/gallery',
	'/explore',
	'/contact',
	'/book',
	'/legal'
];

export const GET: RequestHandler = async () => {
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${LOCALES
		.map(lang =>
			PATHS.map(path => {
				const url = `${BASE_URL}/${lang}${path === '/' ? '' : path}`;
				return `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
    ${LOCALES.map(
		l =>
			`<xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${path === '/' ? '' : path}" />`
	).join('\n    ')}
  </url>`;
			}).join('\n')
		)
		.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
