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

<footer class="bg-amber-900 text-amber-50 mt-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
			<!-- Brand -->
			<div>
				<h3 class="text-2xl font-serif font-semibold mb-2">Marianne Cottage</h3>
				<p class="text-amber-100 text-sm italic">{t(messages, 'footer.tagline')}</p>
			</div>

			<!-- Quick Links -->
			<div>
				<h4 class="font-semibold mb-4">{t(messages, 'footer.quick_links')}</h4>
				<ul class="space-y-2">
					{#each quickLinks as link}
						<li>
							<a
								href={localePath(lang, link.href)}
								class="text-amber-100 hover:text-white transition-colors text-sm"
							>
								{link.label}
							</a>
						</li>
					{/each}
					<li>
						<a
							href={localePath(lang, '/legal')}
							class="text-amber-100 hover:text-white transition-colors text-sm"
						>
							{t(messages, 'nav.legal')}
						</a>
					</li>
				</ul>
			</div>

			<!-- Contact Info -->
			<div>
				<h4 class="font-semibold mb-4">{t(messages, 'footer.contact')}</h4>
				<div class="text-sm text-amber-100 space-y-2">
					<p>{t(messages, 'contact.address')}</p>
					<p>{t(messages, 'contact.email')}</p>
					<p>{t(messages, 'contact.phone')}</p>
				</div>
			</div>
		</div>

		<div class="border-t border-amber-800 pt-8">
			<p class="text-center text-amber-100 text-sm">
				{t(messages, 'footer.copyright')}
			</p>
		</div>
	</div>
</footer>

<style>
	footer {
		background-color: #5d3a1a;
	}
</style>
