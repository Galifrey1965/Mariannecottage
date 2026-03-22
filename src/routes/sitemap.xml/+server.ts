import type { RequestHandler } from './$types';

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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${PATHS.map(
		path => `  <url>
    <loc>${BASE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`
	).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
