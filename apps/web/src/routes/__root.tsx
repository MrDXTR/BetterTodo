import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import AppNav from "@/components/AppNav";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
    component: RootComponent,
    head: () => ({
        meta: [
            {
                title: "BetterTodo",
            },
            {
                name: "description",
                content: "BetterTodo is a web application",
            },
            {
                name: "theme-color",
                content: "#0c0c0c",
            },
            {
                name: "apple-mobile-web-app-capable",
                content: "yes",
            },
        ],
        links: [
            {
                rel: "icon",
                href: "/favicon.ico",
            },
            {
                rel: "manifest",
                href: "/site.webmanifest",
            },
            {
                rel: "apple-touch-icon",
                href: "/apple-touch-icon.png",
            },
        ],
    }),
});

function RootComponent() {
    return (
        <>
            <HeadContent />
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                disableTransitionOnChange
                storageKey="vite-ui-theme"
            >
                <div className="grid grid-rows-[auto_1fr] h-svh">
                    <AppNav />
                    <Outlet />
                </div>
                <Toaster richColors />
            </ThemeProvider>
            {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-left" /> : null}
        </>
    );
}
