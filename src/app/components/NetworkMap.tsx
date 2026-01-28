import { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapPin, Activity, AlertTriangle, Navigation, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { clientsAPI } from '@/lib/api';
import { zonesAPI } from '@/lib/api-tickets-zones';

// ⚠️ IMPORTANTE: Coloca tu Google Maps API Key aquí
// Para obtener una API key, visita: https://console.cloud.google.com/google/maps-apis/
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

interface Client {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'suspended' | 'delinquent';
  planName: string;
  ipAddress: string;
  neighborhood: string;
  connectionStatus: 'online' | 'offline';
}

interface Zone {
  id: string;
  name: string;
  description: string;
  color: string;
  centerLatitude: number;
  centerLongitude: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: -12.046374, // Lima, Peru
  lng: -77.042793,
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];

export function NetworkMap() {
  const [clients, setClients] = useState<Client[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsResponse, zonesResponse] = await Promise.all([
        clientsAPI.getAll(),
        zonesAPI.getAll(),
      ]);

      // Filtrar solo clientes con coordenadas
      const clientsWithCoords = (clientsResponse.clients || []).filter(
        (c: any) => c.latitude && c.longitude
      );

      setClients(clientsWithCoords);
      setZones(zonesResponse.zones || []);

      // Si hay clientes, centrar en el primero
      if (clientsWithCoords.length > 0) {
        const firstClient = clientsWithCoords[0];
        setMapCenter({
          lat: firstClient.latitude,
          lng: firstClient.longitude,
        });
      } else if (zonesResponse.zones && zonesResponse.zones.length > 0) {
        const firstZone = zonesResponse.zones[0];
        if (firstZone.centerLatitude && firstZone.centerLongitude) {
          setMapCenter({
            lat: firstZone.centerLatitude,
            lng: firstZone.centerLongitude,
          });
        }
      }
    } catch (error) {
      console.error('Error loading map data:', error);
      toast.error('Error al cargar los datos del mapa');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerIcon = (status: string) => {
    const baseUrl = 'http://maps.google.com/mapfiles/ms/icons/';
    switch (status) {
      case 'active':
        return `${baseUrl}green-dot.png`;
      case 'delinquent':
        return `${baseUrl}red-dot.png`;
      case 'suspended':
        return `${baseUrl}orange-dot.png`;
      default:
        return `${baseUrl}green-dot.png`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Al día</Badge>;
      case 'delinquent':
        return <Badge className="bg-red-500">Moroso</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500">Suspendido</Badge>;
    }
  };

  const getConnectionBadge = (status: string) => {
    return status === 'online' ? (
      <Badge className="bg-blue-500">En línea</Badge>
    ) : (
      <Badge variant="outline">Desconectado</Badge>
    );
  };

  const calculateStats = () => {
    return {
      total: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      delinquent: clients.filter((c) => c.status === 'delinquent').length,
      online: clients.filter((c) => c.connectionStatus === 'online').length,
    };
  };

  const stats = calculateStats();

  if (loadError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error al cargar Google Maps</h2>
          <p className="text-red-600 mb-4">
            Por favor verifica que tu API Key de Google Maps sea válida.
          </p>
          <p className="text-sm text-gray-600">
            La API Key debe configurarse en: <code className="bg-gray-100 px-2 py-1 rounded">/src/app/components/NetworkMap.tsx</code>
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando mapa...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Mapa de Red</h1>
          <p className="text-gray-600">Visualización geográfica de clientes y zonas</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowZones(!showZones)}
          className="flex items-center gap-2"
        >
          <Layers className="w-4 h-4" />
          {showZones ? 'Ocultar' : 'Mostrar'} Zonas
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clientes</CardTitle>
            <MapPin className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Activos</CardTitle>
            <Activity className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Morosos</CardTitle>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{stats.delinquent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Línea</CardTitle>
            <Navigation className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{stats.online}</div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa Interactivo</CardTitle>
          {GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Configuración requerida:</strong> Debes agregar tu Google Maps API Key en el archivo{' '}
                <code className="bg-yellow-100 px-2 py-1 rounded">/src/app/components/NetworkMap.tsx</code>
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            {clients.length === 0 ? (
              <div className="flex h-[600px] items-center justify-center bg-gray-100 text-gray-500">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay clientes con coordenadas GPS registradas</p>
                  <p className="text-sm mt-2">
                    Agrega coordenadas a los clientes para verlos en el mapa
                  </p>
                </div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={13}
                center={mapCenter}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                }}
              >
                {/* Zonas */}
                {showZones &&
                  zones.map((zone) => {
                    if (!zone.centerLatitude || !zone.centerLongitude) return null;
                    return (
                      <Circle
                        key={zone.id}
                        center={{
                          lat: zone.centerLatitude,
                          lng: zone.centerLongitude,
                        }}
                        radius={1000}
                        options={{
                          strokeColor: zone.color,
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                          fillColor: zone.color,
                          fillOpacity: 0.15,
                        }}
                      />
                    );
                  })}

                {/* Clientes */}
                {clients.map((client) => (
                  <Marker
                    key={client.id}
                    position={{
                      lat: client.latitude,
                      lng: client.longitude,
                    }}
                    icon={{
                      url: getMarkerIcon(client.status),
                      scaledSize: new window.google.maps.Size(32, 32),
                    }}
                    onClick={() => setSelectedClient(client)}
                  />
                ))}

                {/* InfoWindow para el cliente seleccionado */}
                {selectedClient && (
                  <InfoWindow
                    position={{
                      lat: selectedClient.latitude,
                      lng: selectedClient.longitude,
                    }}
                    onCloseClick={() => setSelectedClient(null)}
                  >
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-lg mb-2">{selectedClient.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Estado:</span>
                          {getStatusBadge(selectedClient.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Conexión:</span>
                          {getConnectionBadge(selectedClient.connectionStatus)}
                        </div>
                        <div>
                          <span className="text-gray-600">Plan:</span>
                          <p className="font-medium">{selectedClient.planName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">IP:</span>
                          <p className="font-mono text-xs">{selectedClient.ipAddress}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Barrio:</span>
                          <p className="font-medium">{selectedClient.neighborhood}</p>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.open(`/clients/${selectedClient.id}`, '_blank')}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
