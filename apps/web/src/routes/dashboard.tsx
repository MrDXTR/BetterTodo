import { api } from "@BetterTodo/backend/convex/_generated/api";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import {
    Kanban,
    ListTodo,
    CheckCircle2,
    AlertTriangle,
    CalendarClock,
    Plus,
    ArrowRight,
    Clock,
} from "lucide-react";
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
        <Card className="p-3.5 sm:p-5 border-border/70 bg-card/60 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between pb-1.5">
                <span className="text-xs font-medium text-muted-foreground truncate">{title}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                    <Icon className={cn("h-3.5 w-3.5 text-muted-foreground", accent)} />
                </div>
            </div>
            <div className="mt-1">
                {loading ? (
                    <div className="space-y-1.5">
                        <Skeleton className="h-7 w-14 rounded" />
                        <Skeleton className="h-3 w-24 rounded" />
                    </div>
                ) : (
                    <>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {value}
                        </div>
                        <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground truncate">
                            {subtitle}
                        </p>
                    </>
                )}
            </div>
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
            <Card className="border-border/70 bg-card/60 shadow-2xs">
                <CardHeader className="p-4 sm:p-5 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <ListTodo className="h-4 w-4 text-primary" />
                        <span>My Tasks</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
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
            <Card className="border-border/70 bg-card/60 shadow-2xs">
                <CardHeader className="p-4 sm:p-5 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <ListTodo className="h-4 w-4 text-primary" />
                        <span>My Tasks</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-2">
                    <div className="text-center py-8">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-2.5" />
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                            You're all caught up!
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            No open checklist tasks assigned to you.
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
        <Card className="border-border/70 bg-card/60 shadow-2xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                    <div className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4 text-primary" />
                        <span>My Tasks</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {tasks.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-4 max-h-[420px] overflow-y-auto overflow-x-hidden">
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
                    <div key={boardId} className="space-y-2">
                        <Link
                            to="/boards/$boardId"
                            params={{ boardId }}
                            className="inline-flex items-center gap-1.5 group cursor-pointer"
                        >
                            <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: group.boardColor ?? "#0079BF" }}
                            />
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors truncate max-w-[200px] sm:max-w-xs">
                                {group.boardTitle}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <div className="space-y-1.5">
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
                                        className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-3 p-2.5 rounded-xl border border-border/50 bg-background/60 hover:bg-muted/40 hover:border-border transition-colors group cursor-pointer active:scale-[0.99]"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                                {task.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {task.cardTitle} · {task.listName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 self-start xs:self-auto flex-wrap">
                                            {priorityConfig && (
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0 h-4 shrink-0",
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
                                                    className="text-[10px] px-1.5 py-0 h-4 gap-1 shrink-0"
                                                >
                                                    <CalendarClock className="h-2.5 w-2.5" />
                                                    <span>
                                                        {new Date(task.dueDate).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                            },
                                                        )}
                                                    </span>
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
            <div className="h-full w-full overflow-y-auto overflow-x-hidden">
                <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                            Your tasks and team progress at a glance
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Boards"
                            icon={Kanban}
                            value={boardCount}
                            subtitle="Active boards"
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
                            subtitle="Past due date"
                            loading={tasksLoading}
                            accent={overdueCount > 0 ? "text-destructive" : undefined}
                        />
                        <StatCard
                            title="Completed"
                            icon={CheckCircle2}
                            value={completedCount ?? 0}
                            subtitle="This week"
                            loading={completedLoading}
                            accent="text-emerald-500"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <Link to="/boards">
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                <Kanban className="h-3.5 w-3.5" />
                                <span>View All Boards</span>
                            </Button>
                        </Link>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>New Board</span>
                        </Button>
                    </div>

                    {/* Main Content */}
                    <div className="w-full max-w-2xl min-w-0">
                        <MyTasksSection />
                    </div>
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

export default RouteComponent;
