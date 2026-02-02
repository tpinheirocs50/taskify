import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { clients } from '@/data';
import { Trash2, Mail, Phone, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Client = {
  id: number;
  name: string;
  tin?: string;
  company?: string;
  email: string;
  phone?: string;
  address: string;
  isActive?: boolean;
  created_at?: string;
};

type Props = {
  clients: Client[];
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Clients',
    href: clients().url,
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: number): string {
  const colors = [
    'bg-slate-500',
    'bg-slate-600',
    'bg-slate-400',
    'bg-slate-700',
    'bg-slate-500',
    'bg-slate-600',
  ];
  return colors[id % colors.length];
}

export default function Clients({ clients: clientsList }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [includeTin, setIncludeTin] = useState(false);
  const [onlyActive, setOnlyActive] = useState(false);
  const [clientsState, setClients] = useState<Client[]>(clientsList || []);
  const [loading, setLoading] = useState(false);

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [tin, setTin] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Delete dialog
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [editTin, setEditTin] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);

  // Stats shown in edit modal
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [activeTasksCount, setActiveTasksCount] = useState<number>(0);

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  // Reset to first page when search, view mode or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showAll, includeTin, onlyActive]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let allClients: Client[] = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const response = await fetch(`/api/clients?page=${currentPage}`);
        const data = await response.json();

        if (data.success) {
          allClients = [...allClients, ...data.data];
          lastPage = data.pagination?.last_page || 1;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= lastPage);

      setClients(allClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks for a specific client to calculate totals / active count
  const fetchClientTasks = async (clientId: number) => {
    try {
      let allTasks: any[] = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const response = await fetch(`/api/tasks?page=${currentPage}`);
        const data = await response.json();

        if (data.success) {
          allTasks = [...allTasks, ...data.data];
          lastPage = data.pagination?.last_page || 1;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= lastPage);

      const clientTasks = allTasks.filter((t) => Number(t.client_id) === Number(clientId));
      const total = clientTasks.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const activeCount = clientTasks.filter((t) => t.status !== 'completed').length;

      setTotalAmount(total);
      setActiveTasksCount(activeCount);
    } catch (error) {
      console.error('Error fetching client tasks:', error);
      setTotalAmount(0);
      setActiveTasksCount(0);
    }
  };

  const openEditClient = async (client: Client) => {
    setEditClient(client);
    setEditName(client.name);
    setEditTin(client.tin || '');
    setEditAddress(client.address);
    setEditEmail(client.email);
    setEditCompany(client.company || '');
    setEditPhone(client.phone || '');
    setEditIsActive(client.isActive ?? true);

    await fetchClientTasks(client.id);
    setIsEditOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editClient) return;
    setIsUpdatingClient(true);

    try {
      const response = await fetch(`/api/clients/${editClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          name: editName,
          tin: editTin,
          address: editAddress,
          email: editEmail,
          company: editCompany,
          phone: editPhone,
          isActive: editIsActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditOpen(false);
        setEditClient(null);
        await fetchClients();
      } else {
        setAlertMessage(data.message || 'Failed to update client');
      }
    } catch (error) {
      console.error('Update client error:', error);
      setAlertMessage('Failed to update client');
    } finally {
      setIsUpdatingClient(false);
    }
  };

  const handleCreateClient = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          name,
          tin,
          address,
          email,
          company,
          phone,
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsCreateOpen(false);
        // Reset form
        setName('');
        setTin('');
        setAddress('');
        setEmail('');
        setCompany('');
        setPhone('');
        setIsActive(true);
        await fetchClients();
      } else {
        setAlertMessage(data.message || 'Failed to create client');
      }
    } catch (error) {
      console.error('Create client error:', error);
      setAlertMessage('Failed to create client');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${deleteClientId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        setDeleteClientId(null);
        await fetchClients();
      } else {
        setAlertMessage(data.message || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Delete client error:', error);
      setAlertMessage('Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();

  const filtered = clientsState.filter((client) => {
    if (onlyActive && client.isActive === false) return false;
    if (!query) return true;

    const nameMatch = client.name.toLowerCase().includes(query);
    const tinMatch = client.tin ? client.tin.toLowerCase().includes(query) : false;
    const companyMatch = (client.company || '').toLowerCase().includes(query);
    const emailMatch = client.email.toLowerCase().includes(query);

    return nameMatch || (includeTin && tinMatch) || companyMatch || emailMatch;
  });

  // Sort: active first, prioritize name matches in search, then by created_at desc (newest first)
  const sorted = [...filtered].sort((a, b) => {
    const aActive = a.isActive ?? true;
    const bActive = b.isActive ?? true;
    if (aActive !== bActive) return aActive ? -1 : 1;

    if (query) {
      const aName = a.name.toLowerCase().includes(query) ? 1 : 0;
      const bName = b.name.toLowerCase().includes(query) ? 1 : 0;
      if (aName !== bName) return bName - aName; // name matches first

      if (includeTin) {
        const aTin = a.tin ? a.tin.toLowerCase().includes(query) : false;
        const bTin = b.tin ? b.tin.toLowerCase().includes(query) : false;
        if (aTin !== bTin) return bTin ? -1 : 1;
      }
    }

    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime; // newest first
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));

  // Ensure current page is within bounds
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  const displayed = showAll ? sorted : sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Clients" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client relationships</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => setIsCreateOpen(open)}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-xs">+ Add Client</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Client</DialogTitle>
                <DialogDescription>Add a new client to your account</DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Name</Label>
                    <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-tin">TIN</Label>
                    <Input id="client-tin" value={tin} onChange={(e) => setTin(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-address">Address</Label>
                  <Textarea id="client-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input id="client-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-company">Company</Label>
                    <Input id="client-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-phone">Phone</Label>
                    <Input id="client-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox id="client-active" checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
                  <Label htmlFor="client-active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>Cancel</Button>
                <Button onClick={handleCreateClient} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Client'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:gap-3">
          <div className="flex-1">
            <Input
              placeholder="Pesquisar clientes (por nome)"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 mt-2 md:mt-0 items-center">
            <div className="flex items-center gap-2">
              <Checkbox id="filter-active" checked={onlyActive} onCheckedChange={(v) => setOnlyActive(Boolean(v))} className="rounded-full" />
              <Label htmlFor="filter-active">Ativos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="include-tin" checked={includeTin} onCheckedChange={(v) => setIncludeTin(Boolean(v))} className="rounded-full" />
              <Label htmlFor="include-tin">Pesquisar TIN</Label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">Loading clients...</div>
          ) : displayed.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">No clients found</div>
          ) : (
            displayed.map((client) => (
              <div key={client.id} onClick={() => openEditClient(client)} className={`bg-card text-card-foreground shadow-sm border border-border rounded-lg p-6 ${!client.isActive ? 'opacity-60' : ''} cursor-pointer hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${getAvatarColor(client.id)} rounded-full flex items-center justify-center text-card-foreground font-bold text-sm`}>{getInitials(client.name)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteClientId(client.id); }}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete client"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={16} className="text-muted-foreground/60" />
                    <a href={`mailto:${client.email}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors">{client.email}</a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={16} className="text-muted-foreground/60" />
                    <a href={`tel:${client.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors">{client.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} className="text-muted-foreground/60" />
                    <span>{client.address}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {displayed.length} de {sorted.length} clientes{!showAll && sorted.length > perPage ? ` — página ${currentPage} de ${totalPages}` : ''}
          </div>

          <div className="flex items-center gap-2">
            {!showAll && totalPages > 1 && (
              <>
                <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Anterior
                </Button>

                <div className="hidden md:flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={currentPage === i + 1 ? undefined : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Próximo
                </Button>
              </>
            )}

            <Button size="sm" variant={showAll ? 'outline' : 'ghost'} onClick={() => { setShowAll((s) => !s); setCurrentPage(1); }}>
              {showAll ? 'Mostrar paginado' : 'Ver todos'}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteClientId !== null} onOpenChange={(open: boolean) => !open && setDeleteClientId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this client? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteClient} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => setIsEditOpen(open)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client #{editClient?.id}</DialogTitle>
              <DialogDescription>Update client details (read-only: ID and Created At)</DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-client-name">Name</Label>
                  <Input id="edit-client-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-client-tin">TIN</Label>
                  <Input id="edit-client-tin" value={editTin} onChange={(e) => setEditTin(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-client-address">Address</Label>
                <Textarea id="edit-client-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows={3} />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-client-email">Email</Label>
                  <Input id="edit-client-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-client-company">Company</Label>
                  <Input id="edit-client-company" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-client-phone">Phone</Label>
                  <Input id="edit-client-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox id="edit-client-active" checked={editIsActive} onCheckedChange={(v) => setEditIsActive(Boolean(v))} />
                <Label htmlFor="edit-client-active">Active</Label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>ID</Label>
                  <Input value={String(editClient?.id ?? '')} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Created At</Label>
                  <Input value={editClient?.created_at ? new Date(editClient.created_at).toLocaleString('pt-PT') : ''} disabled />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 mt-4">
                <div className="bg-muted/10 rounded-lg p-4 text-center">
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-xl font-medium">{totalAmount.toFixed(2)} €</div>
                </div>
                <div className="bg-muted/10 rounded-lg p-4 text-center">
                  <div className="text-sm text-muted-foreground">Active Tasks</div>
                  <div className="text-xl font-medium">{activeTasksCount}</div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUpdatingClient}>Cancel</Button>
              <Button onClick={handleUpdateClient} disabled={isUpdatingClient}>{isUpdatingClient ? 'Updating...' : 'Update Client'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generic Alert Dialog */}
        <AlertDialog open={alertMessage !== null} onOpenChange={(open: boolean) => !open && setAlertMessage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Message</AlertDialogTitle>
              <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setAlertMessage(null)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}