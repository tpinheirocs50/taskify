import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleDollarSign,
    ClipboardList,
    ListTodo,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string;
    amount: number | null;
    user_id: number;
    user_name: string;
    client_name: string;
    client_company: string | null;
    created_at: string;
}

interface DashboardStats {
    totalRevenue: number;
    openTasks: number;
    allTasks: number;
}

interface MonthlyRevenue {
    month: string;
    revenue: number;
}

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        openTasks: 0,
        allTasks: 0,
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const chartConfig = {
        revenue: {
            label: 'Revenue',
            color: 'var(--primary)',
        },
    } satisfies ChartConfig;

    useEffect(() => {
        // Fetch all tasks handling pagination
        const fetchAllTasks = async () => {
            try {
                let allTasks: Task[] = [];
                let currentPage = 1;
                let lastPage = 1;

                // Fetch first page to get pagination info
                do {
                    const response = await fetch(`/api/tasks?page=${currentPage}`);
                    const data = await response.json();

                    if (data.success) {
                        allTasks = [...allTasks, ...data.data];
                        lastPage = data.pagination.last_page;
                        currentPage++;
                    } else {
                        break;
                    }
                } while (currentPage <= lastPage);

                // Filter tasks for current user
                const userTasks = allTasks.filter(
                    (task) => task.user_id === currentUserId,
                );
                setTasks(userTasks);
                const totalRevenue = userTasks
                    .filter((task) => task.status === 'completed')
                    .reduce(
                        (sum, task) => sum + (Number(task.amount) || 0),
                        0,
                    );
                const openTasks = userTasks.filter(
                    (task) => task.status !== 'completed',
                ).length;

                setStats({
                    totalRevenue,
                    openTasks,
                    allTasks: userTasks.length,
                });

                // Calculate monthly revenue (last 6 months) - only from completed tasks
                const today = new Date();
                const revenueByMonth: { [key: string]: number } = {};

                // Initialize last 6 months in correct order
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    revenueByMonth[monthKey] = 0;
                }

                // Populate with actual task data
                userTasks
                    .filter((task) => task.status === 'completed')
                    .forEach((task) => {
                        const date = new Date(task.due_date);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        if (revenueByMonth.hasOwnProperty(monthKey)) {
                            revenueByMonth[monthKey] += Number(task.amount) || 0;
                        }
                    });

                // Build months array with correct order
                const months: MonthlyRevenue[] = [];
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    months.push({
                        month: date.toLocaleDateString('en-US', {
                            month: 'short',
                        }),
                        revenue: revenueByMonth[monthKey] || 0,
                    });
                }
                setMonthlyRevenue(months);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                setLoading(false);
            }
        };

        if (currentUserId) {
            fetchAllTasks();
        }
    }, [currentUserId]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 dark:text-red-400';
            case 'medium':
                return 'text-orange-600 dark:text-orange-400';
            case 'low':
                return 'text-green-600 dark:text-green-400';
            default:
                return '';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'pending':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
            default:
                return '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header Section */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Overview of your tasks, revenue, and performance metrics
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Total Revenue Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Revenue
                            </CardTitle>
                            <CircleDollarSign className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalRevenue.toLocaleString('pt-PT', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                })}{' '}
                                €
                            </div>
                            <p className="text-muted-foreground text-xs">
                                From all completed tasks
                            </p>
                        </CardContent>
                    </Card>

                    {/* Current Open Tasks Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Current Open Tasks
                            </CardTitle>
                            <ListTodo className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.openTasks}
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Tasks pending or in progress
                            </p>
                        </CardContent>
                    </Card>

                    {/* All Tasks Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                All Tasks
                            </CardTitle>
                            <ClipboardList className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.allTasks}
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Total tasks in the system
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart and Upcoming Tasks Row */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Monthly Revenue Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Monthly Revenue</CardTitle>
                            <CardDescription>
                                Revenue trends over the last 6 months
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={chartConfig}
                                className="h-[300px] w-full"
                            >
                                <AreaChart
                                    data={monthlyRevenue}
                                    margin={{ left: 12, right: 12 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="fillRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-revenue)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="var(--color-revenue)"
                                        fillOpacity={1}
                                        fill="url(#fillRevenue)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Upcoming Tasks Card */}
                    <Card className="flex h-full flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Open Tasks
                            </CardTitle>
                            <CardDescription className="text-xs">
                                All overdue & upcoming tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex min-h-0 flex-1 flex-col">
                            {(() => {
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);

                                const allNonCompletedTasks = tasks.filter(
                                    (task) => task.status !== 'completed',
                                );

                                const overdueTasks = allNonCompletedTasks.filter(
                                    (task) => {
                                        const dueDate = new Date(
                                            task.due_date,
                                        );
                                        dueDate.setHours(0, 0, 0, 0);
                                        return dueDate < now;
                                    },
                                );

                                const upcomingTasks = allNonCompletedTasks.filter(
                                    (task) => {
                                        const dueDate = new Date(
                                            task.due_date,
                                        );
                                        dueDate.setHours(0, 0, 0, 0);
                                        return dueDate >= now;
                                    },
                                );

                                const groupTasksByDay = (taskList: typeof tasks) => {
                                    const tasksByDay: Record<string, typeof tasks> = {};
                                    taskList.forEach((task) => {
                                        const dateKey = new Date(
                                            task.due_date,
                                        ).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        });
                                        if (!tasksByDay[dateKey]) {
                                            tasksByDay[dateKey] = [];
                                        }
                                        tasksByDay[dateKey].push(task);
                                    });
                                    return tasksByDay;
                                };

                                const renderTaskSection = (tasksByDay: Record<string, typeof tasks>, title: string, count: number, isOverdue: boolean = false) => {
                                    const sortedDays = Object.keys(tasksByDay).sort((a, b) => {
                                        const dateA = new Date(tasksByDay[a][0].due_date);
                                        const dateB = new Date(tasksByDay[b][0].due_date);
                                        return dateA.getTime() - dateB.getTime();
                                    });

                                    return (
                                        <div>
                                            <div className="mb-3 flex items-center gap-2">
                                                <span className="text-xs font-semibold uppercase text-muted-foreground">{title}</span>
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{count}</span>
                                            </div>
                                            <div className="space-y-4">
                                                {sortedDays.map((day) => (
                                                    <div key={day}>
                                                        <div className="mb-2 text-xs font-semibold text-muted-foreground">
                                                            {day}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {tasksByDay[day].map((task) => (
                                                                <div
                                                                    key={task.id}
                                                                    className={`items-center gap-2 rounded-md border p-3 text-sm space-y-2 ${isOverdue
                                                                        ? 'border-destructive/50 bg-destructive/20'
                                                                        : 'bg-card'
                                                                        }`}
                                                                >
                                                                    <div className="min-w-0 flex-1 space-y-1">
                                                                        <div className="font-medium leading-none">
                                                                            {task.title.length > 40
                                                                                ? task.title.substring(0, 40) + '...'
                                                                                : task.title}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            <span className="truncate">
                                                                                {task.client_company || task.client_name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        <span
                                                                            className={`capitalize ${getPriorityColor(task.priority)}`}
                                                                        >
                                                                            {task.priority}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        <span
                                                                            className={`inline-flex shrink-0 items-center rounded-full px-2 py-1.5 text-xs font-medium ${getStatusBadge(task.status)}`}
                                                                        >
                                                                            {task.status.replace('_', ' ')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                };

                                if (overdueTasks.length === 0 && upcomingTasks.length === 0) {
                                    return (
                                        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                            No tasks
                                        </div>
                                    );
                                }

                                const overdueByDay = groupTasksByDay(overdueTasks);
                                const upcomingByDay = groupTasksByDay(upcomingTasks);

                                return (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="min-h-0 max-h-[280px] overflow-y-auto scrollbar-hidden">
                                            {upcomingTasks.length > 0 ? (
                                                renderTaskSection(upcomingByDay, 'Upcoming', upcomingTasks.length)
                                            ) : (
                                                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                                    No upcoming tasks
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-h-0 max-h-[280px] overflow-y-auto scrollbar-hidden">
                                            {overdueTasks.length > 0 ? (
                                                renderTaskSection(overdueByDay, 'Overdue', overdueTasks.length, true)
                                            ) : (
                                                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                                    No overdue tasks
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                </div>

                {/* Tasks Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Tasks</CardTitle>
                        <CardDescription>
                            A comprehensive list of all tasks in the system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-muted-foreground">
                                    Loading tasks...
                                </div>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-muted-foreground">
                                    No tasks found
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Task</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-medium">
                                                <div className="max-w-[200px] truncate">
                                                    {task.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[150px] truncate">
                                                    {task.client_company ||
                                                        task.client_name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {task.user_name}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`capitalize ${getPriorityColor(task.priority)}`}
                                                >
                                                    {task.priority}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(task.status)}`}
                                                >
                                                    {task.status.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    task.due_date,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {task.amount
                                                    ? `${task.amount.toLocaleString('pt-PT', {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    })} €`
                                                    : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
