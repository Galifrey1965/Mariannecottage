// Reusable modal accessibility actions:
//   * `modalA11y` — apply to the modal container. Traps Tab focus, handles
//     Escape (calls onClose), and moves initial focus to the first focusable
//     descendant on mount.
//
// Use as:
//   <div use:modalA11y={{ onClose: () => (open = false) }}>...</div>

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(', ');

export type ModalA11yOptions = {
	onClose: () => void;
	// Skip auto-focus on mount (e.g. when the modal manages its own focus).
	skipInitialFocus?: boolean;
};

export function modalA11y(node: HTMLElement, options: ModalA11yOptions) {
	let opts = options;

	const previouslyFocused = document.activeElement as HTMLElement | null;

	function getFocusable(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
			.filter((el) => el.offsetParent !== null || el === document.activeElement);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			opts.onClose();
			return;
		}
		if (event.key !== 'Tab') return;
		const focusable = getFocusable();
		if (focusable.length === 0) {
			event.preventDefault();
			return;
		}
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement as HTMLElement | null;
		if (event.shiftKey) {
			if (active === first || !node.contains(active)) {
				event.preventDefault();
				last.focus();
			}
		} else {
			if (active === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}

	if (!opts.skipInitialFocus) {
		const focusable = getFocusable();
		if (focusable.length > 0) {
			queueMicrotask(() => focusable[0].focus());
		} else {
			if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
			queueMicrotask(() => node.focus());
		}
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		update(newOptions: ModalA11yOptions) {
			opts = newOptions;
		},
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
			// Restore focus to whatever opened the modal so screen-reader users
			// don't lose context.
			if (previouslyFocused && document.body.contains(previouslyFocused)) {
				previouslyFocused.focus();
			}
		}
	};
}
