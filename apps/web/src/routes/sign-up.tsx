import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const signUpSearchSchema = z.object({
    inviteToken: z.string().optional(),
    redirect: z.string().optional(),
});

export const Route = createFileRoute("/sign-up")({
    validateSearch: signUpSearchSchema,
    beforeLoad: ({ search }) => {
        throw redirect({
            to: "/sign-in",
            search: {
                ...search,
                mode: "signup",
            },
            replace: true,
        });
    },
});
