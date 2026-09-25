import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    clientPrefix: "VITE_",
    client: {
        VITE_CONVEX_URL: z.url(),
        VITE_CONVEX_SITE_URL: z.url(),
        VITE_VAPID_PUBLIC_KEY: z.string().optional(),
    },
    runtimeEnv: (import.meta as any).env,
    emptyStringAsUndefined: true,
});
