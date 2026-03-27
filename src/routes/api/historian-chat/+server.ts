import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

const SYSTEM_PROMPT = `You are the Historian Concierge for Marianne Cottage, a beautifully restored 1800s longère (long farmhouse) at 1 La Haye, Couvains, Normandy, France. Your role is to be a knowledgeable, warm, and cultured guide to both the cottage's rich heritage and the surrounding Normandy region.

The cottage bears the name "Marianne" — the national symbol of the French Republic, representing Liberty, Equality, and Fraternity. Built as a traditional longère typical of the Bessin region, restored using sympathetic materials: original lime-wash (chaux), reclaimed oak beams, and local Pierre de Caen stone.

Key local knowledge:
- Cerisy-la-Forêt Abbey (founded 1032) is 5 minutes away — a Norman Romanesque masterpiece, founded by Robert the Magnificent, father of William the Conqueror
- Positioned between Omaha Beach (US sector, ~25km north) and Gold Beach (British sector, ~20km north)
- The bocage landscape — ancient earthen-banked hedgerows that defined the 1944 campaign — surrounds the property
- Traditional Normandy apple orchard on the grounds (cider and Calvados heritage)
- Resident tawny owls, kestrels, and roe deer visit the garden at dawn

Speak with warmth and historical depth. Keep responses to 3–5 sentences — evocative, never dry. Occasionally use a French phrase naturally when it fits. If asked about booking, direct guests to check availability on the main website.`;

const MOCK: Record<string, string> = {
	welcome: `*Bienvenue à Marianne Cottage.* I am your Historian Concierge — part guide to the cottage's 200-year story, part expert in all things Normandy. You might ask me about the D-Day beaches, the 11th-century Abbey five minutes away, the wildlife that visits the garden at dawn, or how to find the best Calvados in the region. Where shall we begin?`,

	history: `Marianne Cottage takes its name from the symbol of the French Republic herself — Liberty personified. This 1800s longère was built in the Bessin tradition: walls thick enough to keep out a Normandy winter, oak beams felled from the surrounding bocage forests. Our restoration used only authentic materials — *chaux* (lime-wash), reclaimed timbers, and Pierre de Caen limestone — so the cottage breathes as it always has. It is a home that remembers.`,

	dday: `You are perfectly positioned for the D-Day circuit. I would suggest beginning at dawn at Pointe du Hoc — arriving before the tour coaches — then following the coast eastward through Omaha Beach to the American Cemetery at Colleville-sur-Mer. After lunch in Bayeux (the Tapestry is unmissable), the afternoon could take you to Arromanches and the Mulberry Harbour remnants still visible in the sea. The full circuit is 90km — a profound day that deserves quiet reflection when you return.`,

	abbey: `Cerisy-la-Forêt Abbey is five minutes by car, yet few visitors find it — which makes it all the more extraordinary. Founded in 1032 by Robert the Magnificent, Duke of Normandy and father of William the Conqueror, its nave is one of the finest surviving examples of Norman Romanesque architecture. I always recommend arriving before 9am when the morning light through the limestone columns is at its most luminous, before the rest of the world arrives.`,

	wildlife: `The garden at Marianne Cottage has its own quiet rhythm. The tawny owls that nest in the old apple trees begin calling at dusk — you will hear them before you see them. Roe deer occasionally step from the bocage hedgerows at first light, and kestrels hunt the open meadow to the east. My standing advice: take your coffee outside at dawn, before you have any plans, and simply listen to what Normandy sounds like when it is not performing for anyone.`,

	food: `Normandy feeds you in layers. The Calvados — apple brandy distilled from orchards like ours — is as much ritual as drink; a *trou normand* (a small glass between courses) is tradition here. The Saturday morning market in Saint-Lô is the finest introduction to local produce in the region. For dinner, the restaurants in Bayeux serve excellent locally-sourced Norman cuisine — camembert from the source, cream from dairy herds you will have passed on the road.`,

	booking: `To check availability for your dates, our booking page shows the real-time calendar for both en-suite rooms. The Double Room and the Twin Room each look out over the garden, and breakfast is included — prepared using local produce from the surrounding farms. Shall I tell you more about what each room offers, or is there something about the region I can help you plan around?`,

	bocage: `The bocage is what makes Normandy distinct from anywhere else in France — a patchwork of small fields enclosed by high earthen banks crowned with ancient hedgerows, some dating back to Gallo-Roman times. From the cottage garden, you can trace three such lines of bocage marking boundaries that have not moved in centuries. In June 1944, these same hedgerows slowed the Allied advance considerably — every field was a potential ambush. Today they are simply beautiful, and harbour an extraordinary density of wildlife.`,

	default: `Marianne Cottage sits at the heart of one of history's most resonant landscapes. Whether you are drawn by the D-Day heritage, the 11th-century Abbey of Cerisy-la-Forêt five minutes away, the apple orchards and their Calvados tradition, or simply the extraordinary quiet of the dairy country at dawn — I am here to help you find your way in. What would you like to discover?`
};

function getMock(msg: string): string {
	const s = msg.toLowerCase();
	if (/\b(hello|hi|bonjour|start|begin|help|hey)\b/.test(s)) return MOCK.welcome;
	if (/\b(history|story|marianne|long[eè]re|restore|built|1800|barn|farmhouse|origin)\b/.test(s))
		return MOCK.history;
	if (/\b(d-?day|beach|omaha|gold|juno|sword|utah|war|1944|allied|american|british|itinerary|memorial|cemetery|landing)\b/.test(s))
		return MOCK.dday;
	if (/\b(abbey|cerisy|church|romanesque|william|conqueror|robert|monks?|monastery)\b/.test(s))
		return MOCK.abbey;
	if (/\b(wildlife|owl|kestrel|deer|nature|garden|dawn|bird|animal|orchard|quiet)\b/.test(s))
		return MOCK.wildlife;
	if (/\b(food|eat|restaurant|calvados|cider|cheese|camembert|market|cuisine|drink|wine|dinner)\b/.test(s))
		return MOCK.food;
	if (/\b(book|availab|stay|room|price|cost|rate|night|reserv|check.?in)\b/.test(s))
		return MOCK.booking;
	if (/\b(bocage|hedge|landscape|country|field|terrain|region|terrain)\b/.test(s)) return MOCK.bocage;
	return MOCK.default;
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		message: string;
		history: Array<{ role: string; content: string }>;
	};

	if (env.ANTHROPIC_API_KEY) {
		try {
			const res = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': env.ANTHROPIC_API_KEY,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model: 'claude-sonnet-4-6',
					max_tokens: 400,
					system: SYSTEM_PROMPT,
					messages: [...body.history, { role: 'user', content: body.message }]
				})
			});

			if (res.ok) {
				const data = (await res.json()) as { content: Array<{ text: string }> };
				return json({ reply: data.content[0].text, mode: 'live' });
			}
		} catch {
			// fall through to mock
		}
	}

	// Realistic typing delay for mock
	await new Promise((r) => setTimeout(r, 700 + Math.random() * 800));
	return json({ reply: getMock(body.message), mode: 'mock' });
};
