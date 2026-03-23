<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import type { Locale, Messages } from '$lib/i18n';

	interface Props {
		lang: Locale;
		messages: Messages;
		image: string;
		title: string;
		description: string;
	}

	let { lang, messages, image, title, description }: Props = $props();
</script>

<div class="card">
	<img src={image} alt={title} class="card-image" />
	<div class="card-body">
		<h3 class="card-title">{title}</h3>
		<p class="card-text">{description}</p>
		<a href={localePath(lang, '/rooms')} class="card-link">{t(messages, 'room_card.view_details')}</a>
	</div>
</div>

<style>
	.card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; transition: box-shadow 0.2s ease; }
	.card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
	.card-image { width: 100%; height: 12rem; object-fit: cover; }
	.card-body { padding: 1.5rem; }
	.card-title { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; color: var(--color-brown); margin: 0 0 0.5rem; }
	.card-text { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 1rem; }
	.card-link { font-size: 0.875rem; font-weight: 600; color: var(--color-sage); text-decoration: none; }
	.card-link:hover { color: var(--color-sage-hover); }
</style>
