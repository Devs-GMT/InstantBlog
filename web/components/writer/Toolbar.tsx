"use client";
// Formatting toolbar — always works, even when the Worker is down. PRD E-8.
import { useEditorState, type Editor } from "@tiptap/react";

export function Toolbar({ editor, serif, onSerif }: { editor: Editor; serif: boolean; onSerif: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      link: e.isActive("link"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      editable: e.isEditable,
    }),
  });

  const btn = (label: string, active: boolean, run: () => void, content: React.ReactNode, disabled = false) => (
    <button type="button" className={`icon-btn${active ? " is-active" : ""}`} aria-label={label} title={label} aria-pressed={active} disabled={disabled || !s.editable} onMouseDown={(e) => e.preventDefault()} onClick={run}>
      {content}
    </button>
  );

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") return editor.chain().focus().extendMarkRange("link").unsetLink().run();
    if (!/^https?:\/\//i.test(url.trim())) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      {btn("Heading 2", s.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2")}
      {btn("Heading 3", s.h3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3")}
      <span className="sep" />
      {btn("Bold", s.bold, () => editor.chain().focus().toggleBold().run(), <b>B</b>)}
      {btn("Italic", s.italic, () => editor.chain().focus().toggleItalic().run(), <i>I</i>)}
      {btn("Bullet list", s.bullet, () => editor.chain().focus().toggleBulletList().run(), "•")}
      {btn("Numbered list", s.ordered, () => editor.chain().focus().toggleOrderedList().run(), "1.")}
      {btn("Link", s.link, setLink, "🔗")}
      {btn("Quote", s.quote, () => editor.chain().focus().toggleBlockquote().run(), "❝")}
      <span className="sep" />
      {btn("Undo", false, () => editor.chain().focus().undo().run(), "↶", !s.canUndo)}
      {btn("Redo", false, () => editor.chain().focus().redo().run(), "↷", !s.canRedo)}
      <span className="spacer" />
      <button type="button" className={`icon-btn${serif ? " is-active" : ""}`} style={{ width: "auto", padding: "0 10px", fontSize: 13 }} aria-pressed={serif} onClick={onSerif} title="Serif body text">
        Aa Serif
      </button>
    </div>
  );
}
