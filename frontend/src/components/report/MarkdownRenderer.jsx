import { memo, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, Link2 } from "lucide-react";

import { copyToClipboard } from "../../utils/exportReport.js";

/**
 * Copy-to-clipboard code fence with a language label.
 * Kept out of the renderer body so its local `copied` state does not force the
 * whole report to re-render on every copy.
 */
function CodeBlock({ language, children, raw }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(raw);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="code-block">
      <div className="code-block__head">
        <span className="code-block__lang">{language || "text"}</span>
        <button
          type="button"
          className="btn btn--ghost btn--xs code-block__copy"
          onClick={handleCopy}
          aria-label={copied ? "Code copied" : "Copy code"}
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

/** Anchored heading — hovering reveals a link to the section. */
function Heading({ level, id, children }) {
  const Tag = `h${level}`;

  return (
    <Tag id={id}>
      {children}
      {id && (
        <a
          href={`#${id}`}
          className="heading-anchor"
          aria-label="Link to this section"
          tabIndex={-1}
        >
          <Link2 size={15} aria-hidden="true" />
        </a>
      )}
    </Tag>
  );
}

/**
 * Markdown renderer for generated reports.
 *
 * GFM is enabled for tables, strikethrough, and task lists — the report writer
 * agent emits all three. Syntax highlighting runs through rehype-highlight,
 * which only touches fenced blocks that declare a language.
 *
 * Heading ids come from `outlineIndex` (a source-line → entry map) rather than
 * being re-slugified here. Deriving both the table of contents and the anchors
 * from one pass means duplicate section titles still resolve to distinct,
 * matching ids.
 */
function MarkdownRenderer({ content, outlineIndex }) {
  const components = useMemo(
    () => ({
      h1: ({ node, children }) => (
        <Heading level={1} id={outlineIndex?.get(node.position?.start?.line)?.id}>
          {children}
        </Heading>
      ),
      h2: ({ node, children }) => (
        <Heading level={2} id={outlineIndex?.get(node.position?.start?.line)?.id}>
          {children}
        </Heading>
      ),
      h3: ({ node, children }) => (
        <Heading level={3} id={outlineIndex?.get(node.position?.start?.line)?.id}>
          {children}
        </Heading>
      ),

      // Wrap wide tables so they scroll themselves instead of the page.
      table: ({ children }) => (
        <div className="scroll-x">
          <table>{children}</table>
        </div>
      ),

      pre: ({ children }) => {
        const code = Array.isArray(children) ? children[0] : children;
        const className = code?.props?.className ?? "";
        const language = className.match(/language-([\w-]+)/)?.[1];
        const raw = extractText(code?.props?.children);

        return (
          <CodeBlock language={language} raw={raw}>
            {code}
          </CodeBlock>
        );
      },

      // External links open in a new tab; noreferrer keeps the opener isolated.
      a: ({ href, children }) => {
        const external = href?.startsWith("http");
        return (
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer noopener" : undefined}
          >
            {children}
          </a>
        );
      },
    }),
    [outlineIndex],
  );

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { detect: false, ignoreMissing: true }]]}
      components={components}
    >
      {content}
    </Markdown>
  );
}

/** Flatten a React children tree down to its text, for the copy button. */
function extractText(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node.props?.children) return extractText(node.props.children);
  return "";
}

export default memo(MarkdownRenderer);
