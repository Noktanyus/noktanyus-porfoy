// src/lib/__tests__/markdown-processor.test.ts

import { processMarkdown } from '../markdown-processor';

describe('Markdown Processor', () => {
  it('should convert basic markdown to HTML', async () => {
    const markdown = '# Başlık\n\nBu bir paragraf.';
    const result = await processMarkdown(markdown);
    expect(result).toContain('<h1>Başlık</h1>');
    expect(result).toContain('<p>Bu bir paragraf.</p>');
  });

  it('should convert GFM tables to HTML tables', async () => {
    const markdown = '| Başlık 1 | Başlık 2 |\n|---|---|\n| Hücre 1 | Hücre 2 |';
    const result = await processMarkdown(markdown);
    expect(result).toContain('<table>');
    expect(result).toContain('<thead>');
    expect(result).toContain('<tbody>');
    expect(result).toContain('<td>Hücre 1</td>');
  });

  it('should highlight code blocks with correct classes and spans', async () => {
    const markdown = "```js\nconst x = 1;\n```";
    const result = await processMarkdown(markdown);
    // Use [\s\S]* instead of .* with 's' flag to match newlines
    expect(result).toMatch(/<pre><code class="language-js">[\s\S]*<span[\s\S]*>const<\/span>[\s\S]*<\/code><\/pre>/);
  });

  it('should sanitize potentially dangerous HTML', async () => {
    const markdown = '<script>alert("XSS")<\/script><p>Güvenli paragraf.<\/p>';
    const result = await processMarkdown(markdown);
    // rehype-sanitize, <script> etiketini ve varsayılan olarak <p> etiketini de kaldırır.
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<p>Güvenli paragraf.</p>');
  });
});