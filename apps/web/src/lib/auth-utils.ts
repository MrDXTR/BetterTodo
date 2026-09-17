/**
 * Safely parses and sanitizes a redirect URL.
 *
 * Ensures the target:
 * 1. Is a valid relative path (or same-origin URL) starting with '/' and not '//', with no backslashes.
 * 2. Does not point to authentication pages (/sign-in or /sign-up) to prevent loops.
 * 3. Recursively unwraps nested redirect params (e.g. /sign-in?redirect=/dashboard)
 *    up to a max depth to recover the intended destination.
 *
 * Returns the sanitized relative URL (pathname + search + hash) or null if unsafe/invalid.
 */
export function getSafeRedirectUrl(url?: string | null, depth = 0): string | null {
    if (!url || typeof url !== "string" || depth > 10) {
        return null;
    }

    const trimmed = url.trim();
    if (!trimmed) {
        return null;
    }

    // Reject protocol-relative URLs and backslashes
    if (trimmed.startsWith("//") || trimmed.includes("\\")) {
        return null;
    }

    try {
        let parsed: URL;

        if (trimmed.startsWith("/")) {
            parsed = new URL(trimmed, "http://localhost");
        } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            parsed = new URL(trimmed);
            // If window is defined, only permit same-origin URLs
            if (typeof window !== "undefined" && window.location?.origin) {
                if (parsed.origin !== window.location.origin) {
                    return null;
                }
            } else {
                // In non-browser environments, allow only localhost or relative paths
                if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
                    return null;
                }
            }
        } else {
            return null;
        }

        // Normalize pathname: remove trailing slashes (except single '/')
        const cleanPathname = parsed.pathname.replace(/\/+$/, "") || "/";

        // Prevent redirecting back to auth pages
        if (cleanPathname === "/sign-in" || cleanPathname === "/sign-up") {
            const nestedRedirect = parsed.searchParams.get("redirect");
            if (nestedRedirect) {
                return getSafeRedirectUrl(nestedRedirect, depth + 1);
            }
            return null;
        }

        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return null;
    }
}

/**
 * Returns true if the redirect URL is safe to navigate to.
 */
export function isSafeRedirect(url?: string | null): boolean {
    return getSafeRedirectUrl(url) !== null;
}
