// Points of Interest — static data for the Explore page
// 20 POIs within 50km of Marianne Cottage (1 La Haye, 50680 Couvains)
// + Mont Saint-Michel exception (~71km, culturally unmissable)
//
// Images: populated by `node scripts/download-poi-images.mjs`
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
		images: [
			{ src: '/images/poi/omaha-beach/1.jpg', alt: 'Troops of the US Army 2nd Infantry Division march up the bluff at the E-1 draw in the Easy Red sector of Omaha Beach, Normandy, France on D+1, June 7, 1944.', attribution: 'US Army Signal Corps / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/omaha-beach/2.jpg', alt: 'The 80th anniversary of D-Day and the Battle of Normandy on 6 June 2024', attribution: 'European Union / Wikimedia Commons / Attribution' },
			{ src: '/images/poi/omaha-beach/3.jpg', alt: 'The 80th anniversary of D-Day and the Battle of Normandy on 6 June 2024', attribution: 'European Union / Wikimedia Commons / Attribution' },
			{ src: '/images/poi/omaha-beach/4.jpg', alt: 'The 80th anniversary of D-Day and the Battle of Normandy on 6 June 2024', attribution: 'European Union / Wikimedia Commons / Attribution' },
			{ src: '/images/poi/omaha-beach/5.jpg', alt: 'Omaha Beach, Normandy, France', attribution: 'Dupont66 / Wikimedia Commons / CC BY 4.0' },
			{ src: '/images/poi/omaha-beach/6.jpg', alt: 'U.S. Army Paratroopers pose on Omaha Beach for the 80th anniversary of D-Day, June 2024', attribution: 'U.S. Army Reserve photo by Sgt. 1st Class Austin Berner / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/omaha-beach/7.jpg', alt: '29th Infantry Division color guard ceremony at Omaha Beach, June 2024', attribution: 'U.S. Army Reserve photo by Sgt. 1st Class Austin Berner / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/omaha-beach/8.jpg', alt: 'Ceremony for the 29th Infantry Division at Omaha Beach, June 2024', attribution: 'U.S. Army Reserve photo by Sgt. 1st Class Austin Berner / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/omaha-beach/9.jpg', alt: 'Ceremony for the 29th Infantry Division at Omaha Beach, June 2024', attribution: 'U.S. Army Reserve photo by Sgt. 1st Class Austin Berner / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/omaha-beach/10.jpg', alt: '29th Infantry Division color guard at Omaha Beach ceremony, June 2024', attribution: 'U.S. Army Reserve photo by Sgt. 1st Class Austin Berner / Wikimedia Commons / Public domain' }
		],
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
		images: [
			{ src: '/images/poi/american-cemetery/1.jpg', alt: 'Normandy American Cemetery at Colleville-sur-Mer', attribution: 'Clément Bardot / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/american-cemetery/2.jpg', alt: 'The World War II Normandy American Cemetery and Memorial in Colleville-sur-Mer, Normandy, France', attribution: 'Gzzz / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/american-cemetery/3.jpg', alt: 'Normandy American Cemetery and Memorial in Colleville-sur-Mer, Calvados, France', attribution: 'Myrabella / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/american-cemetery/4.jpg', alt: '44th Infantry Division veteran First Sergeant Hernandez during the 6th June memorial service', attribution: 'Archangel12 / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/american-cemetery/5.jpg', alt: 'Commemoration service at the Colleville cemetery', attribution: 'Archangel12 / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/american-cemetery/6.jpg', alt: 'Commemoration service at the Colleville cemetery', attribution: 'Archangel12 / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/american-cemetery/7.jpg', alt: 'Commemoration service at the Colleville cemetery', attribution: 'Archangel12 / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/american-cemetery/8.jpg', alt: 'Commemoration service at the Colleville cemetery', attribution: 'Archangel12 / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/american-cemetery/9.jpg', alt: 'Commemoration service at the Colleville cemetery', attribution: 'Archangel12 / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/american-cemetery/10.jpg', alt: 'Body of water in Colleville-sur-Mer (Calvados, France)', attribution: 'Gzen92 / Wikimedia Commons / CC BY-SA 4.0' }
		],
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
		images: [
			{ src: '/images/poi/pointe-du-hoc/1.jpg', alt: 'Pointe du Hoc, Normandy', attribution: 'Archangel12 / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/pointe-du-hoc/2.jpg', alt: 'Bombing craters at Pointe-du-Hoc, Calvados, Normandy, France', attribution: 'Jebulon / Wikimedia Commons / CC0' },
			{ src: '/images/poi/pointe-du-hoc/3.jpg', alt: 'Ruins of German bunkers at Pointe-du-Hoc, Calvados, Normandy, France', attribution: 'Jebulon / Wikimedia Commons / CC0' },
			{ src: '/images/poi/pointe-du-hoc/4.jpg', alt: 'Pointe-du-Hoc, April 2015, Calvados, Normandy, France', attribution: 'Jebulon / Wikimedia Commons / CC0' }
		],
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
		images: [
			{ src: '/images/poi/bayeux/1.jpg', alt: 'Medieval stained glass from the Bayeux region', attribution: 'Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/bayeux/2.jpg', alt: 'View of Bayeux and its Norman countryside, 1913', attribution: 'Internet Archive Book Images / Wikimedia Commons / No restrictions' }
		],
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
		images: [
			{ src: '/images/poi/arromanches/1.jpg', alt: 'Aerial view of the Mulberry Harbour at Arromanches, June 1944', attribution: 'Royal Air Force official photographer / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/arromanches/2.jpg', alt: "Captain Hickling shows Winston Churchill a plan of Mulberry Harbour 'B', July 1944", attribution: 'Allen, E E (Lt), Royal Navy official photographer / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/arromanches/3.jpg', alt: 'Panoramic view of Arromanches beach with Mulberry B artificial harbour, D-Day plus 20, 1944', attribution: 'Freedman, Barnett (CBE) / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/arromanches/4.jpg', alt: "A line of Phoenix caisson units forming the breakwater of Mulberry Harbour at Arromanches, June 1944", attribution: 'No 5 Army Film & Photographic Unit, Harrison (Sgt) / Wikimedia Commons / Public domain' }
		],
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
		images: [
			{ src: '/images/poi/memorial-caen/1.jpg', alt: 'Aircraft exhibit at the Mémorial de Caen', attribution: 'Unknown / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/memorial-caen/2.jpg', alt: 'French flag flying in front of the Mémorial de Caen, November 2015', attribution: 'Benoit-caen / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/3.jpg', alt: 'Gathering in front of the Mémorial de Caen in tribute to the victims of 13 November 2015', attribution: 'Benoit-caen / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/4.jpg', alt: 'German military chess "Wehrschach" exhibited at the Caen Memorial Museum', attribution: 'Elya / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/5.jpg', alt: 'German military chess "Wehrschach" exhibited at the Caen Memorial Museum', attribution: 'Elya / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/6.jpg', alt: 'German military chess "Wehrschach" exhibited at the Caen Memorial Museum', attribution: 'Elya / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/7.jpg', alt: 'German military chess "Wehrschach" exhibited at the Caen Memorial Museum', attribution: 'Elya / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/8.jpg', alt: 'German military chess "Wehrschach" exhibited at the Caen Memorial Museum', attribution: 'Elya / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/9.jpg', alt: 'The immersive room at the Mémorial de Caen', attribution: 'MémorialCaen / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/memorial-caen/10.jpg', alt: 'The Mémorial de Caen', attribution: 'François Monier / Wikimedia Commons / CC BY-SA 4.0' }
		],
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
		images: [
			{ src: '/images/poi/utah-beach/1.jpg', alt: 'American assault troops land on Utah Beach, northern coast of France', attribution: 'Photographer: Wall / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/utah-beach/2.jpg', alt: 'Sand stabilization at Utah Beach, Manche, Normandy, France', attribution: 'Jebulon / Wikimedia Commons / CC0' },
			{ src: '/images/poi/utah-beach/3.jpg', alt: 'Utah Beach D-Day landing site, towards the south, Manche, Normandy', attribution: 'Jebulon / Wikimedia Commons / CC0' },
			{ src: '/images/poi/utah-beach/4.jpg', alt: 'Map of Utah Beach on the east side of the Cotentin Peninsula in Normandy', attribution: 'U.S. Army / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/utah-beach/5.jpg', alt: 'Secretary of the Navy attends ceremony at Utah Beach on the 80th anniversary of D-Day, June 2024', attribution: 'U.S. Navy photo by Petty Officer 2nd Class Jared Mancuso / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/utah-beach/6.jpg', alt: 'Secretary of the Navy tours Utah Beach on the 80th anniversary of D-Day, June 2024', attribution: 'U.S. Navy photo by Petty Officer 2nd Class Jared Mancuso / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/utah-beach/7.jpg', alt: '4th Infantry Division at Utah Beach Memorial ceremony, D-Day 79th anniversary, June 2023', attribution: 'U.S. Army photo by Spc. Joshua Zayas-Sabogal / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/utah-beach/8.jpg', alt: 'Utah Beach Monument ceremony honoring American Soldiers of D-Day, June 2023', attribution: 'U.S. Army photo by Sgt. Clara Harty / Wikimedia Commons / Public domain' }
		],
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
		images: [
			{ src: '/images/poi/la-cambe/1.jpg', alt: 'German military cemetery Normandy', attribution: 'Unknown / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/la-cambe/2.jpg', alt: 'German military cemetery Normandy', attribution: 'Unknown / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/la-cambe/3.jpg', alt: 'U.S., French, Canadian, and German Soldiers gather at the La Cambe German war cemetery, June 2009', attribution: 'U.S. Army Photo by Alfredo Barraza Jr. / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/la-cambe/4.jpg', alt: 'La Cambe German military cemetery near Bayeux, containing over 21,000 German military personnel of WWII', attribution: 'Dennis G. Jarvis / Wikimedia Commons / CC BY-SA 2.0' }
		],
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
		images: [
			{ src: '/images/poi/saint-lo/1.jpg', alt: 'American convoy passing through the ruins of Saint-Lô, August 1944', attribution: 'PhotosNormandie / Wikimedia Commons / CC BY-SA 2.0' },
			{ src: '/images/poi/saint-lo/2.jpg', alt: 'Higgins Boat Monument at Utah Beach during 75th D-Day Anniversary tour, July 2019', attribution: 'Sgt. Lisa Crawford / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/saint-lo/3.jpg', alt: 'Nebraska National Guard staff ride participants during 75th Commemoration of the Liberation of Saint-Lô, July 2019', attribution: 'Sgt. Lisa Crawford / Wikimedia Commons / Public domain' }
		],
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
		images: [
			{ src: '/images/poi/coutances/1.jpg', alt: 'Choir of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/coutances/2.jpg', alt: 'Choir of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/coutances/3.jpg', alt: 'Choir of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/coutances/4.jpg', alt: 'Choir of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/coutances/5.jpg', alt: 'Facade of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/coutances/6.jpg', alt: 'Towers of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/coutances/7.jpg', alt: 'Organ of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/coutances/8.jpg', alt: 'Cathedral at Coutances, Normandy, distant view', attribution: 'Cameron, Harry F. / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/coutances/9.jpg', alt: 'Coutances, Normandy — cathedral distant view', attribution: 'Cameron, Harry F. / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/coutances/10.jpg', alt: 'Choir of the Cathedral of Our Lady, Coutances, Normandy, France', attribution: 'Zairon / Wikimedia Commons / CC BY-SA 4.0' }
		],
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
		images: [
			{ src: '/images/poi/carentan/1.jpg', alt: 'Carentan City Hall from east, Normandy', attribution: 'TCY / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/carentan/2.jpg', alt: 'French bagpipe musicians march into Carentan town square during D-Day 78 celebrations, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/3.jpg', alt: 'WWII Army veteran Betty Rose at D-Day 78 ceremony in Carentan, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/4.jpg', alt: 'Paratroopers line the cobblestone roads of Carentan town square for D-Day 78, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/5.jpg', alt: 'WWII Army veteran George Hamilton during D-Day 78 celebrations in Carentan, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/6.jpg', alt: 'Military leaders pose during D-Day ceremony in Carentan, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/7.jpg', alt: 'WWII Army veteran Clifford Stump at D-Day 78 ceremony in Carentan, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/8.jpg', alt: 'American and French citizens gather in Carentan town square for D-Day 78, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/9.jpg', alt: 'French children in 1940s clothing during D-Day celebrations in Carentan, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/carentan/10.jpg', alt: 'French children in 1940s clothing during D-Day re-enactment in Carentan, June 2022', attribution: 'U.S. Army 207-MI-BDE by Sgt. Jordan Pearson / Wikimedia Commons / Public domain' }
		],
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
		images: [
			{ src: '/images/poi/juno-beach/1.jpg', alt: 'Dedication plaques outside the Juno Beach Centre museum, Courseulles-sur-Mer', attribution: 'Mark from Woking, United Kingdom / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/juno-beach/2.jpg', alt: 'Memorial plaques at the Juno Beach Centre in Courseulles-sur-Mer', attribution: 'Mark from Woking, United Kingdom / Wikimedia Commons / CC BY 2.0' },
			{ src: '/images/poi/juno-beach/3.jpg', alt: 'Canadian section of Juno Beach and Juno Beach Centre, Courseulles-sur-Mer, France', attribution: 'Dr. Alexander Mayer / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/juno-beach/4.jpg', alt: 'A sculpture outside the Juno Beach Centre in Courseulles-sur-Mer', attribution: 'Dr Wilson / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/juno-beach/5.jpg', alt: 'History panel and map of the Atlantic Wall in Courseulles-sur-Mer', attribution: 'Dave osm / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/juno-beach/6.jpg', alt: 'History panel and map of the Atlantic Wall in Courseulles-sur-Mer', attribution: 'Dave osm / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/juno-beach/7.jpg', alt: 'Panoramic view of the Juno Beach Centre at Courseulles-sur-Mer', attribution: 'remiforall / Wikimedia Commons / CC BY-SA 4.0' }
		],
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
		images: [
			{ src: '/images/poi/torigni-sur-vire/1.jpg', alt: 'Château des Matignon, Torigni-sur-Vire, hotel de ville', attribution: 'Ikmo-ned / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/torigni-sur-vire/2.jpg', alt: 'Château des Matignon at Torigni-sur-Vire', attribution: 'Xfigpower / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/torigni-sur-vire/3.jpg', alt: 'Château des Matignon at Torigni-sur-Vire', attribution: 'Xfigpower / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/torigni-sur-vire/4.jpg', alt: 'Rear view of Château des Matignon at Torigni-sur-Vire', attribution: 'Xfigpower / Wikimedia Commons / CC BY-SA 3.0' },
			{ src: '/images/poi/torigni-sur-vire/5.jpg', alt: 'Château des Matignon, Torigni-sur-Vire, Manche, 2017', attribution: 'Selbymay / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/torigni-sur-vire/6.jpg', alt: 'Château des Matignon, Torigni-sur-Vire, Manche, 2017', attribution: 'Selbymay / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/torigni-sur-vire/7.jpg', alt: 'Château des Matignon, Torigni-sur-Vire, Manche, 2017', attribution: 'Selbymay / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/torigni-sur-vire/8.jpg', alt: 'Château des Matignon, Torigni-sur-Vire, Manche, 2017', attribution: 'Selbymay / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/torigni-sur-vire/9.jpg', alt: 'Château des Matignon, Torigni-sur-Vire, Manche, 2017', attribution: 'Selbymay / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/torigni-sur-vire/10.png', alt: 'Plan of the park and Château des Matignon in Torigni, 1779', attribution: 'Dechevrières / Wikimedia Commons / Public domain' }
		],
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
		images: [
			{ src: '/images/poi/mont-saint-michel/1.jpg', alt: 'Mont Saint-Michel at sunset, Normandy, France', attribution: 'Benh LIEU SONG / Wikimedia Commons / CC BY 2.5' },
			{ src: '/images/poi/mont-saint-michel/2.jpg', alt: 'Mont Saint-Michel viewed along the Couesnon River in Normandy, France', attribution: 'Diliff / Wikimedia Commons / Public domain' },
			{ src: '/images/poi/mont-saint-michel/3.jpg', alt: 'Cloisters of the abbey of Mont Saint-Michel, Normandy, France', attribution: 'Benh LIEU SONG (Flickr) / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/mont-saint-michel/4.jpg', alt: 'Cistern of the Chaplaincy of the Mont Saint-Michel Abbey', attribution: 'John Samuel / Wikimedia Commons / CC BY-SA 4.0' },
			{ src: '/images/poi/mont-saint-michel/5.jpg', alt: 'Sunrise on Mont-Saint-Michel', attribution: 'Lynx1211 / Wikimedia Commons / CC BY-SA 4.0' }
		],
		titleKey: 'poi.mont_saint_michel.title',
		subtitleKey: 'poi.mont_saint_michel.subtitle',
		summaryKey: 'poi.mont_saint_michel.summary'
	}
];

// Cottage origin — used for Haversine and map centering
export const COTTAGE_ORIGIN = { lat: 49.172937, lng: -0.988765 };
