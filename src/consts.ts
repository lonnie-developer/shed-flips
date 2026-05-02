// Site-wide constants for Shed Flips.
// Edit values here to update the site title, description, and channel links everywhere.

export const SITE_TITLE = 'Shed Flips';
export const SITE_DESCRIPTION =
	"Hi, we're Lonnie and Candice! We buy items at garage sales, estate sales and other sources and sell them online. Come stop by the shed and hang out for a while!";
export const SITE_TAGLINE = 'Welcome back to the shed!';

export const AUTHOR = 'Shed Flips';

// Legacy — primary YouTube channel for the site. Kept for components that still
// reference a single channel (Header right-cluster button, Footer). New code
// should prefer the `PROPERTIES` map below.
export const CHANNEL_NAME = 'Shed Flips';
export const CHANNEL_URL = 'https://www.youtube.com/@shedflips';
export const CHANNEL_HANDLE = '@shedflips';

// Multi-property hub — each entry is a YouTube property the site represents.
// Adding a new property: add an entry here, add `property: '<slug>'` to posts,
// and (Phase 2) the property landing page at `/<slug>` will pick it up.
export const PROPERTIES = {
	'shed-flips': {
		slug: 'shed-flips',
		name: 'Shed Flips',
		chipLabel: 'Shed Flips',
		navLabel: 'Shed Flips',
		tagline: 'Welcome back to the shed!',
		description:
			'Lonnie and Candice reselling out of a shed in South Louisiana. Garage sales, estate sales, eBay, Mercari, Etsy, and Poshmark.',
		channelUrl: 'https://www.youtube.com/@shedflips',
		channelHandle: '@shedflips',
		accent: '#1B8038',
		accentDark: '#145E27',
		chipText: '#FFFFFF',
	},
	'im-gonna-pack-it': {
		slug: 'im-gonna-pack-it',
		name: "I'm Gonna Pack It",
		chipLabel: "I'm Gonna Pack It",
		navLabel: "I'm Gonna Pack It",
		tagline: 'Packing days from the shed.',
		description:
			'The packing-day companion channel. Multi-item orders, packing tricks, and the shipping-station rhythm that keeps the shed moving.',
		channelUrl: 'https://www.youtube.com/@imgonnapackit',
		channelHandle: '@imgonnapackit',
		accent: '#3D55B0',
		accentDark: '#2B3F87',
		chipText: '#FFFFFF',
	},
	'garage-flips': {
		slug: 'garage-flips',
		name: 'Garage Flips',
		chipLabel: 'Garage Flips',
		navLabel: 'Garage Flips',
		tagline: 'Quick-cut garage-sale finds.',
		description:
			'Short, fast-cut clips from the garage-sale circuit — the finds, the flips, and the occasional sleeper score. Long-form weekly compilations land here too.',
		channelUrl: 'https://www.youtube.com/@garage-flips',
		channelHandle: '@garage-flips',
		accent: '#E59A0A',
		accentDark: '#B27600',
		chipText: '#0F3445',
	},
	'podcast': {
		slug: 'podcast',
		name: 'The Lonnie & Ryan Podcast',
		chipLabel: 'Lonnie & Ryan',
		navLabel: 'Podcast',
		tagline: 'A weekly conversation with friend Ryan.',
		description:
			'Lonnie sits down with his friend Ryan every week — guests, reseller talk, and the kind of long-form conversation that doesn’t fit in a haul video.',
		channelUrl: 'https://www.youtube.com/@LonnieandRyan',
		channelHandle: '@LonnieandRyan',
		accent: '#9C2C32',
		accentDark: '#741F25',
		chipText: '#FFFFFF',
	},
} as const;

export type PropertySlug = keyof typeof PROPERTIES;
export const PROPERTY_SLUGS = Object.keys(PROPERTIES) as PropertySlug[];

export function getProperty(slug: PropertySlug | undefined) {
	return PROPERTIES[slug ?? 'shed-flips'];
}
