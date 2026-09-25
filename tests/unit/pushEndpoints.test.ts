import { describe, expect, it } from "bun:test";

import { validatePushEndpoint } from "../../packages/backend/convex/lib/pushEndpoints";

describe("push endpoint validation", () => {
    it.each([
        "https://fcm.googleapis.com/fcm/send/subscription-id",
        "https://updates.push.services.mozilla.com/wpush/v2/subscription-id",
        "https://web.push.apple.com/subscription-id",
    ])("accepts a supported push-service endpoint", (endpoint) => {
        expect(() => validatePushEndpoint(endpoint)).not.toThrow();
    });

    it.each([
        "not-a-url",
        "http://fcm.googleapis.com/fcm/send/subscription-id",
        "https://fcm.googleapis.com.evil.example/fcm/send/subscription-id",
        "https://fcm.googleapis.com:444/fcm/send/subscription-id",
        "https://user:password@fcm.googleapis.com/fcm/send/subscription-id",
    ])("rejects an unsupported push-service endpoint", (endpoint) => {
        expect(() => validatePushEndpoint(endpoint)).toThrow();
    });
});
