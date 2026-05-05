<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SiteBannerEffectIntensity } from '$lib/server/supabase';

	interface Props {
		intensity?: SiteBannerEffectIntensity;
	}
	let { intensity = 'burst-idle' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let rafId = 0;
	let burstTimer: ReturnType<typeof setTimeout> | null = null;
	let phaseTimer: ReturnType<typeof setTimeout> | null = null;
	let dpr = 1;
	let width = 0;
	let height = 0;
	let lastFrame = 0;
	let running = false;

	type Piece = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		angle: number;
		spin: number;
		w: number;
		h: number;
		life: number;
		maxLife: number;
		hue: number;
	};

	let pieces: Piece[] = [];

	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function spawnBurst(amount: number) {
		const sources = [
			{ x: width * 0.15, y: height + 10, vyBase: -10 },
			{ x: width * 0.85, y: height + 10, vyBase: -10 }
		];
		for (const src of sources) {
			for (let i = 0; i < amount; i++) {
				const spread = (Math.random() - 0.5) * 1.6;
				const power = 8 + Math.random() * 6;
				pieces.push({
					x: src.x,
					y: src.y,
					vx: spread * power * 0.45,
					vy: src.vyBase - Math.random() * 6,
					angle: Math.random() * Math.PI * 2,
					spin: (Math.random() - 0.5) * 0.3,
					w: 5 + Math.random() * 4,
					h: 8 + Math.random() * 4,
					life: 0,
					maxLife: 180 + Math.random() * 120,
					hue: Math.floor(Math.random() * 360)
				});
			}
		}
	}

	function tick(now: number) {
		if (!ctx || !running) return;
		const delta = lastFrame ? Math.min((now - lastFrame) / 16.67, 2) : 1;
		lastFrame = now;
		ctx.clearRect(0, 0, width, height);

		const next: Piece[] = [];
		for (const p of pieces) {
			p.life += delta;
			p.vy += 0.18 * delta;
			p.vx *= Math.pow(0.995, delta);
			p.x += p.vx * delta;
			p.y += p.vy * delta;
			p.angle += p.spin * delta;
			if (p.life >= p.maxLife || p.y > height + 30) continue;

			const alpha = 1 - p.life / p.maxLife;
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.angle);
			ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
			ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
			ctx.restore();
			next.push(p);
		}
		pieces = next;
		rafId = requestAnimationFrame(tick);
	}

	function startLoop() {
		if (rafId) return;
		running = true;
		lastFrame = 0;
		rafId = requestAnimationFrame(tick);
	}

	function stopLoop() {
		running = false;
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	}

	function handleVisibility() {
		if (document.hidden) stopLoop();
		else if (intensity !== 'load-only') startLoop();
	}

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return;

		ctx = canvas.getContext('2d', { alpha: true });
		resize();
		window.addEventListener('resize', resize);
		document.addEventListener('visibilitychange', handleVisibility);

		startLoop();
		const initial = intensity === 'load-only' ? 60 : 30;
		spawnBurst(initial);

		if (intensity === 'continuous') {
			const loop = () => {
				spawnBurst(20);
				phaseTimer = setTimeout(loop, 4_000 + Math.random() * 2_000);
			};
			phaseTimer = setTimeout(loop, 3_000);
		} else if (intensity === 'burst-idle') {
			const loop = () => {
				spawnBurst(30);
				phaseTimer = setTimeout(loop, 60_000);
			};
			phaseTimer = setTimeout(loop, 60_000);
		} else {
			setTimeout(() => stopLoop(), 6_000);
		}
	});

	onDestroy(() => {
		stopLoop();
		if (burstTimer) clearTimeout(burstTimer);
		if (phaseTimer) clearTimeout(phaseTimer);
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', handleVisibility);
		}
	});
</script>

<canvas bind:this={canvas} class="confetti-canvas" aria-hidden="true"></canvas>

<style>
	.confetti-canvas {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 998;
	}
	@media (prefers-reduced-motion: reduce) {
		.confetti-canvas { display: none; }
	}
</style>
