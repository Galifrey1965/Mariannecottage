<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SiteBannerEffectIntensity } from '$lib/server/supabase';

	interface Props {
		intensity?: SiteBannerEffectIntensity;
		palette?: 'mixed' | 'gold' | 'rwb' | 'christmas' | 'pastel';
	}

	let { intensity = 'burst-idle', palette = 'mixed' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let rafId = 0;
	let running = $state(false);
	let burstTimer: ReturnType<typeof setTimeout> | null = null;
	let phaseTimer: ReturnType<typeof setTimeout> | null = null;

	type Particle = {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		maxLife: number;
		hue: number;
		size: number;
		kind: 'rocket' | 'spark' | 'trail';
		gravity: number;
		drag: number;
	};

	const PALETTES: Record<string, number[]> = {
		mixed:     [350, 30, 50, 120, 200, 270, 320],
		gold:      [40, 45, 50, 30, 35],
		rwb:       [0, 220, 0, 220, 0],
		christmas: [0, 120, 0, 120, 45],
		pastel:    [330, 280, 200, 150, 50]
	};

	let particles: Particle[] = [];
	let dpr = 1;
	let width = 0;
	let height = 0;
	let lastFrame = 0;
	let nextRocketAt = 0;

	function resize() {
		if (!canvas) return;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function pickHue(): number {
		const hues = PALETTES[palette] ?? PALETTES.mixed;
		return hues[Math.floor(Math.random() * hues.length)];
	}

	function launchRocket() {
		// Cap concurrent rockets to keep things smooth on phones.
		const liveRockets = particles.reduce((n, p) => n + (p.kind === 'rocket' ? 1 : 0), 0);
		if (liveRockets >= 3) return;

		const x = width * (0.15 + Math.random() * 0.7);
		const targetY = height * (0.15 + Math.random() * 0.35);
		const startY = height + 10;
		const flightTime = 0.9 + Math.random() * 0.4;
		const vy = -(startY - targetY) / flightTime / 60;
		const vx = (Math.random() - 0.5) * 0.4;

		particles.push({
			x,
			y: startY,
			vx,
			vy,
			life: 0,
			maxLife: flightTime * 60,
			hue: pickHue(),
			size: 2.4,
			kind: 'rocket',
			gravity: 0.012,
			drag: 0.999
		});
	}

	function explode(x: number, y: number, hue: number) {
		const sparkCount = 70 + Math.floor(Math.random() * 50);
		for (let i = 0; i < sparkCount; i++) {
			const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.1;
			const speed = 1.2 + Math.random() * 3.4;
			particles.push({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 0,
				maxLife: 60 + Math.random() * 50,
				hue: hue + (Math.random() - 0.5) * 12,
				size: 1.6 + Math.random() * 1.4,
				kind: 'spark',
				gravity: 0.05,
				drag: 0.972
			});
		}
	}

	function tick(now: number) {
		if (!ctx || !running) return;
		const delta = lastFrame ? Math.min((now - lastFrame) / 16.67, 2) : 1;
		lastFrame = now;

		// Trailing fade — leaves streaks behind moving sparks.
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(0,0,0,0.18)';
		ctx.fillRect(0, 0, width, height);
		ctx.globalCompositeOperation = 'lighter';

		if (running && intensity === 'continuous' && now >= nextRocketAt) {
			launchRocket();
			nextRocketAt = now + 600 + Math.random() * 1800;
		}

		const next: Particle[] = [];
		for (const p of particles) {
			p.life += delta;
			p.vx *= Math.pow(p.drag, delta);
			p.vy = p.vy * Math.pow(p.drag, delta) + p.gravity * delta;
			p.x += p.vx * delta;
			p.y += p.vy * delta;

			if (p.kind === 'rocket') {
				// Trail particles while climbing.
				next.push({
					x: p.x + (Math.random() - 0.5) * 1.2,
					y: p.y,
					vx: 0,
					vy: 0.4 + Math.random() * 0.3,
					life: 0,
					maxLife: 14 + Math.random() * 8,
					hue: p.hue,
					size: 1.1,
					kind: 'trail',
					gravity: 0,
					drag: 0.92
				});
				if (p.life >= p.maxLife || p.vy >= 0) {
					explode(p.x, p.y, p.hue);
					continue;
				}
			} else if (p.life >= p.maxLife) {
				continue;
			}

			const alpha = 1 - p.life / p.maxLife;
			const lightness = p.kind === 'rocket' ? 70 : 60;
			ctx.fillStyle = `hsla(${p.hue}, 95%, ${lightness}%, ${alpha})`;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();
			next.push(p);
		}
		particles = next;

		rafId = requestAnimationFrame(tick);
	}

	function startLoop() {
		if (rafId) return;
		running = true;
		lastFrame = 0;
		nextRocketAt = 0;
		rafId = requestAnimationFrame(tick);
	}

	function stopLoop() {
		running = false;
		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	}

	function fireBurst(rockets: number) {
		let i = 0;
		const fireOne = () => {
			launchRocket();
			i++;
			if (i < rockets) {
				burstTimer = setTimeout(fireOne, 220 + Math.random() * 380);
			}
		};
		fireOne();
	}

	function startBurstIdle() {
		startLoop();
		const phase = () => {
			fireBurst(8 + Math.floor(Math.random() * 4));
			phaseTimer = setTimeout(phase, 45_000);
		};
		phase();
	}

	function startLoadOnly() {
		startLoop();
		fireBurst(10);
		// Run animation long enough for the last sparks to fade, then stop.
		setTimeout(() => stopLoop(), 8_000);
	}

	function handleVisibility() {
		if (document.hidden) {
			stopLoop();
		} else if (intensity !== 'load-only') {
			startLoop();
		}
	}

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return;

		ctx = canvas.getContext('2d', { alpha: true });
		resize();
		window.addEventListener('resize', resize);
		document.addEventListener('visibilitychange', handleVisibility);

		if (intensity === 'continuous') startLoop();
		else if (intensity === 'load-only') startLoadOnly();
		else startBurstIdle();
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

<canvas bind:this={canvas} class="fireworks-canvas" aria-hidden="true"></canvas>

<style>
	.fireworks-canvas {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 998;
	}
	@media (prefers-reduced-motion: reduce) {
		.fireworks-canvas { display: none; }
	}
</style>
