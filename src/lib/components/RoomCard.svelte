<script lang="ts">
	interface Props {
		image: string;
		title: string;
		description: string;
	}

	let { image, title, description }: Props = $props();
</script>

<div class="card">
	<img src={image} alt={title} class="card-image" />
	<div class="card-body">
		<h3 class="card-title">{title}</h3>
		<p class="card-text">{description}</p>
	</div>
</div>

<style>
	.card { background: var(--md-sys-color-surface-container-lowest); border-radius: var(--md-shape-corner-medium); box-shadow: var(--md-elevation-shadow-1); overflow: hidden; transition: box-shadow 0.2s ease; }
	.card:hover { box-shadow: var(--md-elevation-shadow-3); }
	.card-image { width: 100%; height: 10rem; object-fit: cover; }
	@media (min-width: 480px) { .card-image { height: 12rem; } }
	.card-body { padding: 1.5rem; }
	.card-title { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; color: var(--color-brown); margin: 0 0 0.5rem; }
	.card-text { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
</style>
