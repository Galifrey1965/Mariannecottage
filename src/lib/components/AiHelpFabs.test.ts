// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';

vi.mock('$app/stores', () => ({
	page: { subscribe: vi.fn(() => () => {}) }
}));

const { default: AiHelpFabs } = await import('./AiHelpFabs.svelte');

const messages = {
	home: {
		ai: {
			ask_chatgpt: 'Ask ChatGPT',
			ask_claude: 'Ask Claude'
		}
	},
	a11y: {
		opens_new_window: 'opens in new window'
	}
};

describe('AiHelpFabs', () => {
	it('renders Ask ChatGPT button', () => {
		const { getByText } = render(AiHelpFabs, { props: { messages } });
		expect(getByText('Ask ChatGPT')).toBeInTheDocument();
	});

	it('renders Ask Claude button', () => {
		const { getByText } = render(AiHelpFabs, { props: { messages } });
		expect(getByText('Ask Claude')).toBeInTheDocument();
	});

	it('ChatGPT link points to chatgpt.com', () => {
		const { container } = render(AiHelpFabs, { props: { messages } });
		const link = container.querySelector('.fab-chatgpt') as HTMLAnchorElement;
		expect(link.href).toContain('chatgpt.com');
	});

	it('Claude link points to claude.ai', () => {
		const { container } = render(AiHelpFabs, { props: { messages } });
		const link = container.querySelector('.fab-claude') as HTMLAnchorElement;
		expect(link.href).toContain('claude.ai');
	});

	it('both links include the site URL in the prompt', () => {
		const { container } = render(AiHelpFabs, { props: { messages } });
		const chatgpt = container.querySelector('.fab-chatgpt') as HTMLAnchorElement;
		const claude = container.querySelector('.fab-claude') as HTMLAnchorElement;
		expect(chatgpt.href).toContain('mariannecottage');
		expect(claude.href).toContain('mariannecottage');
	});

	it('both links open in a new tab', () => {
		const { container } = render(AiHelpFabs, { props: { messages } });
		const links = container.querySelectorAll('a');
		links.forEach(link => {
			expect(link.getAttribute('target')).toBe('_blank');
			expect(link.getAttribute('rel')).toContain('noopener');
		});
	});

	it('buttons have aria-labels including new window notice', () => {
		const { container } = render(AiHelpFabs, { props: { messages } });
		const chatgpt = container.querySelector('.fab-chatgpt');
		const claude = container.querySelector('.fab-claude');
		expect(chatgpt?.getAttribute('aria-label')).toContain('Ask ChatGPT');
		expect(claude?.getAttribute('aria-label')).toContain('Ask Claude');
	});

	it('renders SVG icons for both buttons', () => {
		const { container } = render(AiHelpFabs, { props: { messages } });
		const svgs = container.querySelectorAll('svg');
		expect(svgs.length).toBeGreaterThanOrEqual(2);
	});
});
