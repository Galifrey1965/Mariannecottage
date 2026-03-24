import '@testing-library/jest-dom/vitest';

// Suppress SMUI MDC foundation cleanup errors in test environment.
// MDC tries to deregister event handlers on elements already removed from DOM during teardown.
process.on('unhandledRejection', (reason: unknown) => {
	if (reason instanceof TypeError && (reason as TypeError).message?.includes('removeEventListener')) return;
	// Re-throw non-SMUI errors
	throw reason;
});
