// Formatting + small browser helpers (no React).

export const shortAddr = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const fmtNum = (n: number) => Number(n).toLocaleString("en-US");

export function timeAgo(ms: number) {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return fmtDate(ms);
}

export function slugify(s: string) {
  return (
    (s || "article")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 60) || "article"
  );
}

/** Cut a UTF-8 string to at most `max` bytes without splitting a character. */
export function cutBytes(s: string, max: number) {
  const enc = new TextEncoder();
  let chars = [...s];
  while (enc.encode(chars.join("")).length > max) chars = chars.slice(0, -1);
  return chars.join("");
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const readingTime = (words: number, wpm = 238) => Math.max(1, Math.ceil(words / wpm));
