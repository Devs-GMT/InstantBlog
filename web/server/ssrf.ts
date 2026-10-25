// SSRF guard: only public http(s) hosts on default ports. Run on every redirect hop.

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home.arpa", ".intranet", ".corp"];

export type GuardResult = { ok: true; url: URL } | { ok: false; reason: "blocked_address" | "bad_url" };

export function guardUrl(raw: string, base?: URL): GuardResult {
  let url: URL;
  try {
    url = base ? new URL(raw, base) : new URL(raw);
  } catch {
    return { ok: false, reason: "bad_url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, reason: "bad_url" };
  if (url.username || url.password) return { ok: false, reason: "blocked_address" };
  if (url.port && url.port !== "80" && url.port !== "443") return { ok: false, reason: "blocked_address" };

  // WHATWG URL parsing already normalises decimal/hex/octal IPv4 forms to dotted quads.
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost") return { ok: false, reason: "blocked_address" };
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) return { ok: false, reason: "blocked_address" };

  if (host.startsWith("[")) {
    if (isBlockedIPv6(host.slice(1, -1))) return { ok: false, reason: "blocked_address" };
    return { ok: true, url };
  }
  const v4 = parseIPv4(host);
  if (v4) {
    if (isBlockedIPv4(v4)) return { ok: false, reason: "blocked_address" };
    return { ok: true, url };
  }
  if (!host.includes(".")) return { ok: false, reason: "blocked_address" }; // single-label names
  return { ok: true, url };
}

/** True for loopback, private, link-local (incl. cloud metadata 169.254.169.254), CGNAT, multicast, etc. */
export function isBlockedAddress(ip: string): boolean {
  const v4 = parseIPv4(ip);
  if (v4) return isBlockedIPv4(v4);
  if (ip.includes(":")) return isBlockedIPv6(ip.replace(/^\[|\]$/g, ""));
  return true; // not an IP literal we understand → refuse
}

function parseIPv4(host: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every((p) => p <= 255) ? parts : null;
}

function isBlockedIPv4([a, b, c]: number[]): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIPv6(raw: string): boolean {
  const ip = raw.toLowerCase();
  if (ip === "::" || ip === "::1") return true;
  // IPv4-mapped / compatible, e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1
  const mapped = /^::(?:ffff:)?(.+)$/.exec(ip);
  if (mapped) {
    const tail = mapped[1];
    const dotted = parseIPv4(tail);
    if (dotted) return isBlockedIPv4(dotted);
    const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(tail);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      return isBlockedIPv4([hi >> 8, hi & 255, lo >> 8, lo & 255]);
    }
  }
  const first = parseInt(ip.split(":")[0] || "0", 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if ((first & 0xff00) === 0xff00) return true; // multicast
  return false;
}
