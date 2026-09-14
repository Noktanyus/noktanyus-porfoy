import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Linkleri guvenli acma kurali: target="_blank" ve rel="noopener noreferrer"
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  return defaultRender(tokens, idx, options, env, self);
};

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img',
    'h1',
    'h2',
    'span',
    'details',
    'summary',
    'del',
    'ins',
    'sub',
    'sup',
    'mark',
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id', 'title', 'aria-*', 'data-*'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    code: ['class'],
    th: ['align', 'colspan', 'rowspan'],
    td: ['align', 'colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};

/**
 * Markdown metnini guvenli HTML ciktisina donusturur.
 */
export function renderSafeMarkdown(
  markdownContent: string | null | undefined
): string {
  if (!markdownContent) return '';
  const rawHtml = md.render(markdownContent);
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}

/**
 * Ham HTML metnini XSS saldirilarina karsi temizler.
 */
export function sanitizeRawHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml) return '';
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}
