// fetch() that refuses to connect to private/internal addresses — checked on the resolved IP at
// connect time (every redirect hop), so hostnames pointing inward and DNS rebinding are blocked too.
import dns from "node:dns";
import { Agent, fetch as undiciFetch } from "undici";
import { isBlockedAddress } from "./ssrf";

export class BlockedAddressError extends Error {
  code = "EBLOCKED";
}

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void;

function guardedLookup(hostname: string, options: dns.LookupOptions, callback: LookupCb) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    const list = addresses as dns.LookupAddress[];
    if (!list.length || list.some((a) => isBlockedAddress(a.address))) {
      return callback(new BlockedAddressError(`Blocked address for ${hostname}`), "");
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

const agent = new Agent({
  connect: { lookup: guardedLookup as never, timeout: 5000 },
  headersTimeout: 5000,
  bodyTimeout: 5000,
});

export function safeFetch(url: string, init: Parameters<typeof undiciFetch>[1] = {}) {
  return undiciFetch(url, { ...init, dispatcher: agent });
}

/** Walks the error cause chain (undici wraps connect errors) looking for our block. */
export function isBlockedError(err: unknown): boolean {
  let e = err as { cause?: unknown; code?: string } | undefined;
  for (let i = 0; e && i < 5; i++) {
    if (e instanceof BlockedAddressError || e.code === "EBLOCKED") return true;
    e = e.cause as typeof e;
  }
  return false;
}
