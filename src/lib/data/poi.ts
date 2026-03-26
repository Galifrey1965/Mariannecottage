// Points of Interest — static data for the Explore page
// 20 POIs within 50km of Marianne Cottage (1 La Haye, 50680 Couvains)
// + Mont Saint-Michel exception (~71km, culturally unmissable)
//
// Images: populated after running `node scripts/download-poi-images.mjs`
// Distances: Haversine straight-line from 49.1728, -0.9887
// popularityScore: internal only — used for sorting, never shown in UI

export type PoiCategory = 'ww2' | 'heritage' | 'towns' | 'museums';

export type AccessibilityLevel = 'Good' | 'Moderate' | 'Limited';

export interface PoiImage {
	src: string; // e.g. /images/poi/omaha-beach/1.jpg
	alt: string;
	attribution: string; // Wikimedia Commons credit line
}

export interface Poi {
	id: string;
	category: PoiCategory;
	lat: number;
	lng: number;
	distanceKm: number;
	popularityScore: number; // 1–100, internal only
	accessibilityLevel: AccessibilityLevel;
	website: string | null;
	wikipedia: string | null;
	images: PoiImage[];
	titleKey: string;
	subtitleKey: string;
	summaryKey: string;
}

export const POIS: Poi[] = [
	{
		id: 'omaha-beach',
		category: 'ww2',
		lat: 49.3715,
		lng: -0.8885,
		distanceKm: 23.3,
		popularityScore: 93,
		accessibilityLevel: 'Good',
		website: 'https://www.normandie-tourisme.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/Omaha_Beach',
		images: [],
		titleKey: 'poi.omaha_beach.title',
		subtitleKey: 'poi.omaha_beach.subtitle',
		summaryKey: 'poi.omaha_beach.summary'
	},
	{
		id: 'american-cemetery',
		category: 'ww2',
		lat: 49.3603,
		lng: -0.8522,
		distanceKm: 23.1,
		popularityScore: 95,
		accessibilityLevel: 'Good',
		website: 'https://www.abmc.gov/Normandy',
		wikipedia: 'https://en.wikipedia.org/wiki/Normandy_American_Cemetery_and_Memorial',
		images: [],
		titleKey: 'poi.american_cemetery.title',
		subtitleKey: 'poi.american_cemetery.subtitle',
		summaryKey: 'poi.american_cemetery.summary'
	},
	{
		id: 'pointe-du-hoc',
		category: 'ww2',
		lat: 49.3942,
		lng: -0.9884,
		distanceKm: 24.7,
		popularityScore: 82,
		accessibilityLevel: 'Limited',
		website: 'https://www.abmc.gov/Pointe-du-Hoc',
		wikipedia: 'https://en.wikipedia.org/wiki/Pointe_du_Hoc',
		images: [],
		titleKey: 'poi.pointe_du_hoc.title',
		subtitleKey: 'poi.pointe_du_hoc.subtitle',
		summaryKey: 'poi.pointe_du_hoc.summary'
	},
	{
		id: 'bayeux',
		category: 'towns',
		lat: 49.2764,
		lng: -0.7031,
		distanceKm: 24.0,
		popularityScore: 90,
		accessibilityLevel: 'Good',
		website: 'https://www.bayeuxmuseum.com',
		wikipedia: 'https://en.wikipedia.org/wiki/Bayeux',
		images: [],
		titleKey: 'poi.bayeux.title',
		subtitleKey: 'poi.bayeux.subtitle',
		summaryKey: 'poi.bayeux.summary'
	},
	{
		id: 'arromanches',
		category: 'ww2',
		lat: 49.3408,
		lng: -0.6247,
		distanceKm: 32.5,
		popularityScore: 80,
		accessibilityLevel: 'Good',
		website: 'https://www.arromanches360.com',
		wikipedia: 'https://en.wikipedia.org/wiki/Arromanches-les-Bains',
		images: [],
		titleKey: 'poi.arromanches.title',
		subtitleKey: 'poi.arromanches.subtitle',
		summaryKey: 'poi.arromanches.summary'
	},
	{
		id: 'memorial-caen',
		category: 'museums',
		lat: 49.1936,
		lng: -0.3847,
		distanceKm: 44.2,
		popularityScore: 85,
		accessibilityLevel: 'Good',
		website: 'https://le-memorial-de-caen.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/M%C3%A9morial_de_Caen',
		images: [],
		titleKey: 'poi.memorial_caen.title',
		subtitleKey: 'poi.memorial_caen.subtitle',
		summaryKey: 'poi.memorial_caen.summary'
	},
	{
		id: 'utah-beach',
		category: 'ww2',
		lat: 49.4167,
		lng: -1.175,
		distanceKm: 30.3,
		popularityScore: 75,
		accessibilityLevel: 'Good',
		website: 'https://www.utah-beach.com',
		wikipedia: 'https://en.wikipedia.org/wiki/Utah_Beach',
		images: [],
		titleKey: 'poi.utah_beach.title',
		subtitleKey: 'poi.utah_beach.subtitle',
		summaryKey: 'poi.utah_beach.summary'
	},
	{
		id: 'la-cambe',
		category: 'ww2',
		lat: 49.3432,
		lng: -1.0266,
		distanceKm: 19.2,
		popularityScore: 68,
		accessibilityLevel: 'Good',
		website: null,
		wikipedia: 'https://en.wikipedia.org/wiki/La_Cambe_German_war_cemetery',
		images: [],
		titleKey: 'poi.la_cambe.title',
		subtitleKey: 'poi.la_cambe.subtitle',
		summaryKey: 'poi.la_cambe.summary'
	},
	{
		id: 'overlord-museum',
		category: 'museums',
		lat: 49.3479,
		lng: -0.8558,
		distanceKm: 21.8,
		popularityScore: 65,
		accessibilityLevel: 'Good',
		website: 'https://www.overlordmuseum.com',
		wikipedia: 'https://en.wikipedia.org/wiki/Overlord_Museum',
		images: [],
		titleKey: 'poi.overlord_museum.title',
		subtitleKey: 'poi.overlord_museum.subtitle',
		summaryKey: 'poi.overlord_museum.summary'
	},
	{
		id: 'cerisy-abbey',
		category: 'heritage',
		lat: 49.195,
		lng: -0.937,
		distanceKm: 4.5,
		popularityScore: 55,
		accessibilityLevel: 'Moderate',
		website: null,
		wikipedia: 'https://en.wikipedia.org/wiki/Cerisy_Abbey',
		images: [],
		titleKey: 'poi.cerisy_abbey.title',
		subtitleKey: 'poi.cerisy_abbey.subtitle',
		summaryKey: 'poi.cerisy_abbey.summary'
	},
	{
		id: 'saint-lo',
		category: 'towns',
		lat: 49.1155,
		lng: -1.0828,
		distanceKm: 9.4,
		popularityScore: 50,
		accessibilityLevel: 'Good',
		website: 'https://www.saint-lo.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/Saint-L%C3%B4',
		images: [],
		titleKey: 'poi.saint_lo.title',
		subtitleKey: 'poi.saint_lo.subtitle',
		summaryKey: 'poi.saint_lo.summary'
	},
	{
		id: 'haras-national',
		category: 'heritage',
		lat: 49.1197,
		lng: -1.0786,
		distanceKm: 8.8,
		popularityScore: 40,
		accessibilityLevel: 'Good',
		website: 'https://www.haras-nationaux.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/Haras_national_de_Saint-L%C3%B4',
		images: [],
		titleKey: 'poi.haras_national.title',
		subtitleKey: 'poi.haras_national.subtitle',
		summaryKey: 'poi.haras_national.summary'
	},
	{
		id: 'chateau-balleroy',
		category: 'heritage',
		lat: 49.1773,
		lng: -0.8327,
		distanceKm: 11.4,
		popularityScore: 45,
		accessibilityLevel: 'Moderate',
		website: 'https://www.chateau-balleroy.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/Ch%C3%A2teau_de_Balleroy',
		images: [],
		titleKey: 'poi.chateau_balleroy.title',
		subtitleKey: 'poi.chateau_balleroy.subtitle',
		summaryKey: 'poi.chateau_balleroy.summary'
	},
	{
		id: 'coutances',
		category: 'heritage',
		lat: 49.0444,
		lng: -1.4444,
		distanceKm: 36.3,
		popularityScore: 52,
		accessibilityLevel: 'Good',
		website: 'https://www.coutances.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/Coutances',
		images: [],
		titleKey: 'poi.coutances.title',
		subtitleKey: 'poi.coutances.subtitle',
		summaryKey: 'poi.coutances.summary'
	},
	{
		id: 'carentan',
		category: 'towns',
		lat: 49.3058,
		lng: -1.2456,
		distanceKm: 23.9,
		popularityScore: 43,
		accessibilityLevel: 'Good',
		website: 'https://www.carentan-les-marais.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/Carentan',
		images: [],
		titleKey: 'poi.carentan.title',
		subtitleKey: 'poi.carentan.subtitle',
		summaryKey: 'poi.carentan.summary'
	},
	{
		id: 'juno-beach',
		category: 'ww2',
		lat: 49.3367,
		lng: -0.4528,
		distanceKm: 43.2,
		popularityScore: 72,
		accessibilityLevel: 'Good',
		website: 'https://www.junobeach.org',
		wikipedia: 'https://en.wikipedia.org/wiki/Juno_Beach_Centre',
		images: [],
		titleKey: 'poi.juno_beach.title',
		subtitleKey: 'poi.juno_beach.subtitle',
		summaryKey: 'poi.juno_beach.summary'
	},
	{
		id: 'lessay-abbey',
		category: 'heritage',
		lat: 49.2167,
		lng: -1.5333,
		distanceKm: 40.1,
		popularityScore: 48,
		accessibilityLevel: 'Good',
		website: null,
		wikipedia: 'https://en.wikipedia.org/wiki/Lessay_Abbey',
		images: [],
		titleKey: 'poi.lessay_abbey.title',
		subtitleKey: 'poi.lessay_abbey.subtitle',
		summaryKey: 'poi.lessay_abbey.summary'
	},
	{
		id: 'vire',
		category: 'towns',
		lat: 48.8333,
		lng: -0.8833,
		distanceKm: 38.6,
		popularityScore: 28,
		accessibilityLevel: 'Good',
		website: 'https://www.vire-normandie.fr',
		wikipedia: 'https://en.wikipedia.org/wiki/Vire',
		images: [],
		titleKey: 'poi.vire.title',
		subtitleKey: 'poi.vire.subtitle',
		summaryKey: 'poi.vire.summary'
	},
	{
		id: 'torigni-sur-vire',
		category: 'towns',
		lat: 49.0333,
		lng: -1.0167,
		distanceKm: 15.7,
		popularityScore: 30,
		accessibilityLevel: 'Good',
		website: null,
		wikipedia: 'https://en.wikipedia.org/wiki/Torigni-sur-Vire',
		images: [],
		titleKey: 'poi.torigni_sur_vire.title',
		subtitleKey: 'poi.torigni_sur_vire.subtitle',
		summaryKey: 'poi.torigni_sur_vire.summary'
	},
	{
		// Exception: ~71km — culturally unmissable
		id: 'mont-saint-michel',
		category: 'heritage',
		lat: 48.6361,
		lng: -1.5114,
		distanceKm: 70.9,
		popularityScore: 100,
		accessibilityLevel: 'Limited',
		website: 'https://www.ot-montsaintmichel.com',
		wikipedia: 'https://en.wikipedia.org/wiki/Mont_Saint-Michel',
		images: [],
		titleKey: 'poi.mont_saint_michel.title',
		subtitleKey: 'poi.mont_saint_michel.subtitle',
		summaryKey: 'poi.mont_saint_michel.summary'
	}
];

// Cottage origin — used for Haversine and map centering
export const COTTAGE_ORIGIN = { lat: 49.1728, lng: -0.9887 };
