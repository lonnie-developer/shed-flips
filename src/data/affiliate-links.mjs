// Amazon affiliate products. Inline-linked on first occurrence per post; the
// remark plugin also appends a "Mentioned in this episode" block listing the
// ones that fired. Add new products here — the plugin picks them up
// automatically. Keep `patterns` literal phrases (case-insensitive,
// word-boundary at start/end). Patterns may include hyphens and apostrophes.

export const AFFILIATE_DISCLOSURE =
	'As an Amazon Associate, Shed Flips earns from qualifying purchases. ' +
	'The links below are affiliate links — clicking them and buying anything ' +
	'(the linked item or otherwise) helps support the channel at no extra ' +
	'cost to you.';

export const AFFILIATE_PRODUCTS = [
	{
		id: 'gold-testing-kit',
		label: 'Gold testing kit',
		url: 'https://amzn.to/4vZkCeV',
		patterns: [
			'scratch test',
			'scratch tested',
			'scratch-test',
			'gold testing kit',
			'gold test kit',
		],
	},
	{
		id: 'jewelers-loupe',
		label: "Jeweler's loupe",
		url: 'https://amzn.to/4uthI0B',
		patterns: [
			"jeweler's loupe",
			'jewelers loupe',
			"jeweller's loupe",
			'jewellers loupe',
			'loupe',
			'loop-mark',
		],
	},
	{
		id: 'jewelry-scale',
		label: 'Jewelry scale (0.01g)',
		url: 'https://amzn.to/4diMSBQ',
		// Deliberately narrow — never match bare "scale".
		patterns: [
			'jewelry scale',
			'jeweler scale',
			"jeweler's scale",
			'gold scale',
			'gram scale',
			'milligram scale',
		],
	},
	{
		id: '3d-printer',
		label: '3D printer',
		url: 'https://amzn.to/4n7x2xo',
		patterns: [
			'3D printer',
			'3D printers',
			'3D-printer',
			'3D-printers',
			'3D printed',
			'3D-printed',
			'3D printing',
			'3D-printing',
		],
	},
	{
		id: 'thermal-label-printer',
		label: 'Jadens thermal label printer',
		url: 'https://amzn.to/4d5otPb',
		patterns: [
			'Jadens',
			'thermal label printer',
			'thermal label printers',
			'thermal printer',
			'thermal printers',
			'label printer',
			'label printers',
		],
	},
];
