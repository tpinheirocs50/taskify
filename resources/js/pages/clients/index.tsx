import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { clients } from '@/data';
import { Trash2, Mail, Phone, MapPin } from 'lucide-react';

type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
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
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleDeleteClient = (id: number) => {
    // TODO: Implement delete functionality
    console.log('Delete client:', id);
  };

  const filteredClients = clientsList.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Clients" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client relationships</p>
          </div>

          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-xs">
            + Add Client
          </button>
        </div>

        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-card text-card-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-30"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-card text-card-foreground shadow-sm border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${getAvatarColor(client.id)} rounded-full flex items-center justify-center text-card-foreground font-bold text-sm`}>
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClient(client.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Delete client"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail size={16} className="text-muted-foreground/60" />
                  <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors">
                    {client.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={16} className="text-muted-foreground/60" />
                  <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors">
                    {client.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} className="text-muted-foreground/60" />
                  <span>{client.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}