import { useState, useEffect } from 'react';
import { Activity, Users, DollarSign, TrendingUp } from 'lucide-react';
import { clientsAPI, invoicesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    monthlyRevenue: 0,
    growthRate: 0,
    activePercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsResponse, invoicesResponse] = await Promise.all([
        clientsAPI.getAll(),
        invoicesAPI.getAll(),
      ]);

      const clients = clientsResponse.clients || [];
      const invoices = invoicesResponse.invoices || [];

      const totalClients = clients.length;
      const activeClients = clients.filter(
        (c: any) => c.status === 'active' && c.connectionStatus === 'online'
      ).length;

      const monthlyRevenue = clients.reduce((sum: number, c: any) => sum + (c.monthlyFee || 0), 0);

      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();

      const thisMonthInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear;
      });

      const thisMonthRevenue = thisMonthInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.amount, 0);

      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      const lastMonthInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
      });

      const lastMonthRevenue = lastMonthInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.amount, 0);

      const growthRate =
        lastMonthRevenue > 0
          ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      const activePercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;

      setStats({
        totalClients,
        activeClients,
        monthlyRevenue,
        growthRate,
        activePercentage,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: 'Total Clientes',
      value: stats.totalClients.toString(),
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Clientes Activos',
      value: stats.activeClients.toString(),
      change: `${stats.activePercentage.toFixed(0)}%`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Ingresos Mensuales',
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      change: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Tasa de Crecimiento',
      value: `${stats.growthRate.toFixed(1)}%`,
      change: `${stats.growthRate > 0 ? '+' : ''}${(stats.growthRate / 3).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">{stat.change} desde el mes pasado</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Sistema conectado a Supabase</p>
                  <p className="text-xs text-gray-500">Base de datos en tiempo real activa</p>
                </div>
                <span className="text-xs text-gray-400">Ahora</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Total clientes registrados</p>
                  <p className="text-xs text-gray-500">{stats.totalClients} clientes en el sistema</p>
                </div>
                <span className="text-xs text-gray-400">Ahora</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ingresos mensuales estimados</p>
                  <p className="text-xs text-gray-500">${stats.monthlyRevenue.toFixed(2)}</p>
                </div>
                <span className="text-xs text-gray-400">Ahora</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de la Red</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ancho de banda utilizado</span>
                <span className="text-sm font-medium">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }} />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">Conexiones activas</span>
                <span className="text-sm font-medium">
                  {stats.activeClients} / {stats.totalClients}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${stats.activePercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-600">Uptime del servidor</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
