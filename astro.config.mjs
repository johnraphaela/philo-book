// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import rehypeEssayLayout from './src/plugins/rehype-essay-layout.mjs';

// https://astro.build/config
export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [remarkCjkFriendly],
      rehypePlugins: [rehypeEssayLayout],
      smartypants: false,
    }),
  },
  integrations: [react(), mdx()]
});