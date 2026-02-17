import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Trello, Users, Zap } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>
      <AuthLoading>
        <LandingLoading />
      </AuthLoading>
      <Unauthenticated>
        <LandingContent />
      </Unauthenticated>
    </>
  );
}

function LandingLoading() {
  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function LandingContent() {
  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Organize tasks.{" "}
            <span className="text-primary">Ship faster.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A Trello-like board to manage your tasks, collaborate with your team,
            and get things done.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/sign-in">
              <Button size="lg" className="w-full sm:w-auto text-base px-8">
                Get Started
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Everything you need to manage work
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Trello className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Kanban Boards</h3>
              <p className="text-sm text-muted-foreground">
                Drag-and-drop cards across lists. Visualize your workflow at a glance.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Invite teammates, assign cards, and work together in real time.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Fast & Simple</h3>
              <p className="text-sm text-muted-foreground">
                Clean UI, keyboard shortcuts, and built for speed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">
            Ready to organize your work?
          </p>
          <Link to="/sign-in">
            <Button size="lg">Create your first board</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function RedirectToDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/dashboard", replace: true });
  }, [navigate]);
  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
