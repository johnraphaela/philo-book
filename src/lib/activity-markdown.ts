import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';

// Build-time rendering of repository-owned Markdown, never browser/user HTML.
const processor = createMarkdownProcessor({
  remarkPlugins: [remarkCjkFriendly],
  smartypants: false,
  syntaxHighlight: false,
});
export async function renderActivityMarkdown(text: string): Promise<string> {
  return (await (await processor).render(text)).code;
}
