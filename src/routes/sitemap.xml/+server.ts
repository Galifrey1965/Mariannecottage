import type { RequestHandler } from './$types';
import { LOCALES } from '$lib/i18n';

const BASE_URL = 'https://mariannecottage.fr';

const PATHS = ['/', '/rooms', '/gallery', '/explore', '/contact', '/book', '/legal'];

function urlFor(path: string, lang: string): string {
	if (lang === 'en') return `${BASE_URL}${path}`;
	return `${BASE_URL}${path}?lang=${lang}`;
}

export const GET: RequestHandler = async () => {
	const entries = PATHS.map(path => {
		const alternates = LOCALES.map(
			l => `      <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(path, l)}" />`
		).join('\n');
		const xDefault = `      <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(path, 'en')}" />`;
		return `  <url>
    <loc>${urlFor(path, 'en')}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
${alternates}
${xDefault}
  </url>`;
	}).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
