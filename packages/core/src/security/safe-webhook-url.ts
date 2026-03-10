import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

type RuntimeEnvironment = "development" | "test" | "production";

function parseEnvironment(environment?: string): RuntimeEnvironment {
    if (environment === "production" || environment === "test") {
        return environment;
    }

    return "development";
}

function ipv4ToInt(address: string) {
    return address
        .split(".")
        .map((part) => Number.parseInt(part, 10))
        .reduce((result, octet) => (result << 8) + octet, 0) >>> 0;
}

function isIpv4InCidr(address: string, network: string, prefix: number) {
    const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
    return (ipv4ToInt(address) & mask) === (ipv4ToInt(network) & mask);
}

function isPrivateOrReservedIpv4(address: string) {
    const reservedRanges: Array<[string, number]> = [
        ["0.0.0.0", 8],
        ["10.0.0.0", 8],
        ["100.64.0.0", 10],
        ["127.0.0.0", 8],
        ["169.254.0.0", 16],
        ["172.16.0.0", 12],
        ["192.0.0.0", 24],
        ["192.0.2.0", 24],
        ["192.168.0.0", 16],
        ["198.18.0.0", 15],
        ["198.51.100.0", 24],
        ["203.0.113.0", 24],
        ["224.0.0.0", 4],
        ["240.0.0.0", 4],
    ];

    return reservedRanges.some(([network, prefix]) => isIpv4InCidr(address, network, prefix));
}

function isPrivateOrReservedIpv6(address: string) {
    const normalized = address.toLowerCase();

    return (
        normalized === "::" ||
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe8") ||
        normalized.startsWith("fe9") ||
        normalized.startsWith("fea") ||
        normalized.startsWith("feb")
    );
}

function isPrivateOrReservedIp(address: string) {
    const family = isIP(address);

    if (family === 4) {
        return isPrivateOrReservedIpv4(address);
    }

    if (family === 6) {
        return isPrivateOrReservedIpv6(address);
    }

    return true;
}

function isLocalHostname(hostname: string) {
    const normalized = hostname.toLowerCase();
    return (
        normalized === "localhost" ||
        normalized.endsWith(".localhost") ||
        normalized.endsWith(".local") ||
        normalized.endsWith(".internal")
    );
}

export async function assertSafeWebhookUrl(
    rawUrl: string,
    options?: {
        environment?: RuntimeEnvironment;
        dnsLookup?: typeof lookup;
    }
) {
    const environment = parseEnvironment(options?.environment ?? process.env.NODE_ENV);
    const callbackUrl = new URL(rawUrl);

    if (callbackUrl.username || callbackUrl.password) {
        throw new Error("Webhook URLs must not include embedded credentials.");
    }

    if (environment === "production" && callbackUrl.protocol !== "https:") {
        throw new Error("Webhook URLs must use HTTPS in production.");
    }

    if (callbackUrl.protocol !== "https:" && callbackUrl.protocol !== "http:") {
        throw new Error("Webhook URLs must use HTTP or HTTPS.");
    }

    if (isLocalHostname(callbackUrl.hostname)) {
        throw new Error("Webhook URLs must target a public hostname.");
    }

    if (isIP(callbackUrl.hostname)) {
        if (isPrivateOrReservedIp(callbackUrl.hostname)) {
            throw new Error("Webhook URLs must not target private or reserved IP ranges.");
        }

        return callbackUrl;
    }

    const dnsLookup = options?.dnsLookup ?? lookup;
    const addresses = await dnsLookup(callbackUrl.hostname, { all: true, verbatim: true });

    if (addresses.length === 0) {
        throw new Error("Webhook hostname could not be resolved.");
    }

    if (addresses.some((entry) => isPrivateOrReservedIp(entry.address))) {
        throw new Error("Webhook URLs must not resolve to private or reserved IP ranges.");
    }

    return callbackUrl;
}
