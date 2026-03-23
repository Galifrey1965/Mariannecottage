<script lang="ts">
	interface Props {
		image: string;
		title: string;
		distance: string;
		description: string;
		category: string;
	}

	let { image, title, distance, description, category }: Props = $props();
</script>

<div class="card">
	<img src={image} alt={title} class="card-image" />
	<div class="card-body">
		<div class="card-header">
			<h3 class="card-title">{title}</h3>
			<span class="distance-badge">{distance}</span>
		</div>
		<p class="card-category">{category}</p>
		<p class="card-text">{description}</p>
	</div>
</div>

<style>
	.card { background: var(--md-sys-color-surface-container-lowest); border-radius: var(--md-shape-corner-medium); box-shadow: var(--md-elevation-shadow-1); overflow: hidden; transition: box-shadow 0.2s ease; }
	.card:hover { box-shadow: var(--md-elevation-shadow-3); }
	.card-image { width: 100%; height: 10rem; object-fit: cover; }
	.card-body { padding: 1rem; }
	.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
	.card-title { font-family: 'Lora', serif; font-weight: 600; color: var(--color-brown); margin: 0; }
	.distance-badge { font-size: 0.75rem; background: var(--color-cream); color: var(--color-brown); padding: 0.25rem 0.5rem; border-radius: 4px; white-space: nowrap; margin-left: 0.5rem; }
	.card-category { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; margin: 0 0 0.5rem; }
	.card-text { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
</style>
