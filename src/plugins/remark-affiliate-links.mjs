// Remark plugin: rewrites first-occurrence keyword matches into Amazon
// affiliate links and appends a "Mentioned in this episode" section listing
// every product that fired in this file.
//
// Per-file state: each file's run starts with an empty linkedIds set, so
// "first occurrence per post" is enforced naturally. The traversal walks the
// mdast in document order and, for every text node, finds the earliest match
// across all *not-yet-linked* products. Skipped contexts: existing links,
// inline/block code, and headings.

import { visitParents, SKIP } from 'unist-util-visit-parents';

import { AFFILIATE_DISCLOSURE, AFFILIATE_PRODUCTS } from '../data/affiliate-links.mjs';

const SKIP_ANCESTOR_TYPES = new Set(['link', 'linkReference', 'inlineCode', 'code', 'heading']);

function escapeRegex(s) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildProductRegexes(products) {
	return products.map((p) => {
		// One regex per product, alternation across all its patterns. Word-
		// boundary anchored at both ends, case-insensitive. Longest first so
		// "3D printers" beats "3D printer" when both could match.
		const sorted = [...p.patterns].sort((a, b) => b.length - a.length);
		const alt = sorted.map(escapeRegex).join('|');
		return { product: p, regex: new RegExp(`\\b(?:${alt})\\b`, 'i') };
	});
}

const PRODUCT_REGEXES = buildProductRegexes(AFFILIATE_PRODUCTS);

function ancestorBlocked(ancestors) {
	for (const a of ancestors) {
		if (SKIP_ANCESTOR_TYPES.has(a.type)) return true;
	}
	return false;
}

function makeAffiliateLinkNode(url, label) {
	return {
		type: 'link',
		url,
		title: null,
		data: {
			hProperties: {
				target: '_blank',
				rel: 'noopener nofollow sponsored',
				class: 'affiliate-link',
			},
		},
		children: [{ type: 'text', value: label }],
	};
}

function buildMentionedSection(linkedProducts) {
	return [
		{ type: 'thematicBreak' },
		{
			type: 'heading',
			depth: 2,
			children: [{ type: 'text', value: 'Mentioned in this episode' }],
		},
		{
			type: 'paragraph',
			data: { hProperties: { class: 'affiliate-disclosure' } },
			children: [{ type: 'emphasis', children: [{ type: 'text', value: AFFILIATE_DISCLOSURE }] }],
		},
		{
			type: 'list',
			ordered: false,
			spread: false,
			data: { hProperties: { class: 'affiliate-list' } },
			children: linkedProducts.map((p) => ({
				type: 'listItem',
				spread: false,
				children: [
					{
						type: 'paragraph',
						children: [
							{
								type: 'link',
								url: p.url,
								title: null,
								data: {
									hProperties: {
										target: '_blank',
										rel: 'noopener nofollow sponsored',
										class: 'affiliate-link',
									},
								},
								children: [{ type: 'text', value: p.label }],
							},
						],
					},
				],
			})),
		},
	];
}

export default function remarkAffiliateLinks() {
	return (tree, file) => {
		const linkedIds = new Set();

		visitParents(tree, 'text', (node, ancestors) => {
			if (ancestorBlocked(ancestors)) return;

			// Find the earliest match across all not-yet-linked products.
			let earliest = null;
			for (const { product, regex } of PRODUCT_REGEXES) {
				if (linkedIds.has(product.id)) continue;
				const m = regex.exec(node.value);
				if (m && (earliest === null || m.index < earliest.index)) {
					earliest = { product, match: m, index: m.index };
				}
			}
			if (earliest === null) return;

			const parent = ancestors[ancestors.length - 1];
			const index = parent.children.indexOf(node);
			if (index === -1) return;

			const before = node.value.slice(0, earliest.index);
			const matched = earliest.match[0];
			const after = node.value.slice(earliest.index + matched.length);

			const linkNode = makeAffiliateLinkNode(earliest.product.url, matched);
			const replacement = [];
			if (before) replacement.push({ type: 'text', value: before });
			replacement.push(linkNode);
			if (after) replacement.push({ type: 'text', value: after });

			parent.children.splice(index, 1, ...replacement);
			linkedIds.add(earliest.product.id);

			// Continue the walk past the inserted nodes — don't re-scan the link's
			// own text (we already burned the product) and avoid double-counting.
			return [SKIP, index + replacement.length];
		});

		if (linkedIds.size === 0) return;

		const linkedProducts = AFFILIATE_PRODUCTS.filter((p) => linkedIds.has(p.id));
		tree.children.push(...buildMentionedSection(linkedProducts));

		// Stash the count on file.data for build-time logging. Optional, helpful
		// when verifying the wire-up after a content change.
		file.data ??= {};
		file.data.affiliateLinksAdded = linkedIds.size;
	};
}
