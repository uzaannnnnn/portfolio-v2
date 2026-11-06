import * as React from "react";

export type MdxBlock =
  | { type: "heading2"; text: string; id: string }
  | { type: "heading3"; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "code"; language: string; code: string };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Parses safe structured MDX/Markdown content into typed AST blocks without
 * ever using dangerouslySetInnerHTML or executing arbitrary HTML/JavaScript.
 */
export function parseSafeMdxBlocks(source: string): MdxBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: MdxBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push({
        type: "code",
        language,
        code: codeLines.join("\n"),
      });
      continue;
    }

    // Heading 2
    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3).trim();
      blocks.push({
        type: "heading2",
        text,
        id: slugifyHeading(text),
      });
      i += 1;
      continue;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4).trim();
      blocks.push({
        type: "heading3",
        text,
        id: slugifyHeading(text),
      });
      i += 1;
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        ((lines[i] ?? "").trim().startsWith("- ") ||
          (lines[i] ?? "").trim().startsWith("* "))
      ) {
        items.push((lines[i] ?? "").trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? "").trim())) {
        items.push((lines[i] ?? "").trim().replace(/^\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    // Standard paragraph (collect consecutive non-empty plain lines)
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !(lines[i] ?? "").trim().startsWith("```") &&
      !(lines[i] ?? "").trim().startsWith("## ") &&
      !(lines[i] ?? "").trim().startsWith("### ") &&
      !(lines[i] ?? "").trim().startsWith("- ") &&
      !(lines[i] ?? "").trim().startsWith("* ") &&
      !/^\d+\.\s+/.test((lines[i] ?? "").trim())
    ) {
      paragraphLines.push((lines[i] ?? "").trim());
      i += 1;
    }
    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" "),
    });
  }

  return blocks;
}

/**
 * Safely renders inline formatting (**bold** and `code`) as React nodes without HTML injection.
 */
function renderInlineTokens(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded border border-border-token bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export interface SafeMdxRendererProps {
  content: string;
  className?: string;
}

export function SafeMdxRenderer({ content, className }: SafeMdxRendererProps) {
  const blocks = React.useMemo(() => parseSafeMdxBlocks(content), [content]);

  return (
    <div className={className ?? "space-y-6"}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading2":
            return (
              <h2
                key={index}
                id={block.id}
                className="type-section-heading pt-4 text-foreground"
              >
                {block.text}
              </h2>
            );
          case "heading3":
            return (
              <h3
                key={index}
                id={block.id}
                className="type-card-heading pt-2 text-foreground"
              >
                {block.text}
              </h3>
            );
          case "paragraph":
            return (
              <p key={index} className="type-body text-secondary-foreground">
                {renderInlineTokens(block.text)}
              </p>
            );
          case "unordered-list":
            return (
              <ul
                key={index}
                className="list-disc space-y-2 pl-5 text-base text-secondary-foreground"
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInlineTokens(item)}</li>
                ))}
              </ul>
            );
          case "ordered-list":
            return (
              <ol
                key={index}
                className="list-decimal space-y-2 pl-5 text-base text-secondary-foreground"
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInlineTokens(item)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-border-token bg-surface"
              >
                <div className="flex items-center justify-between border-b border-border-token px-4 py-2 font-mono text-xs text-muted-foreground">
                  <span>{block.language}</span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
        }
      })}
    </div>
  );
}
