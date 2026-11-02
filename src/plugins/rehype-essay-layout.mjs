/** Editorial structure only: leave source strings and non-essay MDX untouched. */
export default function rehypeEssayLayout() {
  return (tree, file) => {
    const frontmatter = file.data.astro?.frontmatter;
    if (!frontmatter?.bookId || !frontmatter.title) return;
    const text = (node) => node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');
    const normalize = (value) => value.replace(/\s+/g, ' ').trim();
    const firstHeading = tree.children.findIndex(node => node.type === 'element' && /^h[1-6]$/.test(node.tagName));
    if (firstHeading >= 0) {
      const heading = tree.children[firstHeading];
      if (heading.tagName === 'h1' && normalize(text(heading)) === normalize(frontmatter.title)) {
        tree.children.splice(firstHeading, 1);
      }
    }
    // Start body sections at h2, below the title rendered by EssayPanel.
    const headings = tree.children.filter(node => node.type === 'element' && /^h[1-6]$/.test(node.tagName));
    const minimum = Math.min(...headings.map(node => Number(node.tagName.slice(1))));
    for (const node of headings) node.tagName = `h${Math.min(6, Number(node.tagName.slice(1)) - minimum + 2)}`;
    const output = [];
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      const heading = node.type === 'element' && /^h[1-6]$/.test(node.tagName);
      const label = heading ? text(node) : '';
      const kind = /참고|참고문헌|references/i.test(label) ? 'references'
        : /질문|함께 생각|생각해 보/i.test(label) ? 'questions' : undefined;
      if (!kind) { output.push(node); continue; }
      const children = [node];
      while (i + 1 < tree.children.length) {
        const next = tree.children[i + 1];
        if (next.type === 'element' && /^h[1-6]$/.test(next.tagName) && next.tagName <= node.tagName) break;
        children.push(next); i++;
      }
      output.push({ type: 'element', tagName: 'section', properties: { className: ['reading-special', `reading-${kind}`] }, children });
    }
    tree.children = output;
  };
}
