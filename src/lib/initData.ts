import { clientsAPI, plansAPI, invoicesAPI } from './api';

export async function initializeSampleData() {
  try {
    // Check if we already have data
    const clientsResponse = await clientsAPI.getAll();
    if (clientsResponse.clients && clientsResponse.clients.length > 0) {
      console.log('Data already initialized');
      return;
    }

    // Initialize plans first
    const samplePlans = [
      {
        name: '50 Mbps',
        price: 29.99,
        features: ['50 Mbps de descarga', '10 Mbps de subida', 'Soporte 24/7'],
      },
      {
        name: '50 Mbps + TV',
        price: 44.99,
        features: ['50 Mbps de descarga', '10 Mbps de subida', 'TV Básica (80+ canales)', 'Soporte 24/7'],
        popular: true,
      },
      {
        name: '100 Mbps',
        price: 39.99,
        features: ['100 Mbps de descarga', '20 Mbps de subida', 'Soporte 24/7'],
      },
      {
        name: '100 Mbps + TV',
        price: 49.99,
        features: ['100 Mbps de descarga', '20 Mbps de subida', 'TV Estándar (120+ canales)', 'Soporte 24/7'],
        popular: true,
      },
      {
        name: '200 Mbps',
        price: 69.99,
        features: ['200 Mbps de descarga', '40 Mbps de subida', 'Router de alta gama', 'Soporte prioritario'],
      },
      {
        name: '200 Mbps + TV Premium',
        price: 79.99,
        features: [
          '200 Mbps de descarga',
          '40 Mbps de subida',
          'TV Premium (180+ canales)',
          'HBO, Netflix incluido',
          'Router de alta gama',
          'Soporte prioritario',
        ],
      },
    ];

    console.log('Creating plans...');
    for (const plan of samplePlans) {
      await plansAPI.create(plan);
    }

    // Initialize sample clients
    const sampleClients = [
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
    ];

    console.log('Creating clients...');
    const createdClients = [];
    for (const client of sampleClients) {
      const response = await clientsAPI.create(client);
      createdClients.push(response.client);
    }

    // Initialize sample invoices
    console.log('Creating invoices...');
    const months = ['Enero', 'Diciembre', 'Noviembre'];
    const dates = ['2026-01-01', '2025-12-01', '2025-11-01'];

    for (let i = 0; i < Math.min(3, createdClients.length); i++) {
      const client = createdClients[i];
      for (let j = 0; j < 3; j++) {
        const status = client.status === 'delinquent' && j === 0 ? 'overdue' : 'paid';
        await invoicesAPI.create({
          clientId: client.id,
          clientName: client.name,
          description: `Servicio Mensual - ${months[j]} ${j === 0 ? '2026' : '2025'}`,
          amount: client.monthlyFee,
          status,
        });
      }
    }

    console.log('Sample data initialized successfully!');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}
