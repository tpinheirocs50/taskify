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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import AppLayout from '@/layouts/app-layout';
import { invoices } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    Calendar,
    CircleDollarSign,
    FileText,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Invoices',
        href: invoices().url,
    },
];

interface Invoice {
    id: number;
    date: string;
    due_date?: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    tax_rate: number;
    description?: string;
    created_at: string;
    updated_at: string;
    total?: number;
    totalMinusTax?: number;
}

interface Task {
    id: number;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    starting_date: string;
    due_date: string;
    status: string;
    amount: number;
    invoice_id: number | null;
    user_id: number;
    client_id: number | null;
    user_name?: string;
    client_name?: string;
    client_company?: string;
}

interface InvoiceStats {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
}

export default function Invoices() {
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;
    const missingProfileFields = [
        { key: 'tin', label: 'Tax ID (TIN)', value: auth?.user?.tin },
        { key: 'address', label: 'Address', value: auth?.user?.address },
        { key: 'phone', label: 'Phone', value: auth?.user?.phone },
    ].filter((field) => !field.value || String(field.value).trim() === '');
    const missingProfileFieldsLabel = missingProfileFields
        .map((field) => field.label)
        .join(', ');
    const [invoices_list, setInvoices] = useState<Invoice[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>(
        'all',
    );
    const [sortField, setSortField] = useState<
        'id' | 'date' | 'status' | 'created_at'
    >('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
    });
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    });
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [invoiceTasks, setInvoiceTasks] = useState<Task[]>([]);
    const [editStatus, setEditStatus] = useState<Invoice['status']>('draft');
    const [isUpdating, setIsUpdating] = useState(false);
    const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // Form fields for create/edit
    const [formDate, setFormDate] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formTaxRate, setFormTaxRate] = useState('0');
    const [formDescription, setFormDescription] = useState('');

    // Helper function to convert YYYY-MM-DD to DD/MM/YYYY
    const formatDateDisplay = (isoDate: string): string => {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-');
        return `${day}/${month}/${year}`;
    };

    // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
    const formatDateISO = (displayDate: string): string => {
        if (!displayDate) return '';
        const parts = displayDate.split('/');
        if (parts.length !== 3) return '';
        const [day, month, year] = parts;
        // Validate and format
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) return '';
        return `${String(yearNum).padStart(4, '0')}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (currentUserId) {
            fetchInvoices();
        }
    }, [currentUserId]);

    const fetchInvoiceTasks = async (invoiceId: number) => {
        try {
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

            const tasks = allTasks.filter(
                (task) => task.invoice_id === invoiceId && task.status === 'completed'
            );
            setInvoiceTasks(tasks);
        } catch (error) {
            console.error('Error fetching invoice tasks:', error);
        }
    };

    const fetchAvailableTasks = async () => {
        try {
            // Fetch all tasks without invoice_id for current user
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

            // Filter tasks: current user's tasks without invoice
            const userAvailableTasks = allTasks.filter(
                (task) => task.user_id === currentUserId &&
                    task.invoice_id === null &&
                    task.status === 'completed'
            );

            setAvailableTasks(userAvailableTasks);
        } catch (error) {
            console.error('Error fetching available tasks:', error);
        }
    };

    const fetchInvoices = async () => {
        try {
            // First, fetch all tasks to find invoice IDs for current user
            let allTasks: Task[] = [];
            let currentPage = 1;
            let lastPage = 1;

            do {
                const tasksResponse = await fetch(`/api/tasks?page=${currentPage}`);
                const tasksData = await tasksResponse.json();

                if (tasksData.success) {
                    allTasks = [...allTasks, ...tasksData.data];
                    lastPage = tasksData.pagination.last_page;
                    currentPage++;
                } else {
                    break;
                }
            } while (currentPage <= lastPage);

            // Filter tasks for current user and get their invoice IDs
            const userInvoiceIds = new Set(
                allTasks
                    .filter((task) => task.user_id === currentUserId && task.invoice_id !== null)
                    .map((task) => task.invoice_id)
            );

            // Now fetch all invoices (handle pagination)
            let allInvoices: Invoice[] = [];
            currentPage = 1;
            lastPage = 1;

            do {
                const response = await fetch(`/api/invoices?page=${currentPage}`);
                const data = await response.json();

                if (data.success) {
                    allInvoices = [...allInvoices, ...data.data];
                    lastPage = data.pagination.last_page;
                    currentPage++;
                } else {
                    break;
                }
            } while (currentPage <= lastPage);

            // Filter invoices to only show those related to user's tasks
            const userInvoices = allInvoices.filter((invoice) =>
                userInvoiceIds.has(invoice.id),
            );

            // Calculate total amount for each invoice
            const invoicesWithTotals = userInvoices.map((invoice) => {
                const subtotal = allTasks
                    .filter((task) => task.invoice_id === invoice.id)
                    .reduce((sum, task) => sum + (Number(task.amount) || 0), 0);
                const taxRate = Number(invoice.tax_rate) || 0;
                const totalMinusTax = subtotal - (subtotal * taxRate / 100);

                return {
                    ...invoice,
                    total: subtotal,
                    totalMinusTax: totalMinusTax,
                };
            });

            setInvoices(invoicesWithTotals);
            setPagination({
                total: userInvoices.length,
                per_page: userInvoices.length,
                current_page: userInvoices.length ? 1 : 0,
                last_page: userInvoices.length ? 1 : 0,
            });

            setInvoiceStats({
                draft: userInvoices.filter((invoice) => invoice.status === 'draft')
                    .length,
                sent: userInvoices.filter((invoice) => invoice.status === 'sent')
                    .length,
                paid: userInvoices.filter((invoice) => invoice.status === 'paid')
                    .length,
                overdue: userInvoices.filter(
                    (invoice) => invoice.status === 'overdue',
                ).length,
                cancelled: userInvoices.filter((invoice) => invoice.status === 'cancelled')
                    .length,
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setLoading(false);
        }
    };

    const handleCreateInvoice = async () => {
        if (missingProfileFields.length > 0) {
            setAlertMessage(
                `Please complete your profile before creating invoices. Missing: ${missingProfileFieldsLabel}.`
            );
            return;
        }
        if (selectedTaskIds.length === 0) {
            setAlertMessage('Please select at least one task');
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    task_ids: selectedTaskIds,
                    date: formatDateISO(formDate) || new Date().toISOString().split('T')[0],
                    due_date: formatDateISO(formDueDate) || null,
                    status: 'draft',
                    tax_rate: Number(formTaxRate) || 0,
                    description: formDescription || null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Reset dialog state
                setSelectedTaskIds([]);
                setFormDate('');
                setFormDueDate('');
                setFormTaxRate('0');
                setFormDescription('');
                setIsCreateDialogOpen(false);
                // Refresh data
                await fetchInvoices();
                await fetchAvailableTasks();
            } else {
                setAlertMessage(data.message || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            setAlertMessage('Failed to create invoice');
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditInvoice = async (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setEditStatus(invoice.status);
        // Format dates to DD/MM/YYYY for display
        const dateStr = new Date(invoice.date).toISOString().split('T')[0];
        const dueDateStr = invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '';
        setFormDate(formatDateDisplay(dateStr));
        setFormDueDate(formatDateDisplay(dueDateStr));
        setFormTaxRate(String(invoice.tax_rate || 0));
        setFormDescription(invoice.description || '');
        setSelectedTaskIds([]);
        setIsEditDialogOpen(true);
        await Promise.all([
            fetchInvoiceTasks(invoice.id),
            fetchAvailableTasks(),
        ]);
    };

    const handleUpdateInvoice = async () => {
        if (!editingInvoice) return;

        setIsUpdating(true);
        try {
            // Get current task IDs for this invoice
            const currentTaskIds = invoiceTasks.map((task) => task.id);

            // Combine: keep existing tasks + add newly selected tasks
            const allTaskIds = Array.from(
                new Set([...currentTaskIds, ...selectedTaskIds])
            );

            // If no tasks are assigned, delete the invoice instead
            if (allTaskIds.length === 0) {
                const deleteResponse = await fetch(`/api/invoices/${editingInvoice.id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    },
                });

                const deleteData = await deleteResponse.json();

                if (deleteData.success) {
                    setIsEditDialogOpen(false);
                    setEditingInvoice(null);
                    setSelectedTaskIds([]);
                    setAlertMessage('Invoice deleted because it has no tasks assigned.');
                    await fetchInvoices();
                } else {
                    setAlertMessage(deleteData.message || 'Failed to delete invoice');
                }
            } else {
                const response = await fetch(`/api/invoices/${editingInvoice.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        date: formatDateISO(formDate),
                        status: editStatus,
                        due_date: formatDateISO(formDueDate) || null,
                        tax_rate: Number(formTaxRate) || 0,
                        description: formDescription || null,
                        task_ids: allTaskIds,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    setIsEditDialogOpen(false);
                    setEditingInvoice(null);
                    setSelectedTaskIds([]);
                    await fetchInvoices();
                } else {
                    setAlertMessage(data.message || 'Failed to update invoice');
                }
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
            setAlertMessage('Failed to update invoice');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveTaskFromInvoice = async (taskId: number) => {
        if (!editingInvoice) return;

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    invoice_id: null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Refresh the task lists
                await Promise.all([
                    fetchInvoiceTasks(editingInvoice.id),
                    fetchAvailableTasks(),
                ]);
            } else {
                setAlertMessage(data.message || 'Failed to remove task');
            }
        } catch (error) {
            console.error('Error removing task:', error);
            setAlertMessage('Failed to remove task');
        }
    };

    const handleDeleteInvoice = async () => {
        if (!deleteInvoiceId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/invoices/${deleteInvoiceId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                setDeleteInvoiceId(null);
                await fetchInvoices();
            } else {
                setAlertMessage(data.message || 'Failed to delete invoice');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            setAlertMessage('Failed to delete invoice');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleTaskSelection = (taskId: number) => {
        setSelectedTaskIds((prev) =>
            prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId]
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'sent':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'draft':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
            case 'overdue':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'cancelled':
                return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
            default:
                return '';
        }
    };

    const filteredInvoices = invoices_list.filter((invoice) => {
        const matchesStatus =
            statusFilter === 'all' || invoice.status === statusFilter;
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return matchesStatus;
        }
        const matchesQuery =
            invoice.id.toString().includes(query) ||
            invoice.status.toLowerCase().includes(query);
        return matchesStatus && matchesQuery;
    });

    const sortedInvoices = [...filteredInvoices].sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        switch (sortField) {
            case 'id':
                return (a.id - b.id) * direction;
            case 'status':
                return a.status.localeCompare(b.status) * direction;
            case 'created_at':
                return (
                    (new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()) *
                    direction
                );
            case 'date':
            default:
                return (
                    (new Date(a.date).getTime() -
                        new Date(b.date).getTime()) *
                    direction
                );
        }
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {missingProfileFields.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                        <span className="font-medium">Action required:</span>{' '}
                        Please complete your profile before creating invoices. Missing: {missingProfileFieldsLabel}.
                    </div>
                )}
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {/* <FileText className="h-8 w-8" /> */}
                            <h1 className="text-3xl font-bold tracking-tight">
                                Invoices
                            </h1>
                        </div>
                        <p className="text-muted-foreground">
                            Manage and track all your invoices
                        </p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                        if (open && missingProfileFields.length > 0) {
                            setAlertMessage(
                                `Please complete your profile before creating invoices. Missing: ${missingProfileFieldsLabel}.`
                            );
                            return;
                        }
                        setIsCreateDialogOpen(open);
                        if (open) {
                            fetchAvailableTasks();
                            setSelectedTaskIds([]);
                            const today = new Date().toISOString().split('T')[0];
                            const todayDisplay = formatDateDisplay(today);
                            setFormDate(todayDisplay);
                            setFormDueDate(todayDisplay);
                            setFormTaxRate('0');
                            setFormDescription('');
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button disabled={missingProfileFields.length > 0}>
                                Create Invoice
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Invoice</DialogTitle>
                                <DialogDescription>
                                    Select tasks to include in this invoice. Only tasks without an existing invoice are shown.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                {availableTasks.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No available tasks. All your tasks are already assigned to invoices.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Invoice Details */}
                                        <div className="space-y-3 border-b pb-4">
                                            <div className="text-sm font-medium">Invoice Details</div>
                                            <div className="grid gap-3 md:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-date">Invoice Date</Label>
                                                    <Input
                                                        id="create-date"
                                                        type="date"
                                                        value={formDate ? formatDateISO(formDate) : ''}
                                                        onChange={(e) => setFormDate(formatDateDisplay(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-due-date">Due Date</Label>
                                                    <Input
                                                        id="create-due-date"
                                                        type="date"
                                                        value={formDueDate ? formatDateISO(formDueDate) : ''}
                                                        onChange={(e) => setFormDueDate(formatDateDisplay(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-tax-rate">Tax Rate (%)</Label>
                                                    <Input
                                                        id="create-tax-rate"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={formTaxRate}
                                                        onChange={(e) => setFormTaxRate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="create-description">Description (Optional)</Label>
                                                <Textarea
                                                    id="create-description"
                                                    placeholder="Add notes or description for this invoice..."
                                                    value={formDescription}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormDescription(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium">
                                            Select Tasks ({selectedTaskIds.length} selected)
                                        </div>
                                        <div className="space-y-2 border rounded-lg p-4 max-h-96 overflow-y-auto">
                                            {availableTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors bg-muted/30"
                                                >
                                                    <Checkbox
                                                        id={`task-${task.id}`}
                                                        checked={selectedTaskIds.includes(task.id)}
                                                        onCheckedChange={() => toggleTaskSelection(task.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 space-y-2">
                                                        <div>
                                                            <div className="font-semibold text-sm">{task.title}</div>
                                                            {task.client_company && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {task.client_company}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(task.due_date).toLocaleDateString('pt-PT')}
                                                            </div>
                                                            {task.amount && (
                                                                <div className="flex items-center gap-1">
                                                                    <CircleDollarSign className="h-3 w-3" />
                                                                    {Number(task.amount).toFixed(2)} €
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {selectedTaskIds.length > 0 && (
                                            <div className="text-sm text-muted-foreground">
                                                Total amount: {availableTasks.filter((task) => selectedTaskIds.includes(task.id)).reduce((sum, task) => sum + (Number(task.amount) || 0), 0).toFixed(2)} €
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                    disabled={isCreating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateInvoice}
                                    disabled={isCreating || selectedTaskIds.length === 0}
                                >
                                    {isCreating ? 'Creating...' : 'Create Invoice'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Invoice Stats */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Draft
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {invoiceStats.draft}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Sent
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {invoiceStats.sent}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Paid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {invoiceStats.paid}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Overdue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {invoiceStats.overdue}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Cancelled
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {invoiceStats.cancelled}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Invoices Table */}
                <Card>
                    <CardHeader className="flex flex-col gap-4">
                        <div>
                            <CardTitle>All Invoices</CardTitle>
                            <CardDescription>
                                A list of all invoices in your system
                            </CardDescription>
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                            <Input
                                placeholder="Search by ID or status"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                            />
                            <Select
                                value={statusFilter}
                                onValueChange={(value) =>
                                    setStatusFilter(
                                        value as 'all' | Invoice['status'],
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={sortField}
                                onValueChange={(value) =>
                                    setSortField(
                                        value as
                                        | 'id'
                                        | 'date'
                                        | 'status'
                                        | 'created_at',
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Invoice date</SelectItem>
                                    <SelectItem value="created_at">Created date</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                    <SelectItem value="id">Invoice ID</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={sortDirection}
                                onValueChange={(value) =>
                                    setSortDirection(value as 'asc' | 'desc')
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Direction" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desc">Descending</SelectItem>
                                    <SelectItem value="asc">Ascending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-muted-foreground">
                                    Loading invoices...
                                </div>
                            </div>
                        ) : sortedInvoices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                                <div className="text-muted-foreground text-center">
                                    <p className="font-medium">No invoices found</p>
                                    <p className="text-sm">
                                        Start by creating your first invoice
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Invoice Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Before Tax</TableHead>
                                        <TableHead className="text-right">Tax</TableHead>
                                        <TableHead className="text-right">After Tax</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedInvoices.map((invoice) => {
                                        const taxRate = Number(invoice.tax_rate) || 0;
                                        const subtotal = invoice.total || 0;
                                        const taxAmount = subtotal * taxRate / 100;

                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">
                                                    #{invoice.id}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        invoice.date,
                                                    ).toLocaleDateString('pt-PT')}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.due_date
                                                        ? new Date(invoice.due_date).toLocaleDateString('pt-PT')
                                                        : '-'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(invoice.status)}`}
                                                    >
                                                        {invoice.status.charAt(0).toUpperCase() +
                                                            invoice.status.slice(1)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {subtotal.toFixed(2)} €
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {taxRate}% ({taxAmount.toFixed(2)} €)
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {(invoice.totalMinusTax || 0).toFixed(2)} €
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEditInvoice(invoice)}
                                                            className="h-8 text-primary hover:text-primary/90 hover:bg-primary/10"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setDeleteInvoiceId(invoice.id)}
                                                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination Info */}
                {!loading && invoices_list.length > 0 && (
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                        <span>
                            Showing {sortedInvoices.length} of {invoices_list.length}{' '}
                            invoices
                        </span>
                    </div>
                )}

                {/* Edit Invoice Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Invoice #{editingInvoice?.id}</DialogTitle>
                            <DialogDescription>
                                Manage tasks and update invoice status
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                            {/* Invoice Details */}
                            <div className="space-y-3 border-b pb-4">
                                <div className="text-sm font-medium">Invoice Details</div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-date">Invoice Date</Label>
                                        <Input
                                            id="edit-date"
                                            type="date"
                                            value={formDate ? formatDateISO(formDate) : ''}
                                            onChange={(e) => setFormDate(formatDateDisplay(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-due-date">Due Date</Label>
                                        <Input
                                            id="edit-due-date"
                                            type="date"
                                            value={formDueDate ? formatDateISO(formDueDate) : ''}
                                            onChange={(e) => setFormDueDate(formatDateDisplay(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-tax-rate">Tax Rate (%)</Label>
                                        <Input
                                            id="edit-tax-rate"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={formTaxRate}
                                            onChange={(e) => setFormTaxRate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        placeholder="Add notes or description for this invoice..."
                                        value={formDescription}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* Status Selection */}
                            <div className="space-y-2">
                                <Label>Invoice Status</Label>
                                <Select value={editStatus} onValueChange={(value) => setEditStatus(value as Invoice['status'])}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Current Tasks */}
                            <div className="space-y-2">
                                <Label>Current Tasks in Invoice</Label>
                                {invoiceTasks.length === 0 ? (
                                    <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                                        No tasks in this invoice
                                    </div>
                                ) : (
                                    <div className="space-y-2 border rounded-lg p-4 max-h-48 overflow-y-auto">
                                        {invoiceTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-accent/30"
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <div className="font-medium">{task.title}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {task.client_company && (
                                                            <span>{task.client_company} • </span>
                                                        )}
                                                        <span>Due: {new Date(task.due_date).toLocaleDateString('pt-PT')}</span>
                                                        {task.amount && (
                                                            <span> • {Number(task.amount).toFixed(2)} €</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveTaskFromInvoice(task.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                    Total: {invoiceTasks.reduce((sum, task) => sum + (Number(task.amount) || 0), 0).toFixed(2)} €
                                </div>
                            </div>

                            {/* Add More Tasks */}
                            {availableTasks.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Add Tasks to Invoice ({selectedTaskIds.length} selected)</Label>
                                    <div className="space-y-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                                        {availableTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors bg-muted/30"
                                            >
                                                <Checkbox
                                                    id={`edit-task-${task.id}`}
                                                    checked={selectedTaskIds.includes(task.id)}
                                                    onCheckedChange={() => toggleTaskSelection(task.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <div>
                                                        <div className="font-semibold text-sm">{task.title}</div>
                                                        {task.client_company && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {task.client_company}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(task.due_date).toLocaleDateString('pt-PT')}
                                                        </div>
                                                        {task.amount && (
                                                            <div className="flex items-center gap-1">
                                                                <CircleDollarSign className="h-3 w-3" />
                                                                {Number(task.amount).toFixed(2)} €
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedTaskIds.length > 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            Adding:
                                            {availableTasks
                                                .filter((task) => selectedTaskIds.includes(task.id))
                                                .reduce((sum, task) => sum + (Number(task.amount) || 0), 0)
                                                .toFixed(2)}
                                            €
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateInvoice}
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Updating...' : 'Update Invoice'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteInvoiceId !== null} onOpenChange={(open: boolean) => !open && setDeleteInvoiceId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete invoice #{deleteInvoiceId}? This will remove the invoice and unassign all its tasks. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteInvoice}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Generic Alert Dialog */}
                <AlertDialog open={alertMessage !== null} onOpenChange={(open: boolean) => !open && setAlertMessage(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Message</AlertDialogTitle>
                            <AlertDialogDescription>
                                {alertMessage}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction
                                onClick={() => setAlertMessage(null)}
                            >
                                OK
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
