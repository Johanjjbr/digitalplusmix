// Mock client data
export interface Client {
  id: string;
  name: string;
  ipAddress: string;
  poleNumber: string;
  neighborhood: string;
  planName: string;
  status: 'active' | 'suspended' | 'delinquent';
  email: string;
  phone: string;
  address: string;
  connectionStatus: 'online' | 'offline';
  monthlyFee: number;
  joinDate: string;
}

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    ipAddress: '192.168.1.100',
    poleNumber: 'P-1234',
    neighborhood: 'Centro',
    planName: '100 Mbps + TV',
    status: 'active',
    email: 'juan.perez@email.com',
    phone: '+1 555-0123',
    address: 'Calle Principal 123, Centro',
    connectionStatus: 'online',
    monthlyFee: 49.99,
    joinDate: '2023-01-15',
  },
  {
    id: '2',
    name: 'María González',
    ipAddress: '192.168.1.101',
    poleNumber: 'P-1235',
    neighborhood: 'Norte',
    planName: '50 Mbps',
    status: 'delinquent',
    email: 'maria.gonzalez@email.com',
    phone: '+1 555-0124',
    address: 'Avenida Norte 456, Norte',
    connectionStatus: 'offline',
    monthlyFee: 29.99,
    joinDate: '2023-03-20',
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    ipAddress: '192.168.1.102',
    poleNumber: 'P-1236',
    neighborhood: 'Sur',
    planName: '200 Mbps + TV Premium',
    status: 'active',
    email: 'carlos.rodriguez@email.com',
    phone: '+1 555-0125',
    address: 'Calle Sur 789, Sur',
    connectionStatus: 'online',
    monthlyFee: 79.99,
    joinDate: '2022-11-10',
  },
  {
    id: '4',
    name: 'Ana Martínez',
    ipAddress: '192.168.1.103',
    poleNumber: 'P-1237',
    neighborhood: 'Centro',
    planName: '100 Mbps',
    status: 'active',
    email: 'ana.martinez@email.com',
    phone: '+1 555-0126',
    address: 'Plaza Central 234, Centro',
    connectionStatus: 'online',
    monthlyFee: 39.99,
    joinDate: '2023-05-05',
  },
  {
    id: '5',
    name: 'Roberto Silva',
    ipAddress: '192.168.1.104',
    poleNumber: 'P-1238',
    neighborhood: 'Este',
    planName: '50 Mbps + TV',
    status: 'suspended',
    email: 'roberto.silva@email.com',
    phone: '+1 555-0127',
    address: 'Barrio Este 567, Este',
    connectionStatus: 'offline',
    monthlyFee: 44.99,
    joinDate: '2023-02-28',
  },
  {
    id: '6',
    name: 'Laura Fernández',
    ipAddress: '192.168.1.105',
    poleNumber: 'P-1239',
    neighborhood: 'Norte',
    planName: '100 Mbps + TV',
    status: 'active',
    email: 'laura.fernandez@email.com',
    phone: '+1 555-0128',
    address: 'Zona Norte 890, Norte',
    connectionStatus: 'online',
    monthlyFee: 49.99,
    joinDate: '2023-06-12',
  },
  {
    id: '7',
    name: 'Diego Torres',
    ipAddress: '192.168.1.106',
    poleNumber: 'P-1240',
    neighborhood: 'Sur',
    planName: '200 Mbps',
    status: 'active',
    email: 'diego.torres@email.com',
    phone: '+1 555-0129',
    address: 'Sector Sur 321, Sur',
    connectionStatus: 'online',
    monthlyFee: 69.99,
    joinDate: '2022-08-22',
  },
  {
    id: '8',
    name: 'Patricia López',
    ipAddress: '192.168.1.107',
    poleNumber: 'P-1241',
    neighborhood: 'Centro',
    planName: '50 Mbps',
    status: 'delinquent',
    email: 'patricia.lopez@email.com',
    phone: '+1 555-0130',
    address: 'Centro Histórico 654, Centro',
    connectionStatus: 'offline',
    monthlyFee: 29.99,
    joinDate: '2023-04-18',
  },
];

export interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

export const mockBillingHistory: Record<string, BillingRecord[]> = {
  '1': [
    { id: 'inv-001', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 49.99, status: 'paid' },
    { id: 'inv-002', date: '2025-12-01', description: 'Servicio Mensual - Diciembre 2025', amount: 49.99, status: 'paid' },
    { id: 'inv-003', date: '2025-11-01', description: 'Servicio Mensual - Noviembre 2025', amount: 49.99, status: 'paid' },
  ],
  '2': [
    { id: 'inv-004', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 29.99, status: 'overdue' },
    { id: 'inv-005', date: '2025-12-01', description: 'Servicio Mensual - Diciembre 2025', amount: 29.99, status: 'overdue' },
    { id: 'inv-006', date: '2025-11-01', description: 'Servicio Mensual - Noviembre 2025', amount: 29.99, status: 'paid' },
  ],
  '3': [
    { id: 'inv-007', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 79.99, status: 'paid' },
    { id: 'inv-008', date: '2025-12-01', description: 'Servicio Mensual - Diciembre 2025', amount: 79.99, status: 'paid' },
    { id: 'inv-009', date: '2025-11-01', description: 'Servicio Mensual - Noviembre 2025', amount: 79.99, status: 'paid' },
  ],
  '4': [
    { id: 'inv-010', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 39.99, status: 'paid' },
    { id: 'inv-011', date: '2025-12-01', description: 'Servicio Mensual - Diciembre 2025', amount: 39.99, status: 'paid' },
  ],
  '5': [
    { id: 'inv-012', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 44.99, status: 'pending' },
    { id: 'inv-013', date: '2025-12-01', description: 'Servicio Mensual - Diciembre 2025', amount: 44.99, status: 'overdue' },
  ],
  '6': [
    { id: 'inv-014', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 49.99, status: 'paid' },
  ],
  '7': [
    { id: 'inv-015', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 69.99, status: 'paid' },
    { id: 'inv-016', date: '2025-12-01', description: 'Servicio Mensual - Diciembre 2025', amount: 69.99, status: 'paid' },
  ],
  '8': [
    { id: 'inv-017', date: '2026-01-01', description: 'Servicio Mensual - Enero 2026', amount: 29.99, status: 'overdue' },
  ],
};
