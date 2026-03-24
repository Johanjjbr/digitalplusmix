import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Edit, Trash2, Plus, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { clientsAPI, plansAPI } from '@/lib/api';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { ClientFormDialog, type ClientFormData } from '@/app/components/ClientFormDialog';

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
  documentNumber?: string;
  zoneId?: string;
  zoneName?: string;
}

export function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Array<{ name: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsResponse, plansResponse] = await Promise.all([
        clientsAPI.getAll(),
        plansAPI.getAll(),
      ]);
      setClients(clientsResponse.clients || []);
      setPlans(plansResponse.plans || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const neighborhoods = ['all', ...Array.from(new Set(clients.map((c) => c.neighborhood).filter(Boolean)))];

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.ipAddress || '').includes(searchTerm) ||
      (client.poleNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.neighborhood || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.planName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.documentNumber && client.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNeighborhood =
      neighborhoodFilter === 'all' || client.neighborhood === neighborhoodFilter;

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesNeighborhood && matchesStatus;
  });

  const handleAddClient = async (data: ClientFormData) => {
    try {
      await clientsAPI.create(data);
      toast.success('Cliente creado exitosamente');
      setIsAddDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error creating client:', error);
      
      // Manejar error de email duplicado
      if (error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('clients_email_key')) {
        toast.error('El email ya está registrado. Por favor usa otro email.');
      } else if (error?.message) {
        toast.error(`Error al crear el cliente: ${error.message}`);
      } else {
        toast.error('Error al crear el cliente');
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await clientsAPI.delete(clientToDelete);
      toast.success('Cliente eliminado exitosamente');
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Al día</Badge>;
      case 'delinquent':
        return <Badge className="bg-red-500 hover:bg-red-600">Moroso</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Suspendido</Badge>;
    }
  };

  const exportToExcel = () => {
    // Preparar los datos para exportar con solo los campos relevantes
    const dataToExport = filteredClients.map(client => ({
      'Nro Cliente': client.poleNumber,
      'Nombre': client.name,
      'Documento': client.documentNumber || '',
      'Email': client.email,
      'Teléfono': client.phone,
      'Dirección': client.address,
      'Barrio': client.neighborhood,
      'IP': client.ipAddress,
      'Plan': client.planName,
      'Cuota Mensual': client.monthlyFee,
      'Estado': client.status === 'active' ? 'Al día' : 
                client.status === 'delinquent' ? 'Moroso' : 'Suspendido',
      'Estado Conexión': client.connectionStatus === 'online' ? 'En línea' : 'Fuera de línea',
      'Zona': client.zoneName || '',
      'Fecha de Ingreso': new Date(client.joinDate).toLocaleDateString('es-ES'),
    }));

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    
    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 12 }, // Nro Cliente
      { wch: 25 }, // Nombre
      { wch: 15 }, // Documento
      { wch: 25 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 30 }, // Dirección
      { wch: 20 }, // Barrio
      { wch: 15 }, // IP
      { wch: 20 }, // Plan
      { wch: 15 }, // Cuota Mensual
      { wch: 12 }, // Estado
      { wch: 15 }, // Estado Conexión
      { wch: 15 }, // Zona
      { wch: 15 }, // Fecha de Ingreso
    ];
    worksheet['!cols'] = columnWidths;

    // Generar el nombre del archivo con fecha y filtros aplicados
    const today = new Date().toISOString().split('T')[0];
    let fileName = `clientes_${today}`;
    
    if (neighborhoodFilter !== 'all') {
      fileName += `_${neighborhoodFilter}`;
    }
    if (statusFilter !== 'all') {
      fileName += `_${statusFilter}`;
    }
    if (searchTerm) {
      fileName += '_filtrado';
    }
    
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast.success(`${filteredClients.length} cliente(s) exportado(s) a Excel`);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra todos los clientes y sus servicios</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar cliente (nombre, dirección, IP, poste, barrio, plan, documento)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-[200px]">
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Barrio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Barrios</SelectItem>
                {neighborhoods.filter((n) => n !== 'all').map((neighborhood) => (
                  <SelectItem key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="active">Al día</SelectItem>
                <SelectItem value="delinquent">Moroso</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50">
              <TableHead className="font-semibold text-gray-900 w-[80px]">Nro cliente</TableHead>
              <TableHead className="font-semibold text-gray-900 w-[180px]">Nombre</TableHead>
              <TableHead className="font-semibold text-gray-900 w-[200px]">Dirección</TableHead>
              <TableHead className="font-semibold text-gray-900 w-[120px]">Documento</TableHead>
              <TableHead className="font-semibold text-gray-900 w-[140px]">Plan</TableHead>
              <TableHead className="font-semibold text-gray-900 w-[100px]">Estado</TableHead>
              <TableHead className="font-semibold text-gray-900 text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}>
                  <TableCell className="text-sm max-w-[80px]">
                    <div className="truncate" title={client.poleNumber}>
                      {client.poleNumber}
                    </div>
                  </TableCell> 
                  <TableCell className="text-sm max-w-[150px]">
                    <div className="truncate" title={client.name}>
                      {client.name}
                    </div>
                  </TableCell> 
                  <TableCell className="text-sm max-w-[150px]">
                    <div className="truncate" title={client.address}>
                      {client.address}
                    </div>
                  </TableCell>     
                  <TableCell className="text-sm max-w-[150px]">
                    <div className="truncate" title={client.documentNumber}>
                      {client.documentNumber}
                    </div>
                  </TableCell> 
                  <TableCell>{client.planName}</TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${client.id}`);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(client.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
        <Button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar a Excel
        </Button>
      </div>

      <ClientFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddClient}
        title="Agregar Nuevo Cliente"
        plans={plans}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}