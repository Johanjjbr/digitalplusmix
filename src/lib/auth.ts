import { supabase } from './supabase';
import type { User } from './supabase';

// Simple authentication using localStorage (NOT FOR PRODUCTION - use Supabase Auth in production)
const CURRENT_USER_KEY = 'digitalplus_current_user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Hash simple (en producción usar bcrypt en el servidor)
async function simpleHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Buscar usuario por email
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;

      if (!users || users.length === 0) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const user = users[0];

      // Verificar contraseña (esto es simplificado, en producción usar bcrypt)
      const passwordHash = await simpleHash(credentials.password);
      
      // Para el usuario por defecto admin@digitalplus.com / admin123
      const isDefaultAdmin = 
        credentials.email === 'admin@digitalplus.com' && 
        credentials.password === 'admin123';

      if (!isDefaultAdmin && user.password_hash !== passwordHash) {
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // Actualizar último login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Guardar usuario en localStorage
      const userSession: User = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        last_login: new Date().toISOString(),
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));

      return { success: true, user: userSession };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Error al iniciar sesión' };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Get current user
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  // Check if user has role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  // Register new user
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    role?: 'admin' | 'user' | 'technician';
  }): Promise<AuthResponse> {
    try {
      const passwordHash = await simpleHash(data.password);

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email: data.email,
            password_hash: passwordHash,
            full_name: data.full_name,
            role: data.role || 'user',
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, user: newUser };
    } catch (error: any) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Error al registrar usuario' };
    }
  },
};
