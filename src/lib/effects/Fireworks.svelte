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

	type BurstType = 'standard' | 'ring' | 'willow' | 'palm' | 'double' | 'crossette';
	type LaunchStyle = 'vertical' | 'angled' | 'side-arc';

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
		// Rocket-only: which burst pattern + payload of secondary rockets.
		burstType?: BurstType;
		secondaryBurstAt?: number; // ms after explode — for 'double'
		// Spark-only: if set, the spark splits into a mini-burst at this life
		// point. childHue overrides the colour of the secondary fragments.
		splitAt?: number;
		childHue?: number;
	};

	const PALETTES: Record<string, number[]> = {
		mixed:     [350, 30, 50, 120, 200, 270, 320],
		gold:      [40, 45, 50, 30, 35],
		rwb:       [0, 220, 0, 220, 0],
		christmas: [0, 120, 0, 120, 45],
		pastel:    [330, 280, 200, 150, 50]
	};

	const BURST_TYPES: BurstType[] = ['standard', 'ring', 'willow', 'palm', 'double', 'crossette'];
	// Weights match the array above — standard most common; crossette is the
	// rarest as it's the most particle-heavy (and most spectacular).
	const BURST_WEIGHTS = [32, 16, 16, 13, 11, 12];

	const LAUNCH_STYLES: LaunchStyle[] = ['vertical', 'angled', 'side-arc'];
	const LAUNCH_WEIGHTS = [55, 30, 15];

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

	function pickWeighted<T>(items: T[], weights: number[]): T {
		const total = weights.reduce((s, w) => s + w, 0);
		let r = Math.random() * total;
		for (let i = 0; i < items.length; i++) {
			r -= weights[i];
			if (r <= 0) return items[i];
		}
		return items[items.length - 1];
	}

	function launchRocket() {
		// Cap concurrent rockets to keep things smooth on phones.
		const liveRockets = particles.reduce((n, p) => n + (p.kind === 'rocket' ? 1 : 0), 0);
		if (liveRockets >= 4) return;

		const burstType = pickWeighted(BURST_TYPES, BURST_WEIGHTS);
		const launchStyle = pickWeighted(LAUNCH_STYLES, LAUNCH_WEIGHTS);
		const hue = pickHue();

		let x = 0, y = 0, vx = 0, vy = 0, flightTime = 1.0;

		if (launchStyle === 'vertical') {
			x = width * (0.15 + Math.random() * 0.7);
			const targetY = height * (0.15 + Math.random() * 0.30);
			y = height + 10;
			flightTime = 0.95 + Math.random() * 0.4;
			vy = -(y - targetY) / flightTime / 60;
			vx = (Math.random() - 0.5) * 0.4;
		} else if (launchStyle === 'angled') {
			// Steeper bottom-up launch with significant horizontal velocity.
			const fromLeft = Math.random() < 0.5;
			x = fromLeft ? width * (0.05 + Math.random() * 0.25) : width * (0.7 + Math.random() * 0.25);
			const targetX = width * (0.3 + Math.random() * 0.4);
			const targetY = height * (0.15 + Math.random() * 0.25);
			y = height + 10;
			flightTime = 1.1 + Math.random() * 0.4;
			vy = -(y - targetY) / flightTime / 60;
			vx = (targetX - x) / flightTime / 60;
		} else {
			// Side-arc: launches from screen edge, arcs across.
			const fromLeft = Math.random() < 0.5;
			x = fromLeft ? -10 : width + 10;
			y = height * (0.55 + Math.random() * 0.30);
			const targetX = fromLeft ? width * (0.45 + Math.random() * 0.35) : width * (0.20 + Math.random() * 0.35);
			const targetY = height * (0.20 + Math.random() * 0.20);
			flightTime = 1.3 + Math.random() * 0.5;
			vx = (targetX - x) / flightTime / 60;
			vy = (targetY - y) / flightTime / 60;
		}

		const rocket: Particle = {
			x, y, vx, vy,
			life: 0,
			maxLife: flightTime * 60,
			hue,
			size: 2.6,
			kind: 'rocket',
			gravity: launchStyle === 'side-arc' ? 0.008 : 0.012,
			drag: 0.999,
			burstType
		};
		if (burstType === 'double') {
			rocket.secondaryBurstAt = 350 + Math.random() * 200;
		}
		particles.push(rocket);
	}

	function explode(p: Particle, now: number) {
		const type: BurstType = p.burstType ?? 'standard';

		switch (type) {
			case 'ring': {
				// Thin shell — sparks all at the same speed, fixed life.
				const count = 80;
				const speed = 3.2;
				for (let i = 0; i < count; i++) {
					const angle = (i / count) * Math.PI * 2;
					particles.push({
						x: p.x, y: p.y,
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						life: 0, maxLife: 75,
						hue: p.hue + (Math.random() - 0.5) * 6,
						size: 1.7,
						kind: 'spark',
						gravity: 0.045, drag: 0.975
					});
				}
				break;
			}
			case 'willow': {
				// Slow gold cascade — sparks fall under heavier gravity, long life.
				const count = 90;
				for (let i = 0; i < count; i++) {
					const angle = (i / count) * Math.PI * 2 + Math.random() * 0.15;
					const speed = 1.2 + Math.random() * 1.4;
					particles.push({
						x: p.x, y: p.y,
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed - 0.3,
						life: 0, maxLife: 110 + Math.random() * 50,
						hue: 40 + Math.random() * 15, // forced gold regardless of palette
						size: 1.5 + Math.random() * 0.8,
						kind: 'spark',
						gravity: 0.07, drag: 0.985
					});
				}
				break;
			}
			case 'palm': {
				// A few thick fronds arcing outward and down.
				const count = 10;
				for (let i = 0; i < count; i++) {
					const angle = -Math.PI / 2 + (i / (count - 1) - 0.5) * Math.PI * 0.9;
					const speed = 4.5 + Math.random() * 1.5;
					// Each "frond" is a chain of sparks emitted from the rocket pos.
					for (let s = 0; s < 14; s++) {
						const trailDelay = s * 0.5;
						particles.push({
							x: p.x + Math.cos(angle) * trailDelay * 4,
							y: p.y + Math.sin(angle) * trailDelay * 4,
							vx: Math.cos(angle) * speed * (1 - s * 0.04),
							vy: Math.sin(angle) * speed * (1 - s * 0.04),
							life: s * 1.5, maxLife: 90 + Math.random() * 30,
							hue: p.hue + (Math.random() - 0.5) * 8,
							size: 2.2 - s * 0.05,
							kind: 'spark',
							gravity: 0.055, drag: 0.975
						});
					}
				}
				break;
			}
			case 'double': {
				// First pop — small.
				const count = 35;
				for (let i = 0; i < count; i++) {
					const angle = (i / count) * Math.PI * 2;
					const speed = 1.5 + Math.random() * 1.0;
					particles.push({
						x: p.x, y: p.y,
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						life: 0, maxLife: 50,
						hue: p.hue,
						size: 1.4,
						kind: 'spark',
						gravity: 0.05, drag: 0.97
					});
				}
				// Then a secondary rocket at the same position, immediately exploding bigger.
				setTimeout(() => {
					const big: Particle = {
						x: p.x, y: p.y, vx: 0, vy: 0,
						life: 0, maxLife: 0,
						hue: p.hue,
						size: 0,
						kind: 'rocket',
						gravity: 0, drag: 1,
						burstType: 'standard'
					};
					explode(big, performance.now());
				}, p.secondaryBurstAt ?? 400);
				break;
			}
			case 'crossette': {
				// Break-and-rebreak shell. Outer break: ~24 medium sparks
				// arranged evenly. Each carries a splitAt lifetime, after
				// which it pops into a mini-burst of ~12 smaller fragments
				// in a contrasting hue.
				const count = 24;
				const childHue = (p.hue + 60 + Math.random() * 60) % 360;
				for (let i = 0; i < count; i++) {
					const angle = (i / count) * Math.PI * 2 + Math.random() * 0.08;
					const speed = 2.4 + Math.random() * 1.2;
					particles.push({
						x: p.x, y: p.y,
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						life: 0,
						maxLife: 95,
						hue: p.hue,
						size: 2.0,
						kind: 'spark',
						gravity: 0.04,
						drag: 0.978,
						splitAt: 36 + Math.random() * 8,
						childHue
					});
				}
				break;
			}
			case 'standard':
			default: {
				const count = 80 + Math.floor(Math.random() * 40);
				for (let i = 0; i < count; i++) {
					const angle = (i / count) * Math.PI * 2 + Math.random() * 0.12;
					const speed = 1.5 + Math.random() * 3.6;
					particles.push({
						x: p.x, y: p.y,
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						life: 0, maxLife: 65 + Math.random() * 50,
						hue: p.hue + (Math.random() - 0.5) * 14,
						size: 1.7 + Math.random() * 1.3,
						kind: 'spark',
						gravity: 0.05, drag: 0.972
					});
				}
				break;
			}
		}
	}

	function tick(now: number) {
		if (!ctx || !running) return;
		const delta = lastFrame ? Math.min((now - lastFrame) / 16.67, 2) : 1;
		lastFrame = now;

		// Trailing fade. We're using source-over for the sparks (better
		// visibility on light bg) so use a more aggressive fade to keep
		// trails from accumulating into a smudge.
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(0,0,0,0.22)';
		ctx.fillRect(0, 0, width, height);
		ctx.globalCompositeOperation = 'source-over';

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
				// Trail particles while climbing/arcing.
				next.push({
					x: p.x + (Math.random() - 0.5) * 1.2,
					y: p.y,
					vx: 0,
					vy: 0.4 + Math.random() * 0.3,
					life: 0,
					maxLife: 14 + Math.random() * 10,
					hue: p.hue,
					size: 1.2,
					kind: 'trail',
					gravity: 0,
					drag: 0.92
				});
				// Vertical/angled rockets explode at apex (vy >= 0). Side-arcs
				// have positive vy throughout so we rely on maxLife only.
				if (p.life >= p.maxLife) {
					explode(p, now);
					continue;
				}
			} else if (p.kind === 'spark' && p.splitAt !== undefined && p.life >= p.splitAt) {
				// Crossette break — this spark mini-explodes into a small
				// burst of fragments in the child hue.
				const fragments = 11;
				const speed = 1.4 + Math.random() * 0.6;
				for (let i = 0; i < fragments; i++) {
					const angle = (i / fragments) * Math.PI * 2 + Math.random() * 0.2;
					particles.push({
						x: p.x, y: p.y,
						// Inherit half the parent's velocity so the mini-burst
						// trails realistically rather than starting from rest.
						vx: p.vx * 0.4 + Math.cos(angle) * speed,
						vy: p.vy * 0.4 + Math.sin(angle) * speed,
						life: 0,
						maxLife: 38 + Math.random() * 16,
						hue: (p.childHue ?? p.hue) + (Math.random() - 0.5) * 10,
						size: 1.1 + Math.random() * 0.4,
						kind: 'spark',
						gravity: 0.05,
						drag: 0.97
					});
				}
				continue; // remove the original — it has split.
			} else if (p.life >= p.maxLife) {
				continue;
			}

			const alpha = 1 - p.life / p.maxLife;

			if (p.kind === 'spark') {
				// Halo: larger, darker, more saturated — gives definition on
				// light backgrounds. Drawn first so the bright core overlays it.
				ctx.fillStyle = `hsla(${p.hue}, 80%, 30%, ${alpha * 0.45})`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * 1.7, 0, Math.PI * 2);
				ctx.fill();

				// Core: bright centre.
				ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${alpha})`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fill();

				// Hot centre — almost-white pinprick.
				ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${alpha * 0.9})`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
				ctx.fill();
			} else if (p.kind === 'rocket') {
				ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${alpha})`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fill();
			} else {
				// Trail — soft, fades quickly.
				ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha * 0.65})`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fill();
			}
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
