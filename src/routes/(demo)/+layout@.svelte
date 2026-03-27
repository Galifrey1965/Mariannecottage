<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap"
		rel="stylesheet"
	/>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

{@render children()}

<style>
	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}
	:global(html) {
		scroll-behavior: smooth;
		font-size: 16px;
	}
	:global(body) {
		font-family: 'Inter', system-ui, sans-serif;
		background: #f0eee9;
		color: #3a3a3a;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
	:global(img) {
		max-width: 100%;
		display: block;
	}
</style>
