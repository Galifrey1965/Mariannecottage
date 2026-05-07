// Single source of truth for cottage identity, address, and contact
// details. Anywhere in the codebase that referenced these as inline
// literals is suspect — if the cottage moves a building number or the
// owners switch phone provider, the change should land in one place.
//
// What lives here:
//   - Display names
//   - Postal address (structured + a pre-formatted single-line)
//   - GPS coordinates (canonical 6-decimal)
//   - Phone (E.164) + email
//
// What does NOT live here:
//   - Translated contact-line copy (messages/{en,fr,de}.json own those —
//     they're surrounding sentences, not structured data)
//   - The Netlify PUBLIC_SITE_URL env var (deploy-target-specific)

export const COTTAGE = {
	name: 'Marianne Cottage Bed and Breakfast',
	shortName: 'Marianne Cottage',

	address: {
		streetAddress: '1 La Haye',
		locality: 'Couvains',
		postalCode: '50680',
		// ISO 3166-1 alpha-2 — schema.org/PostalAddress expects this form.
		countryCode: 'FR',
		// Pre-joined single-line for plain-text rendering (map markers,
		// titles, structured content where one string is required).
		formattedSingleLine: '1 La Haye, 50680 Couvains, France'
	},

	location: {
		lat: 49.172937,
		lng: -0.988765
	},

	contact: {
		// E.164 — what schema.org/telephone expects. Localised renderings
		// (e.g. "+33 (0)7 80 73 17 04") live in messages/*.json.
		telephone: '+33 7 80 73 17 04',
		email: 'booking@mariannecottage.fr'
	}
} as const;
