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
import AppLayout from '@/layouts/app-layout';
import { invoices } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { FileText } from 'lucide-react';
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
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    created_at: string;
    updated_at: string;
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
    sent: number;
    paid: number;
    overdue: number;
}

export default function Invoices() {
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;
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
        sent: 0,
        paid: 0,
        overdue: 0,
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

    useEffect(() => {
        if (currentUserId) {
            fetchInvoices();
        }
    }, [currentUserId]);

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
                (task) => task.user_id === currentUserId && task.invoice_id === null
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

            setInvoices(userInvoices);
            setPagination({
                total: userInvoices.length,
                per_page: userInvoices.length,
                current_page: userInvoices.length ? 1 : 0,
                last_page: userInvoices.length ? 1 : 0,
            });

            setInvoiceStats({
                sent: userInvoices.filter((invoice) => invoice.status === 'sent')
                    .length,
                paid: userInvoices.filter((invoice) => invoice.status === 'paid')
                    .length,
                overdue: userInvoices.filter(
                    (invoice) => invoice.status === 'overdue',
                ).length,
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setLoading(false);
        }
    };

    const handleCreateInvoice = async () => {
        if (selectedTaskIds.length === 0) {
            alert('Please select at least one task');
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
                    date: new Date().toISOString().split('T')[0],
                    status: 'draft',
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Reset dialog state
                setSelectedTaskIds([]);
                setIsCreateDialogOpen(false);
                // Refresh data
                await fetchInvoices();
                await fetchAvailableTasks();
            } else {
                alert(data.message || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice');
        } finally {
            setIsCreating(false);
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
                        setIsCreateDialogOpen(open);
                        if (open) {
                            fetchAvailableTasks();
                            setSelectedTaskIds([]);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button>
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
                                        <div className="text-sm font-medium">
                                            Select Tasks ({selectedTaskIds.length} selected)
                                        </div>
                                        <div className="space-y-2 border rounded-lg p-4 max-h-96 overflow-y-auto">
                                            {availableTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                                >
                                                    <Checkbox
                                                        id={`task-${task.id}`}
                                                        checked={selectedTaskIds.includes(task.id)}
                                                        onCheckedChange={() => toggleTaskSelection(task.id)}
                                                    />
                                                    <Label
                                                        htmlFor={`task-${task.id}`}
                                                        className="flex-1 cursor-pointer space-y-1"
                                                    >
                                                        <div className="font-medium">{task.title}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {task.client_company && (
                                                                <span>{task.client_company} • </span>
                                                            )}
                                                            <span>Due: {new Date(task.due_date).toLocaleDateString('pt-PT')}</span>
                                                            {task.amount && (
                                                                <span> • ${Number(task.amount).toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        {selectedTaskIds.length > 0 && (
                                            <div className="text-sm text-muted-foreground">
                                                Total amount: $
                                                {availableTasks
                                                    .filter((task) => selectedTaskIds.includes(task.id))
                                                    .reduce((sum, task) => sum + (Number(task.amount) || 0), 0)
                                                    .toFixed(2)}
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
                <div className="grid gap-4 md:grid-cols-3">
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
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedInvoices.map((invoice) => (
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
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(invoice.status)}`}
                                                >
                                                    {invoice.status.charAt(0).toUpperCase() +
                                                        invoice.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    invoice.created_at,
                                                ).toLocaleDateString('pt-PT')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                                                        Edit
                                                    </button>
                                                    <button className="text-sm text-red-600 hover:underline dark:text-red-400">
                                                        Delete
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
            </div>
        </AppLayout>
    );
}
