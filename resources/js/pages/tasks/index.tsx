import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Plus, Search, Filter, Calendar, Flag, Archive, RotateCcw } from 'lucide-react';
import { Popover } from '@headlessui/react';
import { DayPicker } from 'react-day-picker';
import { enUS } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
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

type DatePickerProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

const DatePicker = ({ value, onChange, placeholder = 'Select date' }: DatePickerProps) => {
    const selected = value ? parseISO(value) : undefined;

    return (
        <Popover className="relative">
            {({ close }) => (
                <>
                    <Popover.Button className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                        <span className={value ? '' : 'text-muted-foreground'}>
                            {value ? format(parseISO(value), 'yyyy-MM-dd') : placeholder}
                        </span>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </Popover.Button>
                    <Popover.Panel className="absolute z-50 mt-2 rounded-lg border border-border bg-popover p-3 shadow-lg">
                        <DayPicker
                            mode="single"
                            selected={selected}
                            onSelect={(day) => {
                                if (day) {
                                    onChange(format(day, 'yyyy-MM-dd'));
                                    close();
                                }
                            }}
                            locale={enUS}
                            showOutsideDays
                            classNames={{
                                months: 'flex flex-col',
                                month: 'space-y-4',
                                caption: 'flex items-center justify-between px-1',
                                caption_label: 'text-sm font-medium',
                                nav: 'flex items-center gap-1',
                                nav_button: 'h-7 w-7 rounded-md border border-input bg-background text-foreground hover:bg-accent',
                                table: 'w-full border-collapse space-y-1',
                                head_row: 'flex',
                                head_cell: 'w-9 text-[0.8rem] font-normal text-muted-foreground',
                                row: 'flex w-full mt-1',
                                cell: 'h-9 w-9 text-center text-sm p-0',
                                day: 'h-9 w-9 rounded-md hover:bg-accent',
                                day_selected: 'bg-primary text-primary-foreground hover:bg-primary',
                                day_today: 'border border-primary',
                                day_outside: 'text-muted-foreground opacity-50',
                            }}
                        />
                        <div className="mt-3 flex items-center justify-between gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onChange(format(new Date(), 'yyyy-MM-dd'));
                                    close();
                                }}
                            >
                                Today
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onChange('');
                                    close();
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </Popover.Panel>
                </>
            )}
        </Popover>
    );
};

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
    is_hidden?: boolean;
    archived_at?: string | null;
    archived_by?: number | null;
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
    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [dueDateFilter, setDueDateFilter] = useState<'all' | 'overdue' | 'today' | 'week' | 'month'>('all');
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
    const [originalEditTaskForm, setOriginalEditTaskForm] = useState<any>(null);
    const [isPendingArchive, setIsPendingArchive] = useState(false);
    const dragEndTimeRef = useRef<number>(0);
    const editDescriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const createDescriptionRef = useRef<HTMLTextAreaElement | null>(null);

    // Delete confirmation state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
    const [unarchiveStatus, setUnarchiveStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
    const [isUnarchiveDialogOpen, setIsUnarchiveDialogOpen] = useState(false);
    const [pendingUnarchiveTask, setPendingUnarchiveTask] = useState<Task | null>(null);

    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    });

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

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

    // Confirm deletion of tasks (support multiple optimistic deletes with undo)
    const [pendingDeletes, setPendingDeletes] = useState<{
        id: number;
        task: Task;
        timerId: number;
        visible: boolean;
    }[]>([]);

    // Duration for undo in milliseconds (use same value for timer and progress animation)
    const UNDO_TIMEOUT = 5000;

    const performDeleteNow = async (task: Task) => {
        // Remove pending entry and cancel its timer if present
        setPendingDeletes((prev) => {
            const entry = prev.find((p) => p.id === task.id);
            if (entry && entry.timerId) {
                clearTimeout(entry.timerId);
            }
            return prev.filter((p) => p.id !== task.id);
        });

        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
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
            setIsDeleting(false);
        }
    }; 

    const handleConfirmDelete = () => {
        if (!editTaskForm) return;
        const task = editTaskForm as Task;

        // Check if task is protected before allowing delete
        if (isTaskProtected(task)) {
            setDeleteMessage('This task has an associated invoice and cannot be deleted. You can only archive it.');
            setIsDeleteOpen(false);
            return;
        }

        // Optimistically remove from UI
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setIsDeleteOpen(false);
        setIsEditDialogOpen(false);
        setEditTaskForm(null);
        setIsDeleting(false);

        // Start undo timer for this specific task
        const timerId = window.setTimeout(() => {
            performDeleteNow(task);
        }, UNDO_TIMEOUT);

        setPendingDeletes((prev) => [{ id: task.id, task, timerId, visible: true }, ...prev]);
    }; 

    const handleArchiveToggle = async (task: Task, archive: boolean) => {
        if (archive) {
            // Archiving: check if form has changes
            if (hasFormChanges()) {
                // Form has changes, mark as pending and require save/cancel
                setIsPendingArchive(true);
            } else {
                // No changes, archive directly
                const payload: any = { is_hidden: true };
                // If task is protected (has invoice with sensitive status), set to completed
                if (isTaskProtected(task)) {
                    payload.status = 'completed';
                }
                try {
                    const res = await fetch(`/api/tasks/${task.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                            Accept: 'application/json',
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        setTasks((prev) => prev.map((t) => t.id === data.data.id ? data.data : t));
                        setIsEditDialogOpen(false);
                        setEditTaskForm(null);
                        setOriginalEditTaskForm(null);
                        setIsPendingArchive(false);
                    } else {
                        setDeleteMessage(data?.message || 'Failed to archive task');
                    }
                } catch (err) {
                    setDeleteMessage('Failed to archive task');
                }
            }
        } else {
            // Unarchiving: if protected, go directly to completed; otherwise show dialog
            if (isTaskProtected(task)) {
                // Protected task: unarchive directly to completed
                performUnarchiveProtected(task);
            } else {
                // Normal task: show dialog to choose status
                setPendingUnarchiveTask(task);
                setUnarchiveStatus('pending');
                setIsUnarchiveDialogOpen(true);
            }
        }
    };

    const performUnarchiveProtected = async (task: Task) => {
        const payload = { is_hidden: false, status: 'completed' };
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTasks((prev) => prev.map((t) => t.id === data.data.id ? data.data : t));
                setIsEditDialogOpen(false);
                setEditTaskForm(null);
                setOriginalEditTaskForm(null);
                setShowArchived(false);
            } else {
                setDeleteMessage(data?.message || 'Failed to unarchive task');
            }
        } catch (err) {
            setDeleteMessage('Failed to unarchive task');
        }
    };

    const performUnarchive = async () => {
        if (!pendingUnarchiveTask) return;
        
        // Check if task is protected and status is not "completed"
        if (isTaskProtected(pendingUnarchiveTask) && unarchiveStatus !== 'completed') {
            setDeleteMessage('This task has an associated invoice. Please choose "Completed" to unarchive.');
            setIsUnarchiveDialogOpen(false);
            return;
        }
        
        const payload = { is_hidden: false, status: unarchiveStatus };
        try {
            const res = await fetch(`/api/tasks/${pendingUnarchiveTask.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setTasks((prev) => prev.map((t) => t.id === data.data.id ? data.data : t));
                setIsUnarchiveDialogOpen(false);
                setPendingUnarchiveTask(null);
                // Close edit modal and clear form
                setIsEditDialogOpen(false);
                setEditTaskForm(null);
                // Switch back to Kanban view to show the card in its new column
                setShowArchived(false);
            } else {
                setDeleteMessage(data?.message || 'Failed to unarchive task');
            }
        } catch (err) {
            setDeleteMessage('Failed to unarchive task');
        }
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
            const res = await fetch('/api/clients?page=1', {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                },
            });
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

        const missingFields: string[] = [];
        if (!newTaskForm.title.trim()) missingFields.push('Title');
        if (!newTaskForm.description.trim()) missingFields.push('Description');
        if (!newTaskForm.client_id) missingFields.push('Client');
        if (!newTaskForm.due_date) missingFields.push('Due date');

        if (missingFields.length > 0) {
            setDeleteMessage(`Please fill in: ${missingFields.join(', ')}.`);
            return;
        }

        const payload = {
            ...newTaskForm,
            status: 'pending',
            starting_date: new Date().toISOString().split('T')[0],
            user_id: auth?.user?.id,
        } as any;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
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
        const formData = {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            client_id: String(task.client_id),
            user_id: String(task.user_id),
            amount: task.amount ? String(task.amount) : '',
            status: task.status,
            is_hidden: !!task.is_hidden,
            invoice_id: task.invoice_id,
            invoice_status: task.invoice_status,
        };
        setEditTaskForm(formData);
        setOriginalEditTaskForm(formData);
        setIsPendingArchive(false);
        // ensure clients list is loaded
        fetchClients();
        setIsEditDialogOpen(true);
    };

    // Check if form has changes compared to original
    const hasFormChanges = (): boolean => {
        if (!editTaskForm || !originalEditTaskForm) return false;
        const fieldsToCheck = ['title', 'description', 'priority', 'due_date', 'client_id', 'amount', 'status'];
        return fieldsToCheck.some(field => editTaskForm[field] !== originalEditTaskForm[field]);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTaskForm) return;

        const missingFields: string[] = [];
        if (!editTaskForm.title?.trim()) missingFields.push('Title');
        if (!editTaskForm.description?.trim()) missingFields.push('Description');
        if (!editTaskForm.client_id) missingFields.push('Client');
        if (!editTaskForm.due_date) missingFields.push('Due date');

        if (missingFields.length > 0) {
            setDeleteMessage(`Please fill in: ${missingFields.join(', ')}.`);
            return;
        }

        const payload: any = {
            title: editTaskForm.title,
            description: editTaskForm.description,
            priority: editTaskForm.priority,
            due_date: editTaskForm.due_date,
            client_id: editTaskForm.client_id,
            amount: editTaskForm.amount || null,
            status: editTaskForm.status,
        };

        // If archive is pending, add it to the payload
        if (isPendingArchive) {
            payload.is_hidden = true;
            // If task is protected, also set status to completed
            if (isTaskProtected(editTaskForm as Task)) {
                payload.status = 'completed';
            }
        }

        try {
            const res = await fetch(`/api/tasks/${editTaskForm.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // update local list
                setTasks((prev) => prev.map((t) => (t.id === data.data.id ? data.data : t)));
                setIsEditDialogOpen(false);
                setEditTaskForm(null);
                setOriginalEditTaskForm(null);
                setIsPendingArchive(false);
            } else {
                // Show error message (for 403 or other errors)
                setDeleteMessage(data?.message || 'Failed to update task');
            }
        } catch (err) {
            console.error('Failed to update task', err);
            setDeleteMessage('Failed to update task');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-PT');
    };

    const isOverdue = (dueDate: string, status: string): boolean => {
        if (status === 'completed') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    };

    const getDueDateColor = (dueDate: string, status: string): string => {
        if (status === 'completed') return 'text-gray-600 dark:text-gray-400';
        if (isOverdue(dueDate, status)) return 'text-red-600 dark:text-red-400 font-medium';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        if (due <= tomorrow) return 'text-orange-600 dark:text-orange-400 font-medium';
        return 'text-gray-600 dark:text-gray-400';
    };

    const hasActiveFilters = (): boolean => {
        return searchQuery.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all';
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setDueDateFilter('all');
    };

    // Check if task is protected (attached to invoice with sensitive status)
    const isTaskProtected = (task: Task): boolean => {
        if (!task.invoice_id || !task.invoice_status) return false;
        return ['sent', 'paid', 'overdue'].includes(task.invoice_status);
    };

    // Filter tasks based on all criteria
    const getFilteredTasks = (): Task[] => {
        return tasks_list.filter((task) => {
            // Archive filter
            if (showArchived && !task.is_hidden) return false;
            if (!showArchived && task.is_hidden) return false;

            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = task.title.toLowerCase().includes(query);
                const matchesClient = task.client_name?.toLowerCase().includes(query);
                const matchesCompany = task.client_company?.toLowerCase().includes(query);
                if (!matchesTitle && !matchesClient && !matchesCompany) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && task.status !== statusFilter) return false;

            // Priority filter
            if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

            // Due date filter
            if (dueDateFilter !== 'all' && task.due_date) {
                const dueDate = new Date(task.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                switch (dueDateFilter) {
                    case 'overdue':
                        if (dueDate >= today) return false;
                        break;
                    case 'today':
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        if (dueDate < today || dueDate >= tomorrow) return false;
                        break;
                    case 'week':
                        const weekEnd = new Date(today);
                        weekEnd.setDate(weekEnd.getDate() + 7);
                        if (dueDate < today || dueDate >= weekEnd) return false;
                        break;
                    case 'month':
                        const monthEnd = new Date(today);
                        monthEnd.setMonth(monthEnd.getMonth() + 1);
                        if (dueDate < today || dueDate >= monthEnd) return false;
                        break;
                }
            }

            return true;
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tasks" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                Tasks
                            </h1>
                            <Badge variant="default" className="rounded-full font-bold px-2 py-0.5 text-xs">
                                {getFilteredTasks().filter((t) => t.status !== 'completed').length}
                            </Badge>
                        </div>
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
                                    <DatePicker
                                        value={newTaskForm.due_date}
                                        onChange={(value) =>
                                            setNewTaskForm({
                                                ...newTaskForm,
                                                due_date: value,
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
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <DialogTitle>Edit Task</DialogTitle>
                                        <DialogDescription>Update task details and move between states</DialogDescription>
                                    </div>
                                    {editTaskForm && isTaskProtected(editTaskForm as Task) && (
                                        <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                            <Archive className="h-3 w-3 mr-1" />
                                            Protected
                                        </Badge>
                                    )}
                                </div>
                            </DialogHeader>

                            {editTaskForm && (
                                <>
                                    {isTaskProtected(editTaskForm as Task) && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3">
                                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                                <strong>This task is linked to an invoice</strong> and cannot have its status changed or be deleted. When archived, it will be automatically marked as completed.
                                            </p>
                                        </div>
                                    )}
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
                                        <DatePicker
                                            value={editTaskForm.due_date}
                                            onChange={(value) => setEditTaskForm({ ...editTaskForm, due_date: value })}
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
                                        {editTaskForm.is_hidden ? (
                                            <div className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                                                Archived
                                            </div>
                                        ) : (
                                            <Select
                                                value={editTaskForm.status}
                                                onValueChange={(value) => setEditTaskForm({ ...editTaskForm, status: value as Task['status'] })}
                                                disabled={isTaskProtected(editTaskForm as Task)}
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
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex gap-2">
                                            {!isTaskProtected(editTaskForm as Task) && (
                                                <Button type="button" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                                                    Delete
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant={isPendingArchive ? 'default' : (editTaskForm.is_hidden ? 'secondary' : 'outline')}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleArchiveToggle(editTaskForm as Task, !editTaskForm.is_hidden);
                                                }}
                                            >
                                                {isPendingArchive ? 'Archive Pending' : (editTaskForm.is_hidden ? 'Unarchive' : 'Archive')}
                                            </Button>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" onClick={() => { 
                                                setIsEditDialogOpen(false); 
                                                setEditTaskForm(null);
                                                setOriginalEditTaskForm(null);
                                                setIsPendingArchive(false);
                                            }}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">Save</Button>
                                        </div>
                                    </div>
                                    </form>
                                </>
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

                    {/* Unarchive Status Selection Dialog */}
                    <AlertDialog open={isUnarchiveDialogOpen} onOpenChange={setIsUnarchiveDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Unarchive Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Select the status for this task when unarchiving
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-3">
                                {pendingUnarchiveTask && isTaskProtected(pendingUnarchiveTask) && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-3">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            <strong>This task has an associated invoice.</strong> You can only unarchive it to "Completed" status.
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={unarchiveStatus}
                                        onValueChange={(value) => setUnarchiveStatus(value as 'pending' | 'in_progress' | 'completed')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending" disabled={!!pendingUnarchiveTask && isTaskProtected(pendingUnarchiveTask)}>Pending</SelectItem>
                                            <SelectItem value="in_progress" disabled={!!pendingUnarchiveTask && isTaskProtected(pendingUnarchiveTask)}>In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={performUnarchive}>
                                    Unarchive
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Undo snackbars (one per pending delete) with progress bar */}
                    {pendingDeletes.length > 0 && (
                        <>
                            <style>{`
                                @keyframes progressBar {
                                    from { width: 100%; }
                                    to { width: 0%; }
                                }
                            `}</style>
                            <div className="fixed left-6 bottom-6 z-50 flex flex-col gap-2">
                                {pendingDeletes.map((p) =>
                                    p.visible ? (
                                        <div key={p.id} className="w-80 rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                                            <div className="flex items-center gap-4 px-4 py-2">
                                                <div className="text-sm text-gray-800 dark:text-gray-100">
                                                    Task deleted: <span className="font-medium">{p.task.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <Button variant="link" onClick={async () => {
                                                        // undo: cancel timer and fetch fresh task data from server
                                                        clearTimeout(p.timerId);
                                                        setPendingDeletes((prev) => prev.filter((x) => x.id !== p.id));
                                                        
                                                        try {
                                                            const res = await fetch(`/api/tasks/${p.task.id}`);
                                                            const data = await res.json();
                                                            if (res.ok && data.success && data.data) {
                                                                // Reinsert with fresh data from server
                                                                setTasks((prev) => [data.data, ...prev]);
                                                            } else {
                                                                // Fallback to cached task if fetch fails
                                                                setTasks((prev) => [p.task, ...prev]);
                                                            }
                                                        } catch (err) {
                                                            // Fallback to cached task if fetch fails
                                                            console.error('Failed to fetch task on undo:', err);
                                                            setTasks((prev) => [p.task, ...prev]);
                                                        }
                                                    }}>
                                                        Undo
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        // dismiss snackbar (deletion still happens after timeout)
                                                        setPendingDeletes((prev) => prev.map((x) => x.id === p.id ? { ...x, visible: false } : x));
                                                    }}>
                                                        Dismiss
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Progress bar using CSS animation; color follows current --primary variable */}
                                            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
                                                <div
                                                    role="progressbar"
                                                    aria-label={`Time remaining to undo deletion of ${p.task.title}`}
                                                    style={{
                                                        height: '100%',
                                                        background: 'var(--primary)',
                                                        animation: `progressBar ${UNDO_TIMEOUT}ms linear forwards`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : null,
                                )}
                            </div>
                        </>
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

                {/* Filters Section */}
                <div className="space-y-3">
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
                        <Input
                            placeholder="Search by title, client or company"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="md:col-span-2 col-span-2"
                        />
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as 'all' | Task['status'])}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={priorityFilter}
                            onValueChange={(value) => setPriorityFilter(value as 'all' | 'low' | 'medium' | 'high')}
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
                            value={dueDateFilter}
                            onValueChange={(value) => setDueDateFilter(value as 'all' | 'overdue' | 'today' | 'week' | 'month')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by due date" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All dates</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="today">Due today</SelectItem>
                                <SelectItem value="week">Due this week</SelectItem>
                                <SelectItem value="month">Due this month</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={showArchived ? 'archived' : 'active'}
                            onValueChange={(value) => setShowArchived(value === 'archived')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="View" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active tasks</SelectItem>
                                <SelectItem value="archived">Archived tasks</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {hasActiveFilters() && (
                        <div className="flex justify-end">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={resetFilters}
                                className="gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tasks List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-500 dark:text-gray-400">Loading tasks...</div>
                    </div>
                ) : getFilteredTasks().length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 rounded-2xl"
                    >
                        <CheckCircle2 className="mb-4 h-12 w-12 text-gray-400" />
                        <div className="text-center">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {tasks_list.length === 0 ? 'No tasks found' : 'No tasks match your filters'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {tasks_list.length === 0 
                                    ? 'Start by creating your first task' 
                                    : 'Try adjusting your search criteria'}
                            </p>
                        </div>
                    </motion.div>
                ) : showArchived ? (
                    // Show archived tasks as simple cards list (no kanban)
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {getFilteredTasks()
                                .map((task) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="cursor-grab active:cursor-grabbing"
                                        onClick={() => handleOpenEdit(task)}
                                    >
                                        <Card className="overflow-hidden p-4 transform transition-all hover:-translate-y-1 hover:shadow-md" style={{ borderLeft: '4px solid var(--primary)' }}>
                                            <CardContent>
                                                <div className="mb-3 flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate whitespace-nowrap" title={task.title}>
                                                            {task.title}
                                                        </h4>
                                                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                            Archived
                                                        </span>
                                                    </div>
                                                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                                                        <Flag className="h-3 w-3" />
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between text-xs">
                                                    <div className="truncate text-gray-600 dark:text-gray-400">{task.client_name} {task.client_company ? `(${task.client_company})` : ''}</div>
                                                    <div className={`ml-2 whitespace-nowrap flex items-center gap-1 ${getDueDateColor(task.due_date, task.status)}`}>
                                                        <Calendar className="h-3 w-3" />
                                                        Due {formatDate(task.due_date)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {/* Kanban columns */}
                            {[
                                { id: 'pending', title: 'Pending' },
                                { id: 'in_progress', title: 'In Progress' },
                                { id: 'completed', title: 'Completed' },
                            ].map((col) => (
                                <div
                                    key={col.id}
                                    className="min-h-[220px] rounded-lg border border-sidebar-border bg-transparent p-4"
                                >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold capitalize text-sidebar-foreground">
                                        {col.title}
                                    </h3>
                                    <span className="text-sm text-sidebar-foreground/70">
                                        {getFilteredTasks().filter((t) => t.status === col.id).length}
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

                                        if (isTaskProtected(task)) {
                                            setDeleteMessage('This task has an associated invoice, so its status cannot be changed.');
                                            return;
                                        }

                                        // Optimistic update
                                        setTasks((prev) =>
                                            prev.map((t) => (t.id === id ? { ...t, status: col.id as Task['status'] } : t)),
                                        );

                                        // Persist change
                                        fetch(`/api/tasks/${id}`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                Accept: 'application/json',
                                            },
                                            credentials: 'same-origin',
                                            body: JSON.stringify({ status: col.id }),
                                        }).then((res) => {
                                            if (!res.ok) fetchTasks();
                                        }).catch(() => fetchTasks());
                                    }}
                                    className="flex min-h-[120px] flex-col gap-2"
                                >
                                    {getFilteredTasks()
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
                                                        e.dataTransfer.setData('text/plain', String(task.id));
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    }}
                                                    onDragEnd={() => {
                                                        dragEndTimeRef.current = Date.now();
                                                    }}
                                                    onClick={() => {
                                                        const timeSinceDrag = Date.now() - dragEndTimeRef.current;
                                                        // Only block click if drag ended very recently (within 100ms)
                                                        if (timeSinceDrag > 100) {
                                                            handleOpenEdit(task);
                                                        }
                                                    }}
                                                >                                                    <Card className="overflow-hidden p-4 transform transition-all hover:-translate-y-1 hover:shadow-md" style={{ borderLeft: '4px solid var(--primary)' }}>
                                                        <CardContent>
                                                            <div className="mb-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate whitespace-nowrap" title={task.title}>
                                                                            {task.title}
                                                                        </h4> 
                                                                    </div>
                                                                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                                                                        <Flag className="h-3 w-3" />
                                                                        {task.priority}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                                                    <div className="truncate">{task.client_name} {task.client_company ? `(${task.client_company})` : ''}</div>
                                                                <div className={`ml-2 whitespace-nowrap flex items-center gap-1 text-xs ${getDueDateColor(task.due_date, task.status)}`}>
                                                                    <Calendar className="h-3 w-3" />
                                                                    Due {formatDate(task.due_date)}
                                                                </div>
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
                )}
            </div>
        </AppLayout>
    );
}
