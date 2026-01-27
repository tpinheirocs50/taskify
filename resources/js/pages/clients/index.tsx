import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { clients } from '@/data';

type Client = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
};

const dummyClients: Client[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    company: 'Acme Corp',
    email: 'sarah@acmecorp.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
  },
  {
    id: 2,
    name: 'Michael Chen',
    company: 'TechStart Inc',
    email: 'michael@techstart.io',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
  },
  {
    id: 3,
    name: 'Emily Davis',
    company: 'Design Co',
    email: 'emily@designco.com',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
  },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Clients',
    href: clients().url,
  },
];

export default function Clients() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Clients" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-gray-600 mt-1">Manage your client relationships</p>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Client
          </button>
        </div>

        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyClients.map((client) => (
            <div key={client.id} className="bg-white shadow rounded p-4">
              <div className="text-xl font-semibold">{client.name}</div>
              <div className="text-sm text-gray-600">{client.company}</div>

              <div className="mt-2 text-sm">
                <p>Email: {client.email}</p>
                <p>Phone: {client.phone}</p>
                <p>Location: {client.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}