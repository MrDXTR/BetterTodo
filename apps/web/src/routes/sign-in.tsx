import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useEffect, useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <>
      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>
      <AuthLoading>
        <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AuthLoading>
      <Unauthenticated>
      <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </div>
      </Unauthenticated>
    </>
  );
}

function RedirectToDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/dashboard" });
  }, [navigate]);
  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
