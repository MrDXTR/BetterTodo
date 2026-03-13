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

function GoogleSignInButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("inviteToken");
        await authClient.signIn.social({
            provider: "google",
            callbackURL: token ? `/sign-in?inviteToken=${token}` : "/dashboard",
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

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
    const navigate = useNavigate({
        from: "/",
    });

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            await authClient.signIn.email(
                {
                    email: value.email,
                    password: value.password,
                },
                {
                    onSuccess: () => {
                        const searchParams = new URLSearchParams(window.location.search);
                        if (!searchParams.has("inviteToken")) {
                            navigate({
                                to: "/dashboard",
                            });
                        }
                        toast.success("Sign in successful");
                    },
                    onError: (error) => {
                        toast.error(error.error.message || error.error.statusText);
                    },
                },
            );
        },
        validators: {
            onSubmit: z.object({
                email: z.email("Invalid email address"),
                password: z.string().min(8, "Password must be at least 8 characters"),
            }),
        },
    });

    return (
        <div className="mx-auto w-full max-w-md p-6">
            <h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>

            <div className="mb-6">
                <GoogleSignInButton />
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                    </span>
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className="space-y-4"
            >
                <div>
                    <form.Field name="email">
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Email</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                {field.state.meta.errors.map((error) => (
                                    <p key={error?.message} className="text-red-500">
                                        {error?.message}
                                    </p>
                                ))}
                            </div>
                        )}
                    </form.Field>
                </div>

                <div>
                    <form.Field name="password">
                        {(field) => (
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
                                {field.state.meta.errors.map((error) => (
                                    <p key={error?.message} className="text-red-500">
                                        {error?.message}
                                    </p>
                                ))}
                            </div>
                        )}
                    </form.Field>
                </div>

                <form.Subscribe>
                    {(state) => (
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!state.canSubmit || state.isSubmitting}
                        >
                            {state.isSubmitting ? "Submitting..." : "Sign In"}
                        </Button>
                    )}
                </form.Subscribe>
            </form>

            <div className="mt-4 text-center">
                <Button
                    variant="link"
                    onClick={onSwitchToSignUp}
                    className="text-indigo-600 hover:text-indigo-800"
                >
                    Need an account? Sign Up
                </Button>
            </div>
        </div>
    );
}
