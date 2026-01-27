import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

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
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        openTasks: 0,
        allTasks: 0,
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Detect dark mode
        const isDarkMode =
            document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);

        // Listen for theme changes
        const observer = new MutationObserver(() => {
            setIsDark(
                document.documentElement.classList.contains('dark'),
            );
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // Fetch tasks data
        fetch('/api/tasks')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    const tasksData = data.data as Task[];
                    setTasks(tasksData);

                    // Calculate stats
                    const totalRevenue = tasksData.reduce(
                        (sum, task) => sum + (Number(task.amount) || 0),
                        0,
                    );
                    const openTasks = tasksData.filter(
                        (task) => task.status !== 'completed',
                    ).length;

                    setStats({
                        totalRevenue,
                        openTasks,
                        allTasks: tasksData.length,
                    });

                    // Calculate monthly revenue (last 6 months)
                    const revenueByMonth: { [key: string]: number } = {};
                    tasksData.forEach((task) => {
                        const date = new Date(task.due_date);
                        const monthKey = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                        });
                        revenueByMonth[monthKey] =
                            (revenueByMonth[monthKey] || 0) +
                            (Number(task.amount) || 0);
                    });

                    // Get last 6 months
                    const months: MonthlyRevenue[] = [];
                    for (let i = 5; i >= 0; i--) {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const monthKey = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                        });
                        months.push({
                            month: date.toLocaleDateString('en-US', {
                                month: 'short',
                            }),
                            revenue: revenueByMonth[monthKey] || 0,
                        });
                    }
                    setMonthlyRevenue(months);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching tasks:', error);
                setLoading(false);
            });
    }, []);

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

                {/* Monthly Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Revenue</CardTitle>
                        <CardDescription>
                            Revenue trends over the last 6 months
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyRevenue}>
                                    <defs>
                                        <linearGradient
                                            id="colorRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={isDark ? '#404040' : '#e5e7eb'}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        stroke={isDark ? '#737373' : '#9ca3af'}
                                        tick={{
                                            fill: isDark ? '#a3a3a3' : '#6b7280',
                                            fontSize: 12,
                                        }}
                                    />
                                    <YAxis
                                        stroke={isDark ? '#737373' : '#9ca3af'}
                                        tick={{
                                            fill: isDark ? '#a3a3a3' : '#6b7280',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: isDark
                                                ? '#27272a'
                                                : '#ffffff',
                                            border: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`,
                                            borderRadius: '0.5rem',
                                            color: isDark ? '#fafafa' : '#000000',
                                        }}
                                        labelStyle={{
                                            color: isDark ? '#fafafa' : '#000000',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

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
