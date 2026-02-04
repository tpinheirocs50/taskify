import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { tasks } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useAppearance } from '@/hooks/use-appearance';

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


interface PaginationData {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

export default function Tasks() {
    const [tasks_list, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { auth } = usePage().props as any;

    const [newTaskForm, setNewTaskForm] = useState({
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        due_date: '',
        client_id: '',
        user_id: auth?.user?.id || '',
        amount: '',
    });

    const [clientsList, setClientsList] = useState<{ id: number; name: string; company?: string }[]>([]);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editTaskForm, setEditTaskForm] = useState<any>(null);
    const isDraggingRef = useRef(false);
    const editDescriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const createDescriptionRef = useRef<HTMLTextAreaElement | null>(null);

    // Delete confirmation state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    });

    // Read appearance color theme (controls --primary CSS variable)
    const { colorTheme } = useAppearance();



    useEffect(() => {
        fetchTasks();
        fetchClients();
    }, []);

    // Auto-resize edit textarea to fit content but cap at 60vh and ensure a comfortable minimum height
    useEffect(() => {
        const el = editDescriptionRef.current;
        if (!el) return;

        // reset height to get accurate scrollHeight
        el.style.height = 'auto';
        const minHeight = 120; // px, ensures readability
        const maxHeight = window.innerHeight * 0.6; // 60% of viewport
        const target = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
        el.style.height = `${target}px`;
    }, [editTaskForm?.description, isEditDialogOpen]);

    // Auto-resize create textarea to fit content but cap at 60vh and ensure a comfortable minimum height
    useEffect(() => {
        const el = createDescriptionRef.current;
        if (!el) return;

        el.style.height = 'auto';
        const minHeight = 120; // px
        const maxHeight = window.innerHeight * 0.6;
        const target = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
        el.style.height = `${target}px`;
    }, [newTaskForm.description, isCreateDialogOpen]);

    // Confirm deletion of a task (optimistic with undo)
    const [pendingDeleteTask, setPendingDeleteTask] = useState<Task | null>(null);
    const [pendingDeleteTimer, setPendingDeleteTimer] = useState<number | null>(null);
    const [showUndo, setShowUndo] = useState(false);

    const performDeleteNow = async (task: Task) => {
        try {
            const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (res.ok && data.success) {
                setDeleteMessage('Task deleted successfully');
            } else {
                console.error('Delete failed:', data);
                // Reinsert task on failure
                setTasks((prev) => [task, ...prev]);
                setDeleteMessage(data?.message || 'Failed to delete task');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setTasks((prev) => [task, ...prev]);
            setDeleteMessage('Failed to delete task');
        } finally {
            setPendingDeleteTask(null);
            setPendingDeleteTimer(null);
            setShowUndo(false);
            setIsDeleting(false);
        }
    };

    const handleConfirmDelete = () => {
        if (!editTaskForm) return;
        const task = editTaskForm as Task;

        // If there's already a pending delete, flush it immediately
        if (pendingDeleteTask) {
            if (pendingDeleteTimer) {
                clearTimeout(pendingDeleteTimer);
            }
            performDeleteNow(pendingDeleteTask);
        }

        // Optimistically remove from UI
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setPendingDeleteTask(task);
        setIsDeleteOpen(false);
        setIsEditDialogOpen(false);
        setEditTaskForm(null);
        setShowUndo(true);
        setIsDeleting(false);

        // Start undo timer (5s)
        const timer = window.setTimeout(() => {
            performDeleteNow(task);
        }, 5000);
        setPendingDeleteTimer(timer);
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let page = 1;
            let allTasks: Task[] = [];
            let lastPage = 1;

            // Fetch pages until we've retrieved all pages from the backend
            while (true) {
                const response = await fetch(`/api/tasks?page=${page}`);
                const data = await response.json();

                if (!data.success) break;

                // Filter tasks for current user only and append
                const userTasks = data.data.filter((task: Task) => task.user_id === auth?.user?.id);
                allTasks = [...allTasks, ...userTasks];

                lastPage = data.pagination?.last_page || 1;
                if (page >= lastPage) {
                    // Adjust pagination to reflect what we actually display (all loaded tasks)
                    setPagination({
                        total: allTasks.length,
                        per_page: allTasks.length || data.pagination?.per_page || 15,
                        current_page: 1,
                        last_page: 1,
                    });
                    break;
                }

                page++;
            }

            setTasks(allTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Keep pagination in sync with the actual tasks list so the footer updates automatically
    useEffect(() => {
        setPagination({
            total: tasks_list.length,
            per_page: tasks_list.length || 15,
            current_page: 1,
            last_page: 1,
        });
    }, [tasks_list]);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients?page=1');
            const data = await res.json();
            if (data.success) setClientsList(data.data);
        } catch (err) {
            console.error('Failed to load clients', err);
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



    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic client-side validation: ensure client and description
        if (!newTaskForm.description.trim()) return;
        if (!newTaskForm.client_id) return;

        const payload = {
            ...newTaskForm,
            status: 'pending',
            starting_date: new Date().toISOString().split('T')[0],
            user_id: auth?.user?.id,
        } as any;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Insert created task into kanban in the pending column
                setTasks((prev) => [data.data, ...prev]);

                setNewTaskForm({
                    title: '',
                    description: '',
                    priority: 'medium',
                    due_date: '',
                    client_id: '',
                    user_id: auth?.user?.id || '',
                    amount: '',
                });
                setIsCreateDialogOpen(false);
            } else {
                console.error('Create failed:', data);
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const handleOpenEdit = (task: Task) => {
        // populate edit form
        setEditTaskForm({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            client_id: String(task.client_id),
            user_id: String(task.user_id),
            amount: task.amount ? String(task.amount) : '',
            status: task.status,
        });
        // ensure clients list is loaded
        fetchClients();
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTaskForm) return;

        // basic validation
        if (!editTaskForm.description?.trim()) return;

        const payload: any = {
            title: editTaskForm.title,
            description: editTaskForm.description,
            priority: editTaskForm.priority,
            due_date: editTaskForm.due_date,
            client_id: editTaskForm.client_id,
            amount: editTaskForm.amount || null,
            status: editTaskForm.status,
        };

        try {
            const res = await fetch(`/api/tasks/${editTaskForm.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // update local list
                setTasks((prev) => prev.map((t) => (t.id === data.data.id ? data.data : t)));
                setIsEditDialogOpen(false);
                setEditTaskForm(null);
            } else {
                console.error('Edit failed:', data);
            }
        } catch (err) {
            console.error('Failed to update task', err);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-PT');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                            Tasks
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Track project progress and collaborate with your team
                        </p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                        setIsCreateDialogOpen(open);
                        if (open) {
                            fetchClients();
                            setNewTaskForm({
                                title: '',
                                description: '',
                                priority: 'medium',
                                due_date: '',
                                client_id: '',
                                user_id: auth?.user?.id || '',
                                amount: '',
                            });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                Create Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                                <DialogDescription>
                                    Fill in the details to create a new task
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Title *</label>
                                    <Input
                                        required
                                        placeholder="Task title"
                                        value={newTaskForm.title}
                                        onChange={(e) =>
                                            setNewTaskForm({
                                                ...newTaskForm,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description *</label>
                                    <Textarea
                                        required
                                        rows={4}
                                        ref={createDescriptionRef}
                                        className="min-h-[120px] max-h-[60vh] overflow-auto resize-y text-sm leading-relaxed p-2"
                                        placeholder="Describe the task in detail (what, why, acceptance criteria)..."
                                        value={newTaskForm.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                            setNewTaskForm({
                                                ...newTaskForm,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Client *</label>
                                    <Select
                                        value={String(newTaskForm.client_id)}
                                        onValueChange={(value) =>
                                            setNewTaskForm({ ...newTaskForm, client_id: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientsList.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name} {c.company ? `(${c.company})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select
                                        value={newTaskForm.priority}
                                        onValueChange={(value) =>
                                            setNewTaskForm({
                                                ...newTaskForm,
                                                priority: value as 'low' | 'medium' | 'high',
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Due Date</label>
                                    <Input
                                        type="date"
                                        value={newTaskForm.due_date}
                                        onChange={(e) =>
                                            setNewTaskForm({
                                                ...newTaskForm,
                                                due_date: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Amount</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={newTaskForm.amount}
                                        onChange={(e) =>
                                            setNewTaskForm({
                                                ...newTaskForm,
                                                amount: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">Create</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Task</DialogTitle>
                                <DialogDescription>Update task details and move between states</DialogDescription>
                            </DialogHeader>

                            {editTaskForm && (
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">Title *</label>
                                        <Input
                                            required
                                            value={editTaskForm.title}
                                            onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Description *</label>
                                        <Textarea
                                            required
                                            rows={4}
                                            ref={editDescriptionRef}
                                            className="min-h-[120px] max-h-[60vh] overflow-auto resize-y text-sm leading-relaxed p-2"
                                            placeholder="Describe the task in detail (what, why, acceptance criteria)..."
                                            value={editTaskForm.description}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Priority</label>
                                        <Select
                                            value={editTaskForm.priority}
                                            onValueChange={(value) => setEditTaskForm({ ...editTaskForm, priority: value as 'low' | 'medium' | 'high' })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Client *</label>
                                        <Select
                                            value={String(editTaskForm.client_id)}
                                            onValueChange={(value) => setEditTaskForm({ ...editTaskForm, client_id: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clientsList.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name} {c.company ? `(${c.company})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>



                                    <div>
                                        <label className="text-sm font-medium">Due Date</label>
                                        <Input
                                            type="date"
                                            value={editTaskForm.due_date}
                                            onChange={(e) => setEditTaskForm({ ...editTaskForm, due_date: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Amount</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editTaskForm.amount}
                                            onChange={(e) => setEditTaskForm({ ...editTaskForm, amount: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Status</label>
                                        <Select
                                            value={editTaskForm.status}
                                            onValueChange={(value) => setEditTaskForm({ ...editTaskForm, status: value as Task['status'] })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <Button type="button" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                                                Delete
                                            </Button>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditTaskForm(null); }}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">Save</Button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                    {/* Delete Confirmation */}
                    <AlertDialog open={isDeleteOpen} onOpenChange={(open: boolean) => !open && setIsDeleteOpen(false)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this task? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Undo snackbar */}
                    {showUndo && pendingDeleteTask && (
                        <div className="fixed left-6 bottom-6 z-50">
                            <div className="flex items-center gap-4 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-md dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-sm text-gray-800 dark:text-gray-100">Task deleted</div>
                                <div className="flex items-center gap-2">
                                    <Button variant="link" onClick={() => {
                                        // undo delete
                                        if (pendingDeleteTimer) {
                                            clearTimeout(pendingDeleteTimer);
                                        }
                                        setTasks((prev) => [pendingDeleteTask, ...prev]);
                                        setPendingDeleteTask(null);
                                        setShowUndo(false);
                                        setDeleteMessage('Deletion undone');
                                    }}>
                                        Undo
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        // dismiss snackbar (will still execute delete after timeout)
                                        setShowUndo(false);
                                    }}>
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Post-action Message Dialog */}
                    <AlertDialog open={deleteMessage !== null} onOpenChange={(open: boolean) => !open && setDeleteMessage(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Message</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {deleteMessage}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction onClick={() => setDeleteMessage(null)}>
                                    OK
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>                </div>

                {/* Tasks List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-500 dark:text-gray-400">Loading tasks...</div>
                    </div>
                ) : tasks_list.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 rounded-2xl bg-gray-50 dark:bg-gray-800"
                    >
                        <CheckCircle2 className="mb-4 h-12 w-12 text-gray-400" />
                        <div className="text-center">
                            <p className="font-medium text-gray-900 dark:text-white">No tasks found</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Start by creating your first task
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="rounded-2xl p-4">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                            {/* Kanban columns */}
                            {[
                                { id: 'pending', title: 'Pending' },
                                { id: 'in_progress', title: 'In Progress' },
                                { id: 'completed', title: 'Completed' },
                            ].map((col) => (
                                <div
                                    key={col.id}
                                    className="min-h-[220px] rounded-lg border border-sidebar-border bg-transparent p-3"
                                >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold capitalize text-sidebar-foreground">
                                        {col.title}
                                    </h3>
                                    <span className="text-sm text-sidebar-foreground/70">
                                        {tasks_list.filter((t) => t.status === col.id).length}
                                    </span>
                                </div>

                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                                        const idStr = e.dataTransfer.getData('text/plain');
                                        if (!idStr) return;
                                        const id = Number(idStr);
                                        const task = tasks_list.find((t) => t.id === id);
                                        if (!task || task.status === col.id) return;

                                        // Optimistic update
                                        setTasks((prev) =>
                                            prev.map((t) => (t.id === id ? { ...t, status: col.id as Task['status'] } : t)),
                                        );

                                        // Persist change
                                        fetch(`/api/tasks/${id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: col.id }),
                                        }).then((res) => {
                                            if (!res.ok) fetchTasks();
                                        }).catch(() => fetchTasks());
                                    }}
                                    className="flex min-h-[120px] flex-col gap-2"
                                >
                                    {tasks_list
                                        .filter((t) => t.status === col.id)
                                        .map((task, index) => (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.03 }}
                                                className="cursor-grab active:cursor-grabbing select-none"
                                            >
                                                <div
                                                    draggable
                                                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                                                        isDraggingRef.current = true;
                                                        e.dataTransfer.setData('text/plain', String(task.id));
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    }}
                                                    onDragEnd={() => {
                                                        // small delay to avoid click firing immediately after drag
                                                        setTimeout(() => {
                                                            isDraggingRef.current = false;
                                                        }, 50);
                                                    }}
                                                    onClick={() => {
                                                        if (!isDraggingRef.current) handleOpenEdit(task);
                                                    }}
                                                >                                                    <Card className="overflow-hidden p-3 transform transition-all hover:-translate-y-1 hover:shadow-md bg-white dark:bg-gray-900" style={{ borderLeft: '4px solid var(--primary)' }}>
                                                        <CardContent>
                                                            <div className="mb-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate whitespace-nowrap" title={task.title}>
                                                                            {task.title}
                                                                        </h4> 
                                                                    </div>
                                                                    <span className={`rounded-full px-3 py-1 text-xs capitalize ${getPriorityColor(task.priority)}`}>
                                                                        {task.priority}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                                                    <div className="truncate">{task.client_name}</div>
                                                                    <div className="ml-2 whitespace-nowrap">Due {formatDate(task.due_date)}</div>
                                                                </div>
                                                            </div>


                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}

                {/* Help Box */}


                {/* Total tasks */}
                {!loading && tasks_list.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>
                            {pagination.total} tasks
                        </span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
