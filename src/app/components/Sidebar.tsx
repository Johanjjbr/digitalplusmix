import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, Users, PackageIcon, CreditCard, Map, Settings, LogOut, User, Ticket, FileText, MapPinned } from 'lucide-react';
import { authService } from '@/lib/auth';
import { Button } from '@/app/components/ui/button';

export function Sidebar() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clientes', icon: Users },
    { to: '/plans', label: 'Planes', icon: PackageIcon },
    { to: '/billing', label: 'Facturación', icon: CreditCard },
    { to: '/tickets', label: 'Tickets', icon: Ticket },
    { to: '/network-map', label: 'Mapa de Red', icon: Map },
    { to: '/zones', label: 'Zonas', icon: MapPinned },
    { to: '/logs', label: 'Logs', icon: FileText },
    { to: '/settings', label: 'Configuración', icon: Settings },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-xl font-semibold">Digital+</h1>
        <p className="text-sm text-blue-200 mt-1">TV & Internet Service</p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-100 hover:bg-blue-800/50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-blue-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser?.full_name || 'Usuario'}</p>
            <p className="text-xs text-blue-300 truncate">{currentUser?.email || 'No autenticado'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full text-blue-100 hover:bg-blue-800/50 hover:text-white justify-start"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}