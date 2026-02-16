import { api } from "@BetterTodo/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import {
  Trello,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  CalendarClock,
  Plus,
} from "lucide-react";
import { useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

// ============================================
// HELPERS
// ============================================

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function actionTypeLabel(actionType: string): string {
  const map: Record<string, string> = {
    board_created: "created a board",
    board_updated: "updated a board",
    board_archived: "archived a board",
    board_restored: "restored a board",
    card_created: "created a card",
    card_updated: "updated a card",
    card_moved: "moved a card",
    card_archived: "archived a card",
    card_restored: "restored a card",
    card_deleted: "deleted a card",
    list_created: "created a list",
    list_updated: "updated a list",
    list_archived: "archived a list",
    comment_added: "commented on a card",
    comment_deleted: "deleted a comment",
    member_added: "added a member",
    member_removed: "removed a member",
    member_role_updated: "changed a member's role",
    label_created: "created a label",
    label_assigned: "assigned a label",
    checklist_created: "added a checklist",
    user_assigned: "assigned a user",
    user_unassigned: "unassigned a user",
  };
  return map[actionType] ?? actionType.replace(/_/g, " ");
}

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({
  title,
  icon: Icon,
  value,
  subtitle,
  loading,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  value: number | string;
  subtitle: string;
  loading: boolean;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", accent)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// MY TASKS SECTION
// ============================================

function MyTasksSection() {
  const assignedData = useQuery(api.dashboard.getMyAssignedCards);
  const isLoading = assignedData === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const cards = assignedData?.cards ?? [];

  if (cards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No tasks assigned to you. You're all caught up!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by board
  const grouped = cards.reduce(
    (acc, card) => {
      if (!card) return acc;
      const key = card.boardId;
      if (!acc[key]) acc[key] = { boardTitle: card.boardTitle, boardColor: card.boardColor, boardId: card.boardId, cards: [] };
      acc[key].cards.push(card);
      return acc;
    },
    {} as Record<string, { boardTitle: string; boardColor?: string; boardId: string; cards: typeof cards }>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          My Tasks
          <Badge variant="secondary" className="ml-auto">
            {cards.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 max-h-[400px] overflow-y-auto">
        {Object.entries(grouped).map(([boardId, group]) => (
          <div key={boardId}>
            <Link
              to="/boards/$boardId"
              params={{ boardId }}
              className="flex items-center gap-2 mb-2 group"
            >
              <div
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: group.boardColor ?? "#0079BF" }}
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">
                {group.boardTitle}
              </span>
            </Link>
            <div className="space-y-1.5 ml-5">
              {group.cards.map((card) => {
                if (!card) return null;
                const priorityConfig = card.priority
                  ? PRIORITY_CONFIG[card.priority as keyof typeof PRIORITY_CONFIG]
                  : null;
                return (
                  <Link
                    key={card._id}
                    to="/boards/$boardId"
                    params={{ boardId: card.boardId }}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">
                        {card.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {card.listName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {priorityConfig && (
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            priorityConfig.color,
                            "text-white"
                          )}
                        >
                          {priorityConfig.label}
                        </Badge>
                      )}
                      {card.dueDate && (
                        <Badge
                          variant={card.isOverdue ? "destructive" : "secondary"}
                          className="text-[10px] px-1.5 py-0 gap-1"
                        >
                          <CalendarClock className="h-2.5 w-2.5" />
                          {new Date(card.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================
// RECENT ACTIVITY SECTION
// ============================================

function RecentActivitySection() {
  const activity = useQuery(api.dashboard.getRecentActivity);
  const isLoading = activity === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-2 w-2 rounded-full mt-2 shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent activity to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="space-y-3">
          {activity.map((item: any) => (
            <Link
              key={item._id}
              to="/boards/$boardId"
              params={{ boardId: item.boardId }}
              className="flex gap-3 group hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors"
            >
              <div className="h-2 w-2 rounded-full bg-primary/60 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{actionTypeLabel(item.actionType)}</span>
                  <span className="text-muted-foreground">
                    {" "}in{" "}
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: item.boardColor ?? undefined }}
                  >
                    {item.boardTitle}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTimeAgo(item.createdAt)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================

function RouteComponent() {
  const boards = useQuery(api.boards.getAll);
  const assignedData = useQuery(api.dashboard.getMyAssignedCards);
  const completedCount = useQuery(api.dashboard.getMyCompletedThisWeek);

  const boardsLoading = boards === undefined;
  const assignedLoading = assignedData === undefined;
  const completedLoading = completedCount === undefined;

  const boardCount = boards?.length ?? 0;
  const taskCount = assignedData?.cards?.length ?? 0;
  const overdueCount = assignedData?.overdueCount ?? 0;

  return (
    <>
      <Authenticated>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Your tasks and activity at a glance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Boards"
              icon={Trello}
              value={boardCount}
              subtitle="Active boards you have access to"
              loading={boardsLoading}
            />
            <StatCard
              title="My Tasks"
              icon={ListTodo}
              value={taskCount}
              subtitle="Cards assigned to you"
              loading={assignedLoading}
            />
            <StatCard
              title="Overdue"
              icon={AlertTriangle}
              value={overdueCount}
              subtitle="Tasks past their due date"
              loading={assignedLoading}
              accent={overdueCount > 0 ? "text-destructive" : undefined}
            />
            <StatCard
              title="Completed"
              icon={CheckCircle2}
              value={completedCount ?? 0}
              subtitle="Tasks completed this week"
              loading={completedLoading}
              accent="text-green-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/boards">
              <Button variant="outline" size="sm" className="gap-2">
                <Trello className="h-4 w-4" />
                View All Boards
              </Button>
            </Link>
            <Link to="/boards">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Board
              </Button>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <MyTasksSection />
            <RecentActivitySection />
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>
    </>
  );
}

function RedirectToSignIn() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/sign-in" });
  }, [navigate]);
  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to sign in...</p>
    </div>
  );
}
