import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

export interface SafeTarget {
  url: URL;
  address: string;
  family: 4 | 6;
}

export type HostResolver = (hostname: string) => Promise<ResolvedAddress[]>;

export class BlockedTargetError extends Error {
  readonly code = "BLOCKED_TARGET";

  constructor(message = "Requests to private or internal network addresses are not allowed.") {
    super(message);
    this.name = "BlockedTargetError";
  }
}

export class DnsResolutionError extends Error {
  readonly code = "DNS_ERROR";

  constructor() {
    super("The target hostname could not be resolved.");
    this.name = "DnsResolutionError";
  }
}

const internalHostnameSuffixes = [
  "localhost",
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".home",
  ".home.arpa",
];

const metadataHostnames = new Set([
  "metadata.google.internal",
  "metadata.google",
  "instance-data",
  "metadata.azure.internal",
]);

const defaultResolver: HostResolver = async (hostname) => {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  return records.map((record) => ({
    address: record.address,
    family: record.family as 4 | 6,
  }));
};

export async function resolveSafeTarget(
  value: string | URL,
  resolver: HostResolver = defaultResolver,
): Promise<SafeTarget> {
  const url = value instanceof URL ? new URL(value) : parseHttpUrl(value);
  validateUrlShape(url);

  const hostname = normalizeHostname(url.hostname);
  validateHostname(hostname);

  const literalFamily = isIP(hostname);
  if (literalFamily) {
    assertPublicAddress(hostname);
    return { url, address: hostname, family: literalFamily as 4 | 6 };
  }

  let addresses: ResolvedAddress[];
  try {
    addresses = await resolver(hostname);
  } catch {
    throw new DnsResolutionError();
  }

  if (addresses.length === 0) throw new DnsResolutionError();

  for (const resolved of addresses) {
    if (resolved.family !== 4 && resolved.family !== 6) {
      throw new BlockedTargetError();
    }
    assertPublicAddress(resolved.address);
  }

  const selected = addresses[0];
  return { url, address: selected.address, family: selected.family };
}

export function parseHttpUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BlockedTargetError("Enter a valid absolute HTTP or HTTPS URL.");
  }
  validateUrlShape(url);
  return url;
}

export function isPublicAddress(address: string) {
  try {
    assertPublicAddress(address);
    return true;
  } catch {
    return false;
  }
}

function validateUrlShape(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedTargetError("Only HTTP and HTTPS request URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new BlockedTargetError("Credentials are not allowed in request URLs.");
  }
  if (!url.hostname || url.hostname.length > 253) {
    throw new BlockedTargetError("Enter a valid public hostname.");
  }
}

function validateHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  if (
    metadataHostnames.has(lower) ||
    internalHostnameSuffixes.some((suffix) => lower === suffix || lower.endsWith(suffix))
  ) {
    throw new BlockedTargetError();
  }

  if (lower.includes("%")) throw new BlockedTargetError();
}

function normalizeHostname(hostname: string) {
  const withoutBrackets = hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
  return withoutBrackets.endsWith(".") ? withoutBrackets.slice(0, -1) : withoutBrackets;
}

function assertPublicAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    if (isForbiddenIpv4(address)) throw new BlockedTargetError();
    return;
  }
  if (family === 6) {
    if (isForbiddenIpv6(address)) throw new BlockedTargetError();
    return;
  }
  throw new BlockedTargetError("The target resolved to an invalid network address.");
}

function isForbiddenIpv4(address: string) {
  const [a, b, c] = address.split(".").map(Number);

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isForbiddenIpv6(address: string) {
  const words = parseIpv6(address);
  if (!words) return true;

  const allZero = words.every((word) => word === 0);
  const loopback = words.slice(0, 7).every((word) => word === 0) && words[7] === 1;
  if (allZero || loopback) return true;

  const ipv4Mapped = words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff;
  if (ipv4Mapped) {
    const mapped = `${words[6] >> 8}.${words[6] & 0xff}.${words[7] >> 8}.${words[7] & 0xff}`;
    return isForbiddenIpv4(mapped);
  }

  const first = words[0];
  if ((first & 0xfe00) === 0xfc00) return true;
  if ((first & 0xffc0) === 0xfe80) return true;
  if ((first & 0xff00) === 0xff00) return true;

  // Only globally routed unicast space is eligible. Special transition and
  // documentation ranges inside it are denied explicitly below.
  if ((first & 0xe000) !== 0x2000) return true;
  if (first === 0x2001 && words[1] === 0x0db8) return true;
  if (first === 0x2001 && words[1] === 0x0000) return true;
  if (first === 0x2001 && words[1] === 0x0002) return true;
  if (first === 0x2001 && (words[1] & 0xfff0) === 0x0010) return true;
  if (first === 0x2001 && (words[1] & 0xfff0) === 0x0020) return true;
  if (first === 0x2002 || first === 0x3ffe) return true;
  if (first === 0x0064 && words[1] === 0xff9b) return true;

  return false;
}

function parseIpv6(address: string): number[] | null {
  if (address.includes("%")) return null;
  let candidate = address.toLowerCase();

  if (candidate.includes(".")) {
    const lastColon = candidate.lastIndexOf(":");
    if (lastColon < 0) return null;
    const ipv4 = candidate.slice(lastColon + 1);
    if (isIP(ipv4) !== 4) return null;
    const octets = ipv4.split(".").map(Number);
    candidate = `${candidate.slice(0, lastColon)}:${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }

  const halves = candidate.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  if (halves.length === 1 && left.length !== 8) return null;
  if (halves.length === 2 && left.length + right.length >= 8) return null;

  const missing = 8 - left.length - right.length;
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return null;
  }
  return groups.map((group) => Number.parseInt(group, 16));
}

