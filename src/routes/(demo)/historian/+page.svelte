<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Message = { role: 'user' | 'assistant'; content: string };

	let chatOpen = $state(false);
	let inputValue = $state('');
	let isLoading = $state(false);
	let messagesEl: HTMLDivElement | undefined = $state();

	let messages = $state<Message[]>([
		{
			role: 'assistant',
			content: `*Bienvenue à Marianne Cottage.* I am your Historian Concierge — part guide to the cottage's 200-year story, part expert in all things Normandy. Ask me about the D-Day beaches, the Abbey five minutes away, the wildlife at dawn, or the best Calvados in the region. Where shall we begin?`
		}
	]);

	const DEMO_QUESTIONS = [
		'Tell me about the history of Marianne Cottage',
		'Plan me a D-Day itinerary',
		"What's near the cottage?",
		'Tell me about Cerisy-la-Forêt Abbey',
		'What wildlife might I see at dawn?',
		'Where should I eat locally?',
		'Tell me about the bocage landscape',
		'How do I book a stay?'
	];

	async function sendMessage(text: string) {
		if (!text.trim() || isLoading) return;
		const userMsg = text.trim();
		inputValue = '';
		messages = [...messages, { role: 'user', content: userMsg }];
		isLoading = true;

		const history = messages.slice(1, -1).map((m) => ({ role: m.role, content: m.content }));

		try {
			const res = await fetch('/api/historian-chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: userMsg, history })
			});
			const d = await res.json();
			messages = [...messages, { role: 'assistant', content: d.reply }];
		} catch {
			messages = [
				...messages,
				{
					role: 'assistant',
					content: 'I seem to have lost my quill for a moment. Please try again shortly.'
				}
			];
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		// scroll to bottom whenever messages change
		void messages.length;
		if (messagesEl) {
			setTimeout(() => {
				if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
			}, 60);
		}
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage(inputValue);
		}
	}

	function fmt(text: string): string {
		return text
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/\n\n/g, '</p><p>')
			.replace(/\n/g, '<br/>');
	}
</script>

<svelte:head>
	<title>The Historian Concierge — Marianne Cottage</title>
</svelte:head>

<div class="grain" aria-hidden="true"></div>

<!-- Hero -->
<section class="hero">
	<img src="/images/2024-08-15.jpg" alt="Marianne Cottage at dusk" class="hero-img" />
	<div class="hero-overlay">
		<div class="hero-content">
			<p class="eyebrow">Marianne Cottage · Couvains, Normandy</p>
			<h1 class="hero-title">The Historian<br />Concierge</h1>
			<p class="hero-sub">Your personal guide to 1,000 years of Norman heritage</p>
			<button class="hero-cta" onclick={() => (chatOpen = true)}>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					><path d="M20 2c0 0-6 2-8 8s0 12 0 12" /><path d="M12 22c0 0-4-4-8-4" /><path
						d="M12 10L8 14"
					/></svg
				>
				Begin your journey
			</button>
		</div>
	</div>
	<div class="scroll-hint" aria-hidden="true">
		<span>scroll</span>
		<svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
			><path d="M6 2v16M1 13l5 5 5-5" /></svg
		>
	</div>
</section>

