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
import { invoices } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FileText, Plus } from 'lucide-react';
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

export default function Invoices() {
    const [invoices_list, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        per_page: 15,
        current_page: 1,
        last_page: 1,
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async (page = 1) => {
        try {
            const response = await fetch(`/api/invoices?page=${page}`);
            const data = await response.json();

            if (data.success) {
                setInvoices(data.data);
                setPagination(data.pagination);
            }
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FileText className="h-8 w-8" />
                            <h1 className="text-3xl font-bold tracking-tight">
                                Invoices
                            </h1>
                        </div>
                        <p className="text-muted-foreground">
                            Manage and track all your invoices
                        </p>
                    </div>
                </div>

                {/* Invoices Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>All Invoices</CardTitle>
                            <CardDescription>
                                A list of all invoices in your system
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-muted-foreground">
                                    Loading invoices...
                                </div>
                            </div>
                        ) : invoices_list.length === 0 ? (
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
                                    {invoices_list.map((invoice) => (
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
                            Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                            {Math.min(
                                pagination.current_page * pagination.per_page,
                                pagination.total,
                            )}{' '}
                            of {pagination.total} invoices
                        </span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
