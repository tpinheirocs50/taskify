import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { clients } from '@/data';
import { Archive, ArchiveRestore, Mail, Phone, MapPin } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [tinQuery, setTinQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
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
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

  // Delete dialog
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activateClient, setActivateClient] = useState<Client | null>(null);

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
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);


  // Pagination (server-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 6,
    current_page: 1,
    last_page: 1,
  });

  useEffect(() => {
    fetchClients(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  // Reset to first page when search, view mode or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tinQuery, statusFilter]);

  const fetchClients = async (page = 1, status = 'active') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients?page=${page}&status=${status}`, {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      });
      const data = await response.json();

      if (data.success) {
        setClients(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
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
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: editName,
          tin: editTin,
          address: editAddress,
          email: editEmail,
          company: editCompany,
          phone: editPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditOpen(false);
        setEditClient(null);
        await fetchClients(currentPage, statusFilter);
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
    const nextErrors: Record<string, string[]> = {};
    if (!name.trim()) nextErrors.name = ['O nome é obrigatório.'];
    if (!tin.trim()) nextErrors.tin = ['O TIN é obrigatório.'];
    if (!address.trim()) nextErrors.address = ['O endereço é obrigatório.'];
    if (!email.trim()) nextErrors.email = ['O email é obrigatório.'];
    if (Object.keys(nextErrors).length > 0) {
      setCreateErrors(nextErrors);
      return;
    }

    setIsCreating(true);
    setCreateErrors({});
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name,
          tin,
          address,
          email,
          company,
          phone,
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
        setCreateErrors({});
        await fetchClients(currentPage, statusFilter);
      } else {
        if (response.status === 422 && data.errors) {
          setCreateErrors(data.errors);
        } else {
          setAlertMessage(data.message || 'Failed to create client');
        }
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
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (data.success) {
        setDeleteClientId(null);
        await fetchClients(currentPage, statusFilter);
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

  const handleActivateClient = async (client: Client) => {
    setIsActivating(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: client.name,
          tin: client.tin,
          address: client.address,
          email: client.email,
          company: client.company,
          phone: client.phone,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchClients(currentPage, statusFilter);
      } else {
        setAlertMessage(data.message || 'Failed to activate client');
      }
    } catch (error) {
      console.error('Activate client error:', error);
      setAlertMessage('Failed to activate client');
    } finally {
      setIsActivating(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();

  const filtered = clientsState.filter((client) => {
    if (statusFilter === 'inactive') {
      if (client.isActive !== false) return false;
    } else if (client.isActive === false) {
      return false;
    }
    const tinTerm = tinQuery.trim().toLowerCase();
    if (tinTerm) {
      const tinMatch = client.tin ? client.tin.toLowerCase().includes(tinTerm) : false;
      if (!tinMatch) return false;
    }

    if (!query) return true;

    const nameMatch = client.name.toLowerCase().includes(query);
    const companyMatch = (client.company || '').toLowerCase().includes(query);
    const emailMatch = client.email.toLowerCase().includes(query);

    return nameMatch || companyMatch || emailMatch;
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
    }

    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime; // newest first
  });

  // Pagination calculations (server-side)
  const totalPages = Math.max(1, pagination.last_page || 1);

  // Ensure current page is within bounds
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  const displayed = sorted;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Clients" />

      <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client relationships</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) {
              setCreateErrors({});
              setName('');
              setTin('');
              setAddress('');
              setEmail('');
              setCompany('');
              setPhone('');
            }
          }}>
            <DialogTrigger asChild>
              <Button>Add Client</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Client</DialogTitle>
                <DialogDescription>Add a new client to your account</DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Name</Label>
                  <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
                  {createErrors.name && (
                    <p className="text-sm text-destructive">{createErrors.name[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-tin">TIN</Label>
                  <Input id="client-tin" value={tin} onChange={(e) => setTin(e.target.value)} required autoComplete="off" />
                  {createErrors.tin && (
                    <p className="text-sm text-destructive">{createErrors.tin[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-address">Address</Label>
                  <Textarea id="client-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required autoComplete="off" />
                  {createErrors.address && (
                    <p className="text-sm text-destructive">{createErrors.address[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-email">Email</Label>
                  <Input id="client-email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
                  {createErrors.email && (
                    <p className="text-sm text-destructive">{createErrors.email[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-company">Company</Label>
                  <Input id="client-company" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="off" />
                  {createErrors.company && (
                    <p className="text-sm text-destructive">{createErrors.company[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Phone</Label>
                  <Input id="client-phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
                  {createErrors.phone && (
                    <p className="text-sm text-destructive">{createErrors.phone[0]}</p>
                  )}
                </div>

              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>Cancel</Button>
                <Button onClick={handleCreateClient} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Client'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Input
              placeholder="Search clients (by name)"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Input
              placeholder="Search clients by TIN"
              value={tinQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTinQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'active' | 'inactive')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className={`w-12 h-12 ${getAvatarColor(client.id)} rounded-full flex items-center justify-center text-card-foreground font-bold text-sm`}>{getInitials(client.name)}</div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-card-foreground truncate">{client.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{client.company}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex w-10 justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (client.isActive === false) {
                          setActivateClient(client);
                        } else {
                          setDeleteClientId(client.id);
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title={client.isActive === false ? 'Activate client' : 'Archive client'}
                      disabled={isActivating}
                    >
                      {client.isActive === false ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                    </button>
                  </div>
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
            Showing {displayed.length} of {pagination.total} clients — page {pagination.current_page} of {pagination.last_page}
          </div>

          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
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
                  Next
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteClientId !== null} onOpenChange={(open: boolean) => !open && setDeleteClientId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive this client?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteClient} disabled={isDeleting}>{isDeleting ? 'Archiving...' : 'Archive'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Activate Confirmation */}
        <AlertDialog open={activateClient !== null} onOpenChange={(open: boolean) => !open && setActivateClient(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activate Client</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to activate {activateClient?.name} again?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActivating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => activateClient && handleActivateClient(activateClient)}
                disabled={isActivating}
                className="bg-primary hover:bg-primary/90"
              >
                {isActivating ? 'Activating...' : 'Yes'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => setIsEditOpen(open)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {editClient?.name}</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Name</Label>
                <Input id="edit-client-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-client-tin">TIN</Label>
                <Input id="edit-client-tin" value={editTin} onChange={(e) => setEditTin(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-client-address">Address</Label>
                <Textarea id="edit-client-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows={3} />
              </div>

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