import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PROPERTY_SLUGS } from './consts';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			// Shed Flips: optional YouTube video ID for embedding the source video.
			// Example: for https://www.youtube.com/watch?v=dQw4w9WgXcQ, set youtubeId: 'dQw4w9WgXcQ'
			youtubeId: z.string().optional(),
			// Optional list of tags for categorizing posts (e.g., 'haul', 'ebay', 'garage-sale').
			tags: z.array(z.string()).optional(),
			// Which YouTube property this post is the written companion to.
			// Defaults to 'shed-flips' if omitted (preserves the pre-multi-property era).
			property: z.enum(PROPERTY_SLUGS as [string, ...string[]]).default('shed-flips'),
		}),
});

export const collections = { blog };
