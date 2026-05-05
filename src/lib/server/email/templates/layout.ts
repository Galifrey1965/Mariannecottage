// Shared HTML wrapper for transactional emails. Inline styles only — most
// email clients strip <style> blocks or refuse <link>. Kept minimal so it
// renders acceptably in dark-mode clients without a media-query gymnastics.

import type { EmailStrings } from '../i18n';

interface LayoutOptions {
	common: EmailStrings['common'];
	innerHtml: string;
}

export function wrap({ common, innerHtml }: LayoutOptions): string {
	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(common.cottageName)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f1e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e8dfca;">
          <tr>
            <td style="padding:28px 32px 8px 32px;border-bottom:1px solid #efe7d4;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#7a4a2a;letter-spacing:0.02em;">
                ${escapeHtml(common.cottageName)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;font-size:15px;line-height:1.55;color:#2b2b2b;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px 32px;font-size:12px;line-height:1.5;color:#7a6f5a;border-top:1px solid #efe7d4;">
              ${escapeHtml(common.footer)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function paragraph(text: string): string {
	return `<p style="margin:0 0 14px 0;">${escapeHtml(text)}</p>`;
}

export function heading(text: string): string {
	return `<p style="margin:0 0 16px 0;font-size:17px;font-weight:600;color:#2b2b2b;">${escapeHtml(text)}</p>`;
}

export function summaryTable(rows: Array<{ label: string; value: string }>): string {
	const trs = rows
		.map(
			(r) => `
        <tr>
          <td style="padding:8px 12px;font-size:13px;color:#7a6f5a;border-bottom:1px solid #efe7d4;width:38%;">${escapeHtml(r.label)}</td>
          <td style="padding:8px 12px;font-size:14px;color:#2b2b2b;border-bottom:1px solid #efe7d4;">${escapeHtml(r.value)}</td>
        </tr>`
		)
		.join('');
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px 0;border:1px solid #efe7d4;border-radius:6px;overflow:hidden;">${trs}</table>`;
}

export function buttonLink(label: string, href: string): string {
	return `<p style="margin:18px 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:#7a4a2a;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.04em;">${escapeHtml(label)}</a>
  </p>`;
}

export function signatureBlock(signature: string): string {
	return `<p style="margin:18px 0 0 0;color:#5a4a36;">${escapeHtml(signature)}</p>`;
}

export function plainTextSummary(rows: Array<{ label: string; value: string }>): string {
	return rows.map((r) => `${r.label}: ${r.value}`).join('\n');
}
