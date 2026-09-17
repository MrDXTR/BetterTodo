import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { Google } from "./ui/svgs/google";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function isSafeRedirect(url: string | null): boolean {
    if (!url) return false;
    return url.startsWith("/") && !url.startsWith("//") && !url.includes("\\");
}

function GoogleSignInButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("inviteToken");
        const redirect = searchParams.get("redirect");

        let callbackURL = "/dashboard";
        if (token) {
            callbackURL = `/sign-in?inviteToken=${encodeURIComponent(token)}`;
        } else if (isSafeRedirect(redirect)) {
            callbackURL = redirect!;
        }

        await authClient.signIn.social({
            provider: "google",
            callbackURL,
        });
        setIsLoading(false);
    };

    return (
        <Button
            disabled={isLoading}
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Google className="mr-2 h-4 w-4" />
            )}
            Continue with Google
        </Button>
    );
}

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
    const navigate = useNavigate({
        from: "/",
    });

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
        onSubmit: async ({ value }) => {
            await authClient.signUp.email(
                {
                    email: value.email,
                    password: value.password,
                    name: value.name,
                },
                {
                    onSuccess: () => {
                        const searchParams = new URLSearchParams(window.location.search);
                        const redirect = searchParams.get("redirect");
                        if (!searchParams.has("inviteToken")) {
                            if (isSafeRedirect(redirect)) {
                                window.location.href = redirect!;
                            } else {
                                navigate({
                                    to: "/dashboard",
                                });
                            }
                        }
                        toast.success("Sign up successful");
                    },
                    onError: (error) => {
                        toast.error(error.error.message || error.error.statusText);
                    },
                },
            );
        },
        validators: {
            onSubmit: z.object({
                name: z.string().min(2, "Name must be at least 2 characters"),
                email: z.string().email("Invalid email address"),
                password: z.string().min(8, "Password must be at least 8 characters"),
            }),
        },
    });

    return (
        <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-6 shadow-xs">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight">Sign Up</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your information to create an account
                </p>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className="space-y-4"
            >
                <form.Field
                    name="name"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Name</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                placeholder="John Doe"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <p className="text-xs text-destructive">
                                    {field.state.meta.errors[0]?.message}
                                </p>
                            )}
                        </div>
                    )}
                />

                <form.Field
                    name="email"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Email</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="email"
                                placeholder="m@example.com"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <p className="text-xs text-destructive">
                                    {field.state.meta.errors[0]?.message}
                                </p>
                            )}
                        </div>
                    )}
                />

                <form.Field
                    name="password"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name}>Password</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <p className="text-xs text-destructive">
                                    {field.state.meta.errors[0]?.message}
                                </p>
                            )}
                        </div>
                    )}
                />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Sign Up
                        </Button>
                    )}
                />
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <GoogleSignInButton />

            <div className="text-center text-sm">
                Already have an account?{" "}
                <button
                    onClick={onSwitchToSignIn}
                    className="font-medium text-primary hover:underline cursor-pointer"
                >
                    Sign in
                </button>
            </div>
        </div>
    );
}
