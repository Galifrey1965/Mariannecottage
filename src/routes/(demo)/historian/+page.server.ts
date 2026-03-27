import { env } from '$env/dynamic/private';

export function load() {
	return {
		hasApiKey: !!env.ANTHROPIC_API_KEY
	};
}
