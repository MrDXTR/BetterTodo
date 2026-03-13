import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        tailwindcss(),
        tanstackRouter({}),
        react(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "BetterTodo",
                short_name: "BetterTodo",
                description: "BetterTodo - PWA Application",
                start_url: "/",
                display: "standalone",
                theme_color: "#0c0c0c",
                background_color: "#0c0c0c",
                icons: [
                    {
                        src: "/pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
            includeAssets: ["logo/favicon.ico", "logo/logo.svg"],
            workbox: {
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
                navigateFallback: "/index.html",
                globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts",
                            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "convex-api",
                            networkTimeoutSeconds: 5,
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
                        },
                    },
                ],
            },
            pwaAssets: { disabled: false, config: true },
            devOptions: { enabled: true },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3001,
    },
});
