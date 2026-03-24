<script lang="ts">
	interface Props {
		image: string;
		title: string;
		distance: string;
		description: string;
		category: string;
		url?: string;
	}

	let { image, title, distance, description, category, url }: Props = $props();
</script>

<div class="card" title={title}>
	<div class="card-image-wrapper">
		<img src={image} alt={title} class="card-image" />
	</div>
	<div class="card-body">
		<div class="card-header">
			<h3 class="card-title">{title}</h3>
			<span class="distance-badge">{distance}</span>
		</div>
		<p class="card-category">{category}</p>
		<p class="card-text">{description}</p>
		{#if url}
			<a href={url} target="_blank" rel="noopener" class="card-link">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
				<span>{title}</span>
			</a>
		{/if}
	</div>
</div>

<style>
	.card { background: var(--md-sys-color-surface-container-lowest); border-radius: var(--md-shape-corner-medium); box-shadow: var(--md-elevation-shadow-1); overflow: hidden; transition: box-shadow 0.2s ease; }
	.card:hover { box-shadow: var(--md-elevation-shadow-3); }
	.card-image-wrapper { position: relative; overflow: hidden; }
	.card-image { width: 100%; height: 10rem; object-fit: cover; transition: transform 0.3s ease; }
	.card:hover .card-image { transform: scale(1.05); }
	.card-body { padding: 1rem; }
	.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
	.card-title { font-family: 'Lora', serif; font-weight: 600; color: var(--color-brown); margin: 0; }
	.distance-badge { font-size: 0.75rem; background: var(--color-cream); color: var(--color-brown); padding: 0.25rem 0.5rem; border-radius: 4px; white-space: nowrap; margin-left: 0.5rem; }
	.card-category { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; margin: 0 0 0.5rem; }
	.card-text { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
	.card-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-sage);
		text-decoration: none;
		transition: color 0.2s ease;
	}
	.card-link:hover { color: var(--color-sage-hover); text-decoration: underline; }
	.card-link svg { flex-shrink: 0; }
</style>
