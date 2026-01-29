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
    invoice_id: number | null;
    user_id: number;
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

    useEffect(() => {
        if (currentUserId) {
            fetchInvoices();
        }
    }, [currentUserId]);

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
