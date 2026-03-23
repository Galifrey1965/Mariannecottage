<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { lang, messages }: Props = $props();

	const quickLinks = [
		{ label: t(messages, 'nav.home'), href: '/' },
		{ label: t(messages, 'nav.rooms'), href: '/rooms' },
		{ label: t(messages, 'nav.gallery'), href: '/gallery' },
		{ label: t(messages, 'nav.explore'), href: '/explore' },
		{ label: t(messages, 'nav.contact'), href: '/contact' }
	];
</script>

<footer class="footer">
	<div class="footer-inner">
		<div class="footer-grid">
			<div>
				<h3 class="footer-brand">Marianne Cottage</h3>
				<p class="footer-tagline">{t(messages, 'footer.tagline')}</p>
			</div>

			<div>
				<h4 class="footer-heading">{t(messages, 'footer.quick_links')}</h4>
				<ul class="footer-links">
					{#each quickLinks as link}
						<li>
							<a href={localePath(lang, link.href)}>{link.label}</a>
						</li>
					{/each}
					<li>
						<a href={localePath(lang, '/legal')}>{t(messages, 'nav.legal')}</a>
					</li>
				</ul>
			</div>

			<div>
				<h4 class="footer-heading">{t(messages, 'footer.contact')}</h4>
				<div class="footer-contact">
					<p>{t(messages, 'contact.address')}</p>
					<p>{t(messages, 'contact.email')}</p>
					<p>{t(messages, 'contact.phone')}</p>
				</div>
			</div>
		</div>

		<div class="footer-bottom">
			<p>{t(messages, 'footer.copyright')}</p>
		</div>
	</div>
</footer>

<style>
	.footer {
		background-color: #5d3a1a;
		color: #fef3c7;
		margin-top: 4rem;
	}

	.footer-inner {
		max-width: 1280px;
		margin: 0 auto;
		padding: 3rem 1rem;
	}

	@media (min-width: 600px) {
		.footer-inner {
			padding: 3rem 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.footer-inner {
			padding: 3rem 2rem;
		}
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 840px) {
		.footer-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.footer-brand {
		font-family: 'Lora', serif;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: #fef3c7;
	}

	.footer-tagline {
		font-size: 0.875rem;
		font-style: italic;
		color: #fde68a;
		margin: 0;
	}

	.footer-heading {
		font-weight: 600;
		margin: 0 0 1rem;
		color: #fef3c7;
	}

	.footer-links {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.footer-links a {
		color: #fde68a;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease;
	}

	.footer-links a:hover {
		color: white;
	}

	.footer-contact {
		font-size: 0.875rem;
		color: #fde68a;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.footer-contact p {
		margin: 0;
	}

	.footer-bottom {
		border-top: 1px solid #7c4a23;
		padding-top: 2rem;
		text-align: center;
	}

	.footer-bottom p {
		font-size: 0.875rem;
		color: #fde68a;
		margin: 0;
	}
</style>
