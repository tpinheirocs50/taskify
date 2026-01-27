import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { tasks } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tasks',
        href: tasks().url,
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
    invoice_id: number | null;
    user_name: string;
    client_name: string;
    client_company: string;
    invoice_status: string | null;
    created_at: string;
    updated_at: string;
}

interface Comment {
    id: string;
    author: string;
    text: string;
    date: string;
    isClient: boolean;
}

interface PaginationData {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export default function Tasks() {
    const [tasks_list, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    });
    const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
    const [expandedTask, setExpandedTask] = useState<string | null>(null);

    // Mock comments (in a real app, these would come from the backend)
    const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async (page = 1) => {
        try {
            const response = await fetch(`/api/tasks?page=${page}`);
            const data = await response.json();

            if (data.success) {
                setTasks(data.data);
                setPagination(data.pagination);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
            case 'pending':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
            case 'low':
                return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getProgressPercentage = (status: string): number => {
        switch (status) {
            case 'completed':
                return 100;
            case 'in_progress':
                return 65;
            case 'pending':
                return 25;
            default:
                return 0;
        }
    };

    const handleAddComment = (taskId: number) => {
        const commentText = newComment[taskId];
        if (!commentText?.trim()) return;

        const newCommentObj: Comment = {
            id: Date.now().toString(),
            author: 'Current User',
            text: commentText,
            date: new Date().toISOString().split('T')[0],
            isClient: true,
        };

        setComments({
            ...comments,
            [taskId]: [...(comments[taskId] || []), newCommentObj],
        });

        setNewComment({ ...newComment, [taskId]: '' });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-PT');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header Section */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                        Tasks
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track project progress and collaborate with your team
                    </p>
                </div>

                {/* Tasks List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-500 dark:text-gray-400">
                            Loading tasks...
                        </div>
                    </div>
                ) : tasks_list.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 rounded-2xl bg-gray-50 dark:bg-gray-800"
                    >
                        <CheckCircle2 className="mb-4 h-12 w-12 text-gray-400" />
                        <div className="text-center">
                            <p className="font-medium text-gray-900 dark:text-white">
                                No tasks found
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Start by creating your first task
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {tasks_list.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                            >
                                {/* Task Header */}
                                <div className="p-6">
                                    <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                        <div className="flex-1">
                                            <div className="mb-2 flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    {task.title}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs capitalize ${getStatusColor(task.status)}`}
                                                >
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs capitalize ${getPriorityColor(task.priority)}`}
                                                >
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <p className="mb-3 text-gray-600 dark:text-gray-400">
                                                {task.description}
                                            </p>
                                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                <p>
                                                    <span className="font-medium">Client:</span>{' '}
                                                    {task.client_name} ({task.client_company})
                                                </p>
                                                <p>
                                                    <span className="font-medium">Assigned to:</span>{' '}
                                                    {task.user_name}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Due:</span>{' '}
                                                    {formatDate(task.due_date)}
                                                </p>
                                                {task.amount && (
                                                    <p>
                                                        <span className="font-medium">Amount:</span> €
                                                        {Number(task.amount).toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Progress
                                            </span>
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {getProgressPercentage(task.status)}%
                                            </span>
                                        </div>
                                        <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 h-2">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${getProgressPercentage(task.status)}%`,
                                                }}
                                                transition={{ duration: 0.6, delay: 0.2 }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Comments Toggle */}
                                    <button
                                        onClick={() =>
                                            setExpandedTask(
                                                expandedTask === task.id.toString()
                                                    ? null
                                                    : task.id.toString(),
                                            )
                                        }
                                        className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        <MessageSquare size={16} />
                                        <span>
                                            {comments[task.id]?.length || 0} Comments
                                        </span>
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {expandedTask === task.id.toString() && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800"
                                    >
                                        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                            Comments & Feedback
                                        </h4>

                                        {/* Comments List */}
                                        <div className="mb-4 space-y-4">
                                            {!comments[task.id] || comments[task.id].length === 0 ? (
                                                <p className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    No comments yet. Be the first to add feedback!
                                                </p>
                                            ) : (
                                                comments[task.id].map((comment) => (
                                                    <div
                                                        key={comment.id}
                                                        className={`rounded-lg p-4 ${
                                                            comment.isClient
                                                                ? 'border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30'
                                                                : 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                                                        }`}
                                                    >
                                                        <div className="mb-2 flex items-center gap-3">
                                                            <div
                                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm text-white ${
                                                                    comment.isClient
                                                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                                                }`}
                                                            >
                                                                {comment.author
                                                                    .split(' ')
                                                                    .map((n) => n[0])
                                                                    .join('')}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-900 dark:text-white">
                                                                    {comment.author}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {comment.date}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-gray-300">
                                                            {comment.text}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Add Comment Form */}
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Add a comment or observation..."
                                                value={newComment[task.id] || ''}
                                                onChange={(e) =>
                                                    setNewComment({
                                                        ...newComment,
                                                        [task.id]: e.target.value,
                                                    })
                                                }
                                                onKeyPress={(e) =>
                                                    e.key === 'Enter' &&
                                                    handleAddComment(task.id)
                                                }
                                                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => handleAddComment(task.id)}
                                                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white transition-all hover:shadow-lg"
                                            >
                                                <Send size={20} />
                                                Send
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Help Box */}
                {!loading && tasks_list.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30"
                    >
                        <div className="flex items-start gap-4">
                            <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    How to Use Task Comments
                                </h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Use the comment section to provide feedback, ask questions, or
                                    share observations about each task. Your team members will be
                                    notified of your comments and can respond directly.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Pagination Info */}
                {!loading && tasks_list.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            Showing{' '}
                            {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                            {Math.min(
                                pagination.current_page * pagination.per_page,
                                pagination.total,
                            )}{' '}
                            of {pagination.total} tasks
                        </span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