<!-- Intro -->
<section class="intro">
	<div class="intro-inner">
		<div class="intro-text">
			<h2>A house with 200 years of stories to tell</h2>
			<p>
				Marianne Cottage was built as a <em>longère</em> — a traditional Norman long farmhouse — in
				the early 1800s. Sympathetically restored using original lime-wash, reclaimed oak beams, and
				local Pierre de Caen stone, it sits at the heart of a landscape where history is not confined
				to museums.
			</p>
			<p>
				Five minutes from a Romanesque abbey founded in 1032. Twenty minutes from the D-Day beaches.
				Surrounded by the ancient <em>bocage</em> hedgerows that shaped the 1944 campaign. Our
				Historian Concierge is here to help you explore it all.
			</p>
		</div>
		<div class="pillars">
			{#each [{ icon: '⚔️', title: 'D-Day Heritage', desc: '~20km from Omaha & Gold Beach — perfectly placed for the full circuit' }, { icon: '⛪', title: 'Cerisy Abbey', desc: 'Norman Romanesque masterpiece, founded 1032 by Robert the Magnificent, 5 min away' }, { icon: '🍎', title: 'Calvados Country', desc: 'Orchard traditions, local cider & the finest Norman apple brandy' }, { icon: '🦉', title: 'Bocage Wildlife', desc: 'Tawny owls, kestrels & roe deer visit the garden edge at dawn' }] as p}
				<div class="pillar">
					<span class="pillar-icon">{p.icon}</span>
					<strong>{p.title}</strong>
					<p>{p.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

{#if !data.hasApiKey}
	<div class="mode-notice">
		<svg
			width="15"
			height="15"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg
		>
		Demo mode active — add <code>ANTHROPIC_API_KEY</code> to <code>.env</code> for live AI
	</div>
{/if}

<!-- Quill FAB -->
<button class="fab" class:open={chatOpen} onclick={() => (chatOpen = !chatOpen)} aria-label="Toggle Historian Concierge">
	{#if chatOpen}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
			><path d="M18 6L6 18M6 6l12 12" /></svg
		>
	{:else}
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			><path d="M20 2c0 0-6 2-8 8s0 12 0 12" /><path d="M12 22c0 0-4-4-8-4" /><path
				d="M12 10L8 14"
			/></svg
		>
	{/if}
</button>

<!-- Chat Panel -->
<aside class="chat-panel" class:open={chatOpen} aria-hidden={!chatOpen}>
	<div class="panel-header">
		<div class="panel-title">
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				><path d="M20 2c0 0-6 2-8 8s0 12 0 12" /><path d="M12 22c0 0-4-4-8-4" /><path
					d="M12 10L8 14"
				/></svg
			>
			Historian Concierge
		</div>
		<div class="panel-actions">
			<span class="badge" class:live={data.hasApiKey}>{data.hasApiKey ? '● LIVE' : '◎ DEMO'}</span>
			<button class="close-btn" onclick={() => (chatOpen = false)} aria-label="Close">
				<svg
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					><path d="M18 6L6 18M6 6l12 12" /></svg
				>
			</button>
		</div>
	</div>

	<div class="chip-row">
		{#each DEMO_QUESTIONS as q}
			<button class="chip" onclick={() => sendMessage(q)} disabled={isLoading}>{q}</button>
		{/each}
	</div>

	<div class="messages" bind:this={messagesEl}>
		{#each messages as msg}
			<div class="msg" class:user={msg.role === 'user'} class:assistant={msg.role === 'assistant'}>
				{#if msg.role === 'assistant'}
					<div class="avatar">
						<svg
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							><path d="M20 2c0 0-6 2-8 8s0 12 0 12" /><path d="M12 22c0 0-4-4-8-4" /><path
								d="M12 10L8 14"
							/></svg
						>
					</div>
				{/if}
				<div class="bubble">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<p>{@html fmt(msg.content)}</p>
				</div>
			</div>
		{/each}
		{#if isLoading}
			<div class="msg assistant">
				<div class="avatar">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						><path d="M20 2c0 0-6 2-8 8s0 12 0 12" /><path d="M12 22c0 0-4-4-8-4" /></svg
					>
				</div>
				<div class="bubble typing">
					<span></span><span></span><span></span>
				</div>
			</div>
		{/if}
	</div>

	<div class="input-row">
		<textarea
			class="chat-input"
			bind:value={inputValue}
			onkeydown={onKeydown}
			placeholder="Ask about Normandy history…"
			rows="2"
			disabled={isLoading}
		></textarea>
		<button
			class="send-btn"
			onclick={() => sendMessage(inputValue)}
			disabled={isLoading || !inputValue.trim()}
			aria-label="Send"
		>
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" /></svg
			>
		</button>
	</div>
</aside>

<nav class="demo-footer-nav" aria-label="Demo pages">
	<a href="/demo">← All demos</a>
	<span>|</span>
	<a href="/">← Site</a>
	<span>|</span>
	<a href="/historian" aria-current="page">historian</a>
	<a href="/living">living</a>
	<a href="/nature">nature</a>
	<a href="/story">story</a>
	<span>·</span>
	<a href="/brutal">brutal</a>
	<a href="/calm">calm</a>
	<a href="/bento">bento</a>
	<a href="/kinetic">kinetic</a>
	<a href="/adaptive">adaptive</a>
	<a href="/ambient">ambient</a>
	<a href="/context">context</a>
	<a href="/retro">retro</a>
	<a href="/expressive">expressive</a>
	<a href="/spatial">spatial</a>
	<a href="/micro">micro</a>
	<a href="/ergonomic">ergonomic</a>
	<a href="/liquid">liquid</a>
	· <a href="/scroll-anim">scroll-anim</a> · <a href="/morph">morph</a> · <a href="/handmade">handmade</a> · <a href="/iridescent">iridescent</a> · <a href="/dday">dday</a>
</nav>

<style>
	/* ── Paper grain overlay ── */
	.grain {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 9999;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
		opacity: 0.4;
		mix-blend-mode: multiply;
	}

	/* ── Hero ── */
	.hero {
		position: relative;
		height: 100dvh;
		min-height: 560px;
		overflow: hidden;
	}
	.hero-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 40%;
	}
	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			rgba(58, 58, 58, 0.15) 0%,
			rgba(58, 58, 58, 0.55) 60%,
			rgba(58, 58, 58, 0.75) 100%
		);
		display: flex;
		align-items: flex-end;
		padding: 4rem 2rem;
	}
	.hero-content {
		max-width: 680px;
		color: #f0eee9;
	}
	.eyebrow {
		font-size: 0.75rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.8;
		margin-bottom: 1rem;
		font-weight: 500;
	}
	.hero-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.8rem, 6vw, 5rem);
		font-weight: 700;
		line-height: 1.05;
		margin-bottom: 1.2rem;
		color: #f0eee9;
	}
	.hero-sub {
		font-size: 1.1rem;
		opacity: 0.85;
		margin-bottom: 2rem;
		font-weight: 300;
		max-width: 420px;
	}
	.hero-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 1.8rem;
		background: rgba(240, 238, 233, 0.15);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(240, 238, 233, 0.4);
		border-radius: 2px;
		color: #f0eee9;
		font-size: 0.9rem;
		letter-spacing: 0.06em;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
		font-family: inherit;
	}
	.hero-cta:hover {
		background: rgba(240, 238, 233, 0.25);
		border-color: rgba(240, 238, 233, 0.7);
	}
	.scroll-hint {
		position: absolute;
		bottom: 1.5rem;
		right: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		color: rgba(240, 238, 233, 0.5);
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	/* ── Intro ── */
	.intro {
		background: #f0eee9;
		padding: 5rem 2rem;
	}
	.intro-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: start;
	}
	.intro-text h2 {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.6rem, 3vw, 2.2rem);
		font-weight: 600;
		line-height: 1.3;
		margin-bottom: 1.5rem;
		color: #3a3a3a;
	}
	.intro-text p {
		font-size: 1rem;
		line-height: 1.8;
		color: #5a5a5a;
		margin-bottom: 1rem;
	}
	.pillars {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	.pillar {
		background: #fff;
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		padding: 1.25rem;
	}
	.pillar-icon {
		font-size: 1.4rem;
		display: block;
		margin-bottom: 0.6rem;
	}
	.pillar strong {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: #3a3a3a;
		margin-bottom: 0.4rem;
	}
	.pillar p {
		font-size: 0.8rem;
		color: #6a6a6a;
		line-height: 1.6;
	}

	/* ── Mode notice ── */
	.mode-notice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		max-width: 1100px;
		margin: 0 auto 2rem;
		padding: 0.75rem 1rem;
		background: #f7f4ef;
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		font-size: 0.8rem;
		color: #6a6a6a;
	}
	.mode-notice code {
		background: #ede9e3;
		padding: 0.1em 0.4em;
		border-radius: 2px;
		font-size: 0.75rem;
	}

	/* ── Floating Quill FAB ── */
	.fab {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: #4a586e;
		border: none;
		color: #f0eee9;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 100;
		box-shadow:
			0 4px 16px rgba(74, 88, 110, 0.35),
			0 1px 4px rgba(0, 0, 0, 0.15);
		transition:
			transform 0.2s,
			background 0.2s,
			box-shadow 0.2s;
	}
	.fab:hover {
		background: #3a4a5c;
		transform: scale(1.06);
		box-shadow:
			0 6px 20px rgba(74, 88, 110, 0.45),
			0 2px 6px rgba(0, 0, 0, 0.2);
	}
	.fab.open {
		background: #3a3a3a;
	}

	/* ── Chat Panel ── */
	.chat-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(380px, 100vw);
		background: #faf8f4;
		border-left: 1px solid #d6ccc2;
		display: flex;
		flex-direction: column;
		z-index: 99;
		transform: translateX(100%);
		transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: -4px 0 24px rgba(58, 58, 58, 0.08);
	}
	.chat-panel.open {
		transform: translateX(0);
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #d6ccc2;
		background: #f0eee9;
	}
	.panel-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: #3a3a3a;
	}
	.panel-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.badge {
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		padding: 0.2em 0.55em;
		border-radius: 2px;
		background: #d6ccc2;
		color: #3a3a3a;
		font-weight: 600;
	}
	.badge.live {
		background: #4a586e;
		color: #f0eee9;
	}
	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #6a6a6a;
		padding: 0.25rem;
		border-radius: 2px;
		display: flex;
		transition: color 0.15s;
	}
	.close-btn:hover {
		color: #3a3a3a;
	}

	/* Chip row */
	.chip-row {
		display: flex;
		gap: 0.4rem;
		padding: 0.75rem 1rem;
		overflow-x: auto;
		border-bottom: 1px solid #ede9e3;
		scrollbar-width: none;
		flex-shrink: 0;
	}
	.chip-row::-webkit-scrollbar {
		display: none;
	}
	.chip {
		white-space: nowrap;
		padding: 0.35rem 0.75rem;
		background: #f0eee9;
		border: 1px solid #d6ccc2;
		border-radius: 2px;
		font-size: 0.72rem;
		color: #4a586e;
		cursor: pointer;
		font-family: inherit;
		transition:
			background 0.15s,
			border-color 0.15s;
		flex-shrink: 0;
	}
	.chip:hover:not(:disabled) {
		background: #e8e4de;
		border-color: #a9b7ac;
	}
	.chip:disabled {
		opacity: 0.5;
		cursor: default;
	}

	/* Messages */
	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		scroll-behavior: smooth;
	}
	.msg {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.msg.user {
		flex-direction: row-reverse;
	}
	.avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: #4a586e;
		color: #f0eee9;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 2px;
	}
	.bubble {
		max-width: 85%;
		padding: 0.7rem 0.9rem;
		border-radius: 3px;
		font-size: 0.84rem;
		line-height: 1.65;
	}
	.bubble p {
		margin: 0;
	}
	.msg.assistant .bubble {
		background: #fff;
		border: 1px solid #e4dfd8;
		color: #3a3a3a;
	}
	.msg.user .bubble {
		background: #4a586e;
		color: #f0eee9;
	}

	/* Typing indicator */
	.bubble.typing {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0.8rem 1rem;
		min-width: 56px;
	}
	.bubble.typing span {
		display: block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #a9b7ac;
		animation: dot 1.2s infinite;
	}
	.bubble.typing span:nth-child(2) {
		animation-delay: 0.2s;
	}
	.bubble.typing span:nth-child(3) {
		animation-delay: 0.4s;
	}
	@keyframes dot {
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		30% {
			transform: translateY(-4px);
			opacity: 1;
		}
	}

	/* Input */
	.input-row {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-top: 1px solid #d6ccc2;
		background: #f0eee9;
		align-items: flex-end;
	}
	.chat-input {
		flex: 1;
		resize: none;
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		padding: 0.6rem 0.75rem;
		font-family: inherit;
		font-size: 0.84rem;
		background: #fff;
		color: #3a3a3a;
		line-height: 1.5;
		outline: none;
		transition: border-color 0.15s;
	}
	.chat-input:focus {
		border-color: #4a586e;
	}
	.send-btn {
		width: 38px;
		height: 38px;
		border-radius: 3px;
		background: #4a586e;
		border: none;
		color: #f0eee9;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
	}
	.send-btn:hover:not(:disabled) {
		background: #3a4a5c;
	}
	.send-btn:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/* Responsive */
	@media (max-width: 700px) {
		.intro-inner {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		.pillars {
			grid-template-columns: 1fr 1fr;
		}
		.hero-overlay {
			padding: 2.5rem 1.5rem;
		}
	}
	@media (max-width: 480px) {
		.pillars {
			grid-template-columns: 1fr;
		}
		.fab {
			bottom: 1.25rem;
			right: 1.25rem;
		}
	}
	.demo-footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.75rem;
		align-items: center;
		justify-content: center;
		padding: 1rem 1.5rem;
		background: #1e2a1e;
		font-size: 0.72rem;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.05em;
	}
	.demo-footer-nav a {
		color: #8aab8a;
		text-decoration: none;
	}
	.demo-footer-nav a:hover { color: #fff; }
	.demo-footer-nav a[aria-current] { color: #fff; font-weight: 700; }
	.demo-footer-nav span { color: #4a6a4a; }
</style>
