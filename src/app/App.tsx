import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { initializeSampleData } from '@/lib/initData';
import { authService } from '@/lib/auth';
import { Sidebar } from '@/app/components/Sidebar';
import { Dashboard } from '@/app/components/Dashboard';
import { Clients } from '@/app/components/Clients';
import { ClientDetail } from '@/app/components/ClientDetail';
import { Plans } from '@/app/components/Plans';
import { Billing } from '@/app/components/Billing';
import { InvoiceDetail } from '@/app/components/InvoiceDetail';
import { Tickets } from '@/app/components/Tickets';
import { TicketDetail } from '@/app/components/TicketDetail';
import { NetworkMap } from '@/app/components/NetworkMap';
import { Zones } from '@/app/components/Zones';
import { Settings } from '@/app/components/Settings';
import { AuditLogs } from '@/app/components/AuditLogs';
import { Login } from '@/app/components/Login';

// Lazy load para componentes nuevos
import { lazy, Suspense } from 'react';
const Users = lazy(() => import('@/app/components/Users').then(module => ({ default: module.Users })));
const DailyReport = lazy(() => import('@/app/components/DailyReport').then(module => ({ default: module.DailyReport })));

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Loading component
function LoadingScreen() {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-gray-600">Cargando...</div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleData();
    
    // Check authentication status
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/daily-report" replace />} />
                      <Route path="/daily-report" element={<DailyReport />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/clients/:id" element={<ClientDetail />} />
                      <Route path="/plans" element={<Plans />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="/billing/:id" element={<InvoiceDetail />} />
                      <Route path="/tickets" element={<Tickets />} />
                      <Route path="/tickets/:id" element={<TicketDetail />} />
                      <Route path="/network-map" element={<NetworkMap />} />
                      <Route path="/zones" element={<Zones />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/logs" element={<AuditLogs />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
