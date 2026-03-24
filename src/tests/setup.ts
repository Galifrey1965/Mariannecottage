import '@testing-library/jest-dom/vitest';

// Suppress SMUI MDC foundation cleanup errors in test environment.
// MDC tries to access DOM elements already removed during teardown.
process.on('unhandledRejection', (reason: unknown) => {
	if (reason instanceof TypeError && (reason as TypeError).message?.includes('removeEventListener')) return;
	throw reason;
});

process.on('uncaughtException', (error: Error) => {
	if (error instanceof TypeError && error.message?.includes('querySelector')) return;
	if (error instanceof TypeError && error.message?.includes('removeEventListener')) return;
	throw error;
});
