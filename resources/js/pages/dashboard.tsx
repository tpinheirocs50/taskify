import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    invoice_id?: number | null;
    user_name: string;
    client_name: string;
    client_company: string | null;
    is_hidden?: boolean;
    created_at: string;
}

interface DashboardStats {
    totalRevenue: number;
    totalExpectedRevenue: number;
    openTasks: number;
    allTasks: number;
}

interface MonthlyRevenue {
    month: string;
    totalRevenue: number;
    expectedRevenue: number;
}

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        totalExpectedRevenue: 0,
        openTasks: 0,
        allTasks: 0,
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('due_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const chartConfig = {
        totalRevenue: {
            label: 'Total Revenue',
            color: 'var(--primary)',
        },
        expectedRevenue: {
            label: 'Total Expected Revenue',
            color: 'var(--muted-foreground)',
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
                const openTasks = userTasks.filter(
                    (task) => task.status !== 'completed',
                ).length;

                // Fetch invoices to calculate monthly revenue from paid invoices
                let allInvoices: any[] = [];
                let invoicePage = 1;
                let invoiceLastPage = 1;

                do {
                    const response = await fetch(`/api/invoices?page=${invoicePage}`);
                    const data = await response.json();

                    if (data.success) {
                        allInvoices = [...allInvoices, ...data.data];
                        invoiceLastPage = data.pagination.last_page;
                        invoicePage++;
                    } else {
                        break;
                    }
                } while (invoicePage <= invoiceLastPage);

                const userInvoiceIds = new Set(
                    userTasks
                        .filter((task) => task.invoice_id !== null)
                        .map((task) => task.invoice_id),
                );

                const paidInvoices = allInvoices
                    .filter((invoice) => userInvoiceIds.has(invoice.id))
                    .filter((invoice) => invoice.status === 'paid');

                const expectedInvoices = allInvoices
                    .filter((invoice) => userInvoiceIds.has(invoice.id))
                    .filter((invoice) => invoice.status !== 'cancelled');

                const invoiceTotalsById = new Map<number, number>();
                userTasks.forEach((task) => {
                    if (!task.invoice_id) return;
                    const current = invoiceTotalsById.get(task.invoice_id) || 0;
                    invoiceTotalsById.set(
                        task.invoice_id,
                        current + (Number(task.amount) || 0),
                    );
                });

                const totalRevenue = paidInvoices.reduce((sum, invoice) => {
                    return sum + (invoiceTotalsById.get(invoice.id) || 0);
                }, 0);

                const totalExpectedRevenue = allInvoices
                    .filter((invoice) => userInvoiceIds.has(invoice.id))
                    .filter((invoice) => invoice.status !== 'cancelled')
                    .reduce((sum, invoice) => {
                        return sum + (invoiceTotalsById.get(invoice.id) || 0);
                    }, 0);

                setStats({
                    totalRevenue,
                    totalExpectedRevenue,
                    openTasks,
                    allTasks: userTasks.length,
                });

                // Calculate monthly revenue (last 6 months)
                const today = new Date();
                const paidByMonth: { [key: string]: number } = {};
                const expectedByMonth: { [key: string]: number } = {};

                // Initialize last 6 months in correct order
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    paidByMonth[monthKey] = 0;
                    expectedByMonth[monthKey] = 0;
                }

                paidInvoices.forEach((invoice) => {
                    const dateValue = invoice.due_date || invoice.date;
                    if (!dateValue) return;
                    const date = new Date(dateValue);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (paidByMonth.hasOwnProperty(monthKey)) {
                        paidByMonth[monthKey] +=
                            invoiceTotalsById.get(invoice.id) || 0;
                    }
                });

                expectedInvoices.forEach((invoice) => {
                    const dateValue = invoice.due_date || invoice.date;
                    if (!dateValue) return;
                    const date = new Date(dateValue);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (expectedByMonth.hasOwnProperty(monthKey)) {
                        expectedByMonth[monthKey] +=
                            invoiceTotalsById.get(invoice.id) || 0;
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
                        totalRevenue: paidByMonth[monthKey] || 0,
                        expectedRevenue: expectedByMonth[monthKey] || 0,
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
                <div className="grid gap-4 md:grid-cols-4">
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
                                From paid invoices
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Expected Revenue Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Expected Revenue
                            </CardTitle>
                            <CircleDollarSign className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalExpectedRevenue.toLocaleString('pt-PT', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                })}{' '}
                                €
                            </div>
                            <p className="text-muted-foreground text-xs">
                                All invoices except cancelled
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
                                            id="fillTotalRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-totalRevenue)"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-totalRevenue)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="fillExpectedRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-expectedRevenue)"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-expectedRevenue)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                                        tickFormatter={(value) =>
                                            value.toLocaleString('pt-PT')
                                        }
                                    />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="expectedRevenue"
                                        name="Total Expected Revenue"
                                        stroke="var(--color-expectedRevenue)"
                                        fill="url(#fillExpectedRevenue)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalRevenue"
                                        name="Total Revenue"
                                        stroke="var(--color-totalRevenue)"
                                        fill="url(#fillTotalRevenue)"
                                        strokeWidth={2}
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
                                    (task) => task.status !== 'completed' && !task.is_hidden,
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
                            <div className="space-y-4">
                                {/* Filters and Sorting */}
                                <div className="grid gap-3 md:grid-cols-5">
                                    <Select
                                        value={filterStatus}
                                        onValueChange={(value) => {
                                            setFilterStatus(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filterPriority}
                                        onValueChange={(value) => {
                                            setFilterPriority(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All priorities</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={sortBy}
                                        onValueChange={(value) => {
                                            setSortBy(value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="due_date">Due Date</SelectItem>
                                            <SelectItem value="priority">Priority</SelectItem>
                                            <SelectItem value="status">Status</SelectItem>
                                            <SelectItem value="amount">Amount</SelectItem>
                                            <SelectItem value="title">Title</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={sortOrder}
                                        onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Order" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asc">Ascending</SelectItem>
                                            <SelectItem value="desc">Descending</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFilterStatus('all');
                                            setFilterPriority('all');
                                            setSortBy('due_date');
                                            setSortOrder('asc');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Task</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead className="text-right">
                                                Amount
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            // Apply filters
                                            let filteredTasks = tasks.filter((task) => {
                                                const statusMatch =
                                                    filterStatus === 'all' ||
                                                    task.status === filterStatus ||
                                                    (filterStatus === 'archived' && task.is_hidden);
                                                const priorityMatch =
                                                    filterPriority === 'all' ||
                                                    task.priority === filterPriority;
                                                // Hide is_hidden tasks unless specifically filtering for archived
                                                const hiddenMatch = filterStatus === 'archived' ? task.is_hidden : !task.is_hidden;
                                                return statusMatch && priorityMatch && hiddenMatch;
                                            });

                                            // Apply sorting
                                            const priorityOrder = {
                                                high: 3,
                                                medium: 2,
                                                low: 1,
                                            };
                                            const statusOrder = {
                                                pending: 1,
                                                in_progress: 2,
                                                completed: 3,
                                            };

                                            filteredTasks.sort((a, b) => {
                                                let comparison = 0;

                                                switch (sortBy) {
                                                    case 'due_date':
                                                        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                                                        break;
                                                    case 'priority':
                                                        comparison =
                                                            priorityOrder[a.priority as keyof typeof priorityOrder] -
                                                            priorityOrder[b.priority as keyof typeof priorityOrder];
                                                        break;
                                                    case 'status':
                                                        comparison =
                                                            statusOrder[a.status as keyof typeof statusOrder] -
                                                            statusOrder[b.status as keyof typeof statusOrder];
                                                        break;
                                                    case 'amount':
                                                        comparison = (a.amount || 0) - (b.amount || 0);
                                                        break;
                                                    case 'title':
                                                        comparison = a.title.localeCompare(b.title);
                                                        break;
                                                    default:
                                                        break;
                                                }

                                                return sortOrder === 'asc' ? comparison : -comparison;
                                            });

                                            // Apply pagination
                                            const startIndex = (currentPage - 1) * itemsPerPage;
                                            const endIndex = startIndex + itemsPerPage;
                                            const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

                                            if (filteredTasks.length === 0) {
                                                return (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                            No tasks match the selected filters
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }

                                            return paginatedTasks.map((task) => (
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
                                                        ).toLocaleDateString('pt-PT')}
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
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        {(() => {
                                            const filteredTasksCount = tasks.filter((task) => {
                                                const statusMatch =
                                                    filterStatus === 'all' ||
                                                    task.status === filterStatus ||
                                                    (filterStatus === 'archived' && task.is_hidden);
                                                const priorityMatch =
                                                    filterPriority === 'all' ||
                                                    task.priority === filterPriority;
                                                const hiddenMatch = filterStatus === 'archived' ? task.is_hidden : !task.is_hidden;
                                                return statusMatch && priorityMatch && hiddenMatch;
                                            }).length;
                                            const startIndex = (currentPage - 1) * itemsPerPage + 1;
                                            const endIndex = Math.min(currentPage * itemsPerPage, filteredTasksCount);
                                            return `Showing ${filteredTasksCount > 0 ? startIndex : 0} to ${endIndex} of ${filteredTasksCount} tasks`;
                                        })()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const filteredTasksCount = tasks.filter((task) => {
                                                    const statusMatch =
                                                        filterStatus === 'all' ||
                                                        task.status === filterStatus;
                                                    const priorityMatch =
                                                        filterPriority === 'all' ||
                                                        task.priority === filterPriority;
                                                    return statusMatch && priorityMatch;
                                                }).length;
                                                const totalPages = Math.ceil(filteredTasksCount / itemsPerPage);
                                                const pages = [];
                                                const maxPages = 5;
                                                let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
                                                let endPage = Math.min(totalPages, startPage + maxPages - 1);
                                                if (endPage - startPage < maxPages - 1) {
                                                    startPage = Math.max(1, endPage - maxPages + 1);
                                                }
                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(i);
                                                }
                                                return pages.map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium ring-offset-background transition-colors ${currentPage === page
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                        <button
                                            onClick={() => {
                                                const filteredTasksCount = tasks.filter((task) => {
                                                    const statusMatch =
                                                        filterStatus === 'all' ||
                                                        task.status === filterStatus;
                                                    const priorityMatch =
                                                        filterPriority === 'all' ||
                                                        task.priority === filterPriority;
                                                    return statusMatch && priorityMatch;
                                                }).length;
                                                setCurrentPage(Math.min(Math.ceil(filteredTasksCount / itemsPerPage), currentPage + 1));
                                            }}
                                            disabled={(() => {
                                                const filteredTasksCount = tasks.filter((task) => {
                                                    const statusMatch =
                                                        filterStatus === 'all' ||
                                                        task.status === filterStatus;
                                                    const priorityMatch =
                                                        filterPriority === 'all' ||
                                                        task.priority === filterPriority;
                                                    return statusMatch && priorityMatch;
                                                }).length;
                                                return currentPage === Math.ceil(filteredTasksCount / itemsPerPage);
                                            })()}
                                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
