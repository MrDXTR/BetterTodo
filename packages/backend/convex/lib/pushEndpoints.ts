const SUPPORTED_PUSH_SERVICE_ORIGINS = new Set([
    "https://fcm.googleapis.com",
    "https://updates.push.services.mozilla.com",
    "https://web.push.apple.com",
]);

/** Reject malformed endpoints and endpoints outside the supported push services. */
export function validatePushEndpoint(endpoint: string) {
    let url: URL;
    try {
        url = new URL(endpoint);
    } catch {
        throw new Error("Invalid push subscription endpoint");
    }

    if (url.username || url.password || !SUPPORTED_PUSH_SERVICE_ORIGINS.has(url.origin)) {
        throw new Error("Unsupported push subscription endpoint");
    }
}
