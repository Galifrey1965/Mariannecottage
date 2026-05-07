<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		depth: string;
		alt: string;
		strength?: number;
		easing?: number;
	}

	let { src, depth, alt, strength = 0.1, easing = 0.2 }: Props = $props();

	let imgEl: HTMLImageElement;

	onMount(() => {
		if (!imgEl) return;
		const container = imgEl.parentElement;
		if (!container) return;

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const canvas = document.createElement('canvas');
		canvas.style.cssText = 'display:block;width:100%;height:100%';
		canvas.setAttribute('aria-hidden', 'true');

		const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
		if (!gl) return;

		const vsSrc = `
			attribute vec2 aPos;
			varying vec2 vUv;
			void main() {
				vUv = aPos * 0.5 + 0.5;
				gl_Position = vec4(aPos, 0.0, 1.0);
			}
		`;
		const fsSrc = `
			precision highp float;
			uniform sampler2D uImage;
			uniform sampler2D uDepth;
			uniform vec2 uMouse;
			uniform float uStrength;
			uniform vec2 uTexScale;
			uniform vec2 uTexOffset;
			varying vec2 vUv;
			void main() {
				vec2 baseUv = vUv * uTexScale + uTexOffset;
				float d = texture2D(uDepth, baseUv).r;
				vec2 sampleUv = baseUv - uMouse * d * uStrength;
				gl_FragColor = texture2D(uImage, sampleUv);
			}
		`;

		function compile(type: number, source: string) {
			const sh = gl!.createShader(type)!;
			gl!.shaderSource(sh, source);
			gl!.compileShader(sh);
			if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
				console.error('[ParallaxImage] shader error', gl!.getShaderInfoLog(sh));
				return null;
			}
			return sh;
		}
		const vs = compile(gl.VERTEX_SHADER, vsSrc);
		const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
		if (!vs || !fs) return;
		const prog = gl.createProgram()!;
		gl.attachShader(prog, vs);
		gl.attachShader(prog, fs);
		gl.linkProgram(prog);
		gl.useProgram(prog);

		const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(prog, 'aPos');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		const uImage = gl.getUniformLocation(prog, 'uImage');
		const uDepth = gl.getUniformLocation(prog, 'uDepth');
		const uMouse = gl.getUniformLocation(prog, 'uMouse');
		const uStrength = gl.getUniformLocation(prog, 'uStrength');
		const uTexScale = gl.getUniformLocation(prog, 'uTexScale');
		const uTexOffset = gl.getUniformLocation(prog, 'uTexOffset');

		function makeTex(unit: number) {
			const t = gl!.createTexture();
			gl!.activeTexture(gl!.TEXTURE0 + unit);
			gl!.bindTexture(gl!.TEXTURE_2D, t);
			gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
			gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
			return t;
		}

		function loadImage(url: string): Promise<HTMLImageElement> {
			return new Promise((res, rej) => {
				const img = new Image();
				img.onload = () => res(img);
				img.onerror = () => rej(new Error('failed to load ' + url));
				img.src = url;
			});
		}

		let imgW = 0, imgH = 0;
		let aborted = false;
		let rafId = 0;
		let isAnimating = false;
		let canvasInserted = false;
		let targetX = 0, targetY = 0;
		let currentX = 0, currentY = 0;

		function requestFrame() {
			if (isAnimating || aborted) return;
			isAnimating = true;
			rafId = requestAnimationFrame(loop);
		}

		function updateCoverTransform(canvasW: number, canvasH: number) {
			if (!imgW || !imgH || !gl) return;
			const canvasAspect = canvasW / canvasH;
			const imgAspect = imgW / imgH;
			let scaleX = 1, scaleY = 1, offX = 0, offY = 0;
			if (canvasAspect > imgAspect) {
				scaleY = imgAspect / canvasAspect;
				offY = (1 - scaleY) / 2;
			} else {
				scaleX = canvasAspect / imgAspect;
				offX = (1 - scaleX) / 2;
			}
			const pad = strength;
			const innerScaleX = scaleX * (1 - 2 * pad);
			const innerScaleY = scaleY * (1 - 2 * pad);
			const innerOffX = offX + scaleX * pad;
			const innerOffY = offY + scaleY * pad;
			gl.uniform2f(uTexScale, innerScaleX, innerScaleY);
			gl.uniform2f(uTexOffset, innerOffX, innerOffY);
		}

		function resize() {
			if (!gl || aborted || !canvasInserted) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const rect = container!.getBoundingClientRect();
			canvas.width = Math.round(rect.width * dpr);
			canvas.height = Math.round(rect.height * dpr);
			gl.viewport(0, 0, canvas.width, canvas.height);
			updateCoverTransform(rect.width, rect.height);
		}

		Promise.all([loadImage(src), loadImage(depth)]).then(([photo, depthImg]) => {
			if (aborted) return;
			imgW = photo.naturalWidth;
			imgH = photo.naturalHeight;

			makeTex(0);
			gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, photo);
			makeTex(1);
			gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.LUMINANCE, gl!.LUMINANCE, gl!.UNSIGNED_BYTE, depthImg);

			gl!.uniform1i(uImage, 0);
			gl!.uniform1i(uDepth, 1);
			gl!.uniform1f(uStrength, strength);

			// Hide the static <img> and insert the canvas.
			imgEl.style.display = 'none';
			container!.appendChild(canvas);
			canvasInserted = true;

			resize();
			gl!.uniform2f(uMouse, 0, 0);
			gl!.drawArrays(gl!.TRIANGLES, 0, 6);
		}).catch((e) => {
			console.warn('[ParallaxImage] texture load failed, keeping static image', e);
			aborted = true;
		});

		function loop() {
			if (aborted || !gl) {
				isAnimating = false;
				return;
			}
			const dx = targetX - currentX;
			const dy = targetY - currentY;
			const settled = Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005;
			if (settled) {
				currentX = targetX;
				currentY = targetY;
			} else {
				currentX += dx * easing;
				currentY += dy * easing;
			}
			gl.uniform2f(uMouse, currentX, currentY);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			if (settled) {
				isAnimating = false;
				return;
			}
			rafId = requestAnimationFrame(loop);
		}

		function onPointerMove(e: PointerEvent) {
			if (reducedMotion || !canvasInserted) return;
			const rect = container!.getBoundingClientRect();
			targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
			targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
			requestFrame();
		}
		function onPointerLeave() {
			if (reducedMotion || !canvasInserted) return;
			targetX = 0; targetY = 0;
			requestFrame();
		}
		function onOrientation(e: DeviceOrientationEvent) {
			if (reducedMotion || !canvasInserted) return;
			if (e.beta == null || e.gamma == null) return;
			targetX = Math.max(-1, Math.min(1, (e.gamma || 0) / 30));
			targetY = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 30));
			requestFrame();
		}
		function onResize() {
			resize();
			requestFrame();
		}

		if (!reducedMotion) {
			container.addEventListener('pointermove', onPointerMove);
			container.addEventListener('pointerleave', onPointerLeave);
			window.addEventListener('deviceorientation', onOrientation);
		}
		window.addEventListener('resize', onResize);

		return () => {
			aborted = true;
			cancelAnimationFrame(rafId);
			if (canvasInserted) canvas.remove();
			container?.removeEventListener('pointermove', onPointerMove);
			container?.removeEventListener('pointerleave', onPointerLeave);
			window.removeEventListener('deviceorientation', onOrientation);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<img bind:this={imgEl} {src} {alt} style="display:block;width:100%;height:100%;object-fit:cover" />
