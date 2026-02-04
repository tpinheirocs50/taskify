import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { calendar } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Calendar',
        href: calendar().url,
    },
];

interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    starting_date: string;
    due_date: string;
    status: 'pending' | 'in_progress' | 'completed';
    amount: number | null;
    user_id: number;
    client_id: number;
    invoice_id?: number | null;
    user_name: string;
    client_name: string;
    client_company: string | null;
    invoice_status: string | null;
    created_at: string;
    updated_at: string;
}

interface TasksByDate {
    [key: string]: Task[];
}

export default function Calendar() {
    const { auth } = usePage().props as any;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Fetch all tasks
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                let allTasks: Task[] = [];
                let currentPage = 1;
                let lastPage = 1;

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

                // Filter tasks to only include those from the logged-in user
                const userTasks = allTasks.filter((task) => task.user_id === auth.user.id);
                setTasks(userTasks);

                // Group tasks by due date
                const grouped: TasksByDate = {};
                userTasks.forEach((task) => {
                    const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
                    if (!grouped[dateKey]) {
                        grouped[dateKey] = [];
                    }
                    grouped[dateKey].push(task);
                });

                setTasksByDate(grouped);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [auth.user.id]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get first day of week offset
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array(firstDayOfWeek).fill(null);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'medium':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'low':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'line-through text-gray-400 dark:text-gray-500';
            case 'in_progress':
                return 'text-green-600 dark:text-green-400';
            case 'pending':
                return 'text-gray-700 dark:text-gray-200';
            default:
                return 'text-gray-700 dark:text-gray-200';
        }
    };

    const handlePreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const dayTasks = selectedDate ? (tasksByDate[format(selectedDate, 'yyyy-MM-dd')] || []) : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                        <p className="text-sm text-muted-foreground">
                            View your tasks organized by due date
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3 lg:h-[calc(100vh-200px)]">
                    {/* Main Calendar */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePreviousMonth}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleToday}
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNextMonth}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Day headers */}
                                    <div className="grid grid-cols-7 gap-2">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                                            (day) => (
                                                <div
                                                    key={day}
                                                    className="py-2 text-center text-sm font-semibold text-muted-foreground"
                                                >
                                                    {day}
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    {/* Calendar grid */}
                                    <div className="grid grid-cols-7 gap-2">
                                        {paddingDays.map((_, index) => (
                                            <div
                                                key={`padding-${index}`}
                                                className="aspect-square rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20"
                                            />
                                        ))}

                                        {daysInMonth.map((day) => {
                                            const dateKey = format(day, 'yyyy-MM-dd');
                                            const dayTasks = tasksByDate[dateKey] || [];
                                            const isSelected =
                                                selectedDate && isSameDay(day, selectedDate);
                                            const isTodayDate = isToday(day);

                                            return (
                                                <button
                                                    key={dateKey}
                                                    onClick={() => setSelectedDate(day)}
                                                    className={`aspect-square rounded-lg border-2 p-2 text-left transition-all duration-200 ${isSelected
                                                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                                                        : 'border-border hover:border-blue-300 dark:hover:border-blue-600'
                                                        } ${isTodayDate
                                                            ? 'bg-amber-50 dark:bg-amber-950/20'
                                                            : 'bg-card'
                                                        }`}
                                                >
                                                    <div className="space-y-1">
                                                        <div
                                                            className={`text-sm font-semibold ${isTodayDate
                                                                ? 'text-amber-700 dark:text-amber-300'
                                                                : 'text-foreground'
                                                                }`}
                                                        >
                                                            {format(day, 'd')}
                                                        </div>
                                                        {dayTasks.length > 0 && (
                                                            <div className="flex flex-col gap-0.5">
                                                                {dayTasks.slice(0, 2).map((task) => (
                                                                    <div
                                                                        key={task.id}
                                                                        className="truncate rounded bg-blue-500/20 px-1 text-xs text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"
                                                                    >
                                                                        {task.title}
                                                                    </div>
                                                                ))}
                                                                {dayTasks.length > 2 && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        +{dayTasks.length - 2} more
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Selected Date Tasks */}
                    <div className="flex flex-col gap-6 overflow-hidden">
                        {selectedDate && (
                            <Card className="flex flex-col min-h-0">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {format(selectedDate, 'EEEE, MMMM d')}
                                    </CardTitle>
                                    <CardDescription>
                                        {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto">
                                    {dayTasks.length > 0 ? (
                                        <div className="space-y-3">
                                            {dayTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 transition-all hover:bg-muted/50"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4
                                                            className={`flex-1 text-sm font-medium leading-tight ${getStatusColor(task.status)}`}
                                                        >
                                                            {task.title}
                                                        </h4>
                                                        <span
                                                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(task.priority)}`}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {task.description}
                                                    </p>

                                                    <div className="space-y-1 border-t border-border/50 pt-2">
                                                        <div className="text-xs">
                                                            <span className="font-medium text-foreground">
                                                                Client:
                                                            </span>{' '}
                                                            <span className="text-muted-foreground">
                                                                {task.client_name}
                                                            </span>
                                                        </div>
                                                        {task.amount && (
                                                            <div className="text-xs">
                                                                <span className="font-medium text-foreground">
                                                                    Amount:
                                                                </span>{' '}
                                                                <span className="text-muted-foreground">
                                                                    €{typeof task.amount === 'string' ? parseFloat(task.amount).toFixed(2) : (task.amount as number).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="text-xs">
                                                            <span className="font-medium text-foreground">
                                                                Status:
                                                            </span>{' '}
                                                            <span
                                                                className={`ml-1 capitalize ${task.status === 'completed'
                                                                    ? 'text-green-600 dark:text-green-400'
                                                                    : task.status === 'in_progress'
                                                                        ? 'text-blue-600 dark:text-blue-400'
                                                                        : 'text-amber-600 dark:text-amber-400'
                                                                    }`}
                                                            >
                                                                {task.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                                            No tasks scheduled for this day
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Upcoming Tasks */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                                <CardDescription>Next 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                                        Loading...
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {tasks
                                            .filter((task) => {
                                                const dueDate = new Date(task.due_date);
                                                const today = new Date();
                                                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                                                return dueDate >= today && dueDate <= nextWeek;
                                            })
                                            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                                            .slice(0, 5)
                                            .map((task) => (
                                                <button
                                                    key={task.id}
                                                    onClick={() => setSelectedDate(new Date(task.due_date))}
                                                    className="w-full text-left rounded-lg border border-border/50 bg-muted/20 p-2 text-xs transition-all hover:bg-muted/40 hover:border-border"
                                                >
                                                    <div className="font-medium text-foreground">
                                                        {task.title}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {format(new Date(task.due_date), 'MMM d')}
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
