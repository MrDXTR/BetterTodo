import { api } from "@BetterTodo/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Kanban, ListTodo, CheckCircle2, AlertTriangle, CalendarClock, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBoardModal } from "@/components/Board/CreateBoardModal";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
    component: RouteComponent,
});

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
    const tasksData = useQuery(api.dashboard.getMyOpenTasks);
    const isLoading = tasksData === undefined;

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

    const tasks = tasksData?.tasks ?? [];

    if (tasks.length === 0) {
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
                            No open checklist tasks. You're all caught up!
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Group by board
    const grouped = tasks.reduce(
        (acc, task) => {
            if (!task) return acc;
            const key = task.boardId;
            if (!acc[key])
                acc[key] = {
                    boardTitle: task.boardTitle,
                    boardColor: task.boardColor,
                    boardId: task.boardId,
                    tasks: [],
                };
            acc[key].tasks.push(task);
            return acc;
        },
        {} as Record<
            string,
            { boardTitle: string; boardColor?: string; boardId: string; tasks: typeof tasks }
        >,
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    My Tasks
                    <Badge variant="secondary" className="ml-auto">
                        {tasks.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 max-h-[400px] overflow-y-auto">
                {(
                    Object.entries(grouped) as Array<
                        [
                            string,
                            {
                                boardTitle: string;
                                boardColor?: string;
                                boardId: string;
                                tasks: typeof tasks;
                            },
                        ]
                    >
                ).map(([boardId, group]) => (
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
                            {group.tasks.map((task) => {
                                if (!task) return null;
                                const priorityConfig = task.priority
                                    ? PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
                                    : null;
                                return (
                                    <Link
                                        key={task._id}
                                        to="/boards/$boardId"
                                        params={{ boardId: task.boardId }}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate font-medium">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {task.cardTitle} · {task.listName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {priorityConfig && (
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0",
                                                        priorityConfig.color,
                                                        "text-white",
                                                    )}
                                                >
                                                    {priorityConfig.label}
                                                </Badge>
                                            )}
                                            {task.dueDate && (
                                                <Badge
                                                    variant={
                                                        task.isOverdue ? "destructive" : "secondary"
                                                    }
                                                    className="text-[10px] px-1.5 py-0 gap-1"
                                                >
                                                    <CalendarClock className="h-2.5 w-2.5" />
                                                    {new Date(task.dueDate).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                        },
                                                    )}
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
// MAIN DASHBOARD
// ============================================

function RouteComponent() {
    return (
        <>
            <Authenticated>
                <DashboardContent />
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

function DashboardContent() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();
    const boards = useQuery(api.boards.getAll);
    const tasksData = useQuery(api.dashboard.getMyOpenTasks);
    const completedCount = useQuery(api.dashboard.getMyCompletedThisWeek);

    const boardsLoading = boards === undefined;
    const tasksLoading = tasksData === undefined;
    const completedLoading = completedCount === undefined;

    const boardCount = boards?.length ?? 0;
    const taskCount = tasksData?.tasks?.length ?? 0;
    const overdueCount = tasksData?.overdueCount ?? 0;

    return (
        <>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="mt-2 text-muted-foreground">Your tasks at a glance</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard
                        title="Total Boards"
                        icon={Kanban}
                        value={boardCount}
                        subtitle="Active boards you have access to"
                        loading={boardsLoading}
                    />
                    <StatCard
                        title="My Tasks"
                        icon={ListTodo}
                        value={taskCount}
                        subtitle="Open checklist tasks"
                        loading={tasksLoading}
                    />
                    <StatCard
                        title="Overdue"
                        icon={AlertTriangle}
                        value={overdueCount}
                        subtitle="Tasks past their due date"
                        loading={tasksLoading}
                        accent={overdueCount > 0 ? "text-destructive" : undefined}
                    />
                    <StatCard
                        title="Completed"
                        icon={CheckCircle2}
                        value={completedCount ?? 0}
                        subtitle="Completed checklist tasks"
                        loading={completedLoading}
                        accent="text-green-500"
                    />
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <Link to="/boards">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Kanban className="h-4 w-4" />
                            View All Boards
                        </Button>
                    </Link>
                    <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Board
                    </Button>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl">
                    <MyTasksSection />
                </div>
            </div>

            <CreateBoardModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onCreated={(boardId) => {
                    navigate({
                        to: "/boards/$boardId",
                        params: { boardId },
                    });
                }}
            />
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
