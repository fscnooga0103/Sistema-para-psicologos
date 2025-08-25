import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Separator } from "./components/ui/separator";
import { ScrollArea } from "./components/ui/scroll-area";
import AnamnesisForm from "./components/AnamnesisForm";
import { 
  Users, 
  UserPlus, 
  Building, 
  FileText, 
  ClipboardList, 
  Stethoscope,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Globe,
  Settings,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Lock,
  CheckCircle,
  Progress,
  ChevronLeft,
  ChevronRight,
  Save,
  User,
  Heart,
  Brain,
  Activity,
  MessageSquare,
  Utensils,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Home
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Language Context
const LanguageContext = createContext();

const translations = {
  en: {
    dashboard: "Dashboard",
    patients: "Patients",
    schedule: "Schedule",
    appointments: "Appointments",
    sessions: "Sessions",
    finances: "Finances",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome to Psychology Portal",
    total: "Total",
    active: "Active",
    thisMonth: "This Month"
  },
  es: {
    dashboard: "Panel Principal",
    patients: "Pacientes",
    schedule: "Agenda",
    appointments: "Citas",
    sessions: "Sesiones",
    finances: "Finanzas",
    settings: "Configuración",
    logout: "Cerrar Sesión",
    welcome: "Bienvenido al Portal de Psicología",
    total: "Total",
    active: "Activos",
    thisMonth: "Este Mes"
  }
};

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Authentication Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching current user:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          console.warn('Token expired, logging out...');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Role-specific menu items
const getMenuItems = (user) => {
  const baseItems = [
    { icon: FileText, label: "Dashboard", view: "dashboard" }
  ];

  if (user?.role === 'super_admin') {
    return [
      ...baseItems,
      { icon: Building, label: "Centros", view: "centers" },
      { icon: UserPlus, label: "Usuarios", view: "users" },
      { icon: Users, label: "Psicólogos", view: "psychologists" },
      { icon: Settings, label: "Configuración", view: "settings" }
    ];
  } else if (user?.role === 'center_admin') {
    return [
      ...baseItems,
      { icon: Users, label: "Psicólogos", view: "psychologists" },
      { icon: UserPlus, label: "Pacientes", view: "patients" },
      { icon: Calendar, label: "Agenda", view: "schedule" },
      { icon: TrendingUp, label: "Sesiones", view: "sessions" },
      { icon: DollarSign, label: "Finanzas", view: "finances" },
      { icon: Settings, label: "Configuración", view: "settings" }
    ];
  } else if (user?.role === 'psychologist') {
    return [
      ...baseItems,
      { icon: Users, label: "Mis Pacientes", view: "patients" },
      { icon: Calendar, label: "Agenda", view: "schedule" },
      { icon: TrendingUp, label: "Sesiones", view: "sessions" },
      { icon: DollarSign, label: "Finanzas", view: "finances" },
      { icon: Settings, label: "Configuración", view: "settings" }
    ];
  } else {
    return baseItems;
  }
};

// Login Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Gestión Psicológica
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión para acceder
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </div>

          <div className="flex items-center justify-center">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    appointmentsToday: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [patientsResponse, appointmentsResponse, paymentsResponse] = await Promise.all([
        axios.get(`${API}/patients`).catch(() => ({ data: [] })),
        axios.get(`${API}/appointments?start_date=${new Date().toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`).catch(() => ({ data: [] })),
        axios.get(`${API}/payments/stats`).catch(() => ({ data: { monthly_total: 0 } }))
      ]);
      
      const patients = patientsResponse.data;
      const todayAppointments = appointmentsResponse.data;
      const paymentStats = paymentsResponse.data;
      
      setStats({
        totalPatients: patients.length,
        activePatients: patients.filter(p => p.is_active).length,
        appointmentsToday: todayAppointments.length,
        monthlyRevenue: paymentStats.monthly_total || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getRoleBasedContent = () => {
    if (user?.role === 'super_admin') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('centers')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Centros Activos</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('psychologists')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Psicólogos</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('settings')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Configuración</p>
                  <p className="text-2xl font-bold text-gray-900">Sistema</p>
                </div>
                <Settings className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('patients')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.total} {t.patients}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('patients')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t.active} {t.patients}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activePatients}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('schedule')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Citas de Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('finances')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'super_admin' ? 'Administrador General' :
             user?.role === 'center_admin' ? 'Administrador de Centro' : 'Psicólogo'}
          </p>
        </div>
      </div>

      {getRoleBasedContent()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {user?.role === 'super_admin' ? (
                <>
                  <Button variant="outline" className="h-16" onClick={() => onNavigate('centers')}>
                    <Building className="h-6 w-6 mb-2 block" />
                    Gestionar Centros
                  </Button>
                  <Button variant="outline" className="h-16" onClick={() => onNavigate('users')}>
                    <UserPlus className="h-6 w-6 mb-2 block" />
                    Gestionar Usuarios
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="h-16" onClick={() => onNavigate('patients')}>
                    <Users className="h-6 w-6 mb-2 block" />
                    Gestionar Pacientes
                  </Button>
                  <Button variant="outline" className="h-16" onClick={() => onNavigate('schedule')}>
                    <Calendar className="h-6 w-6 mb-2 block" />
                    Ver Agenda
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base de Datos:</span>
                <Badge variant="default">Conectada</Badge>
              </div>
              <div className="flex justify-between">
                <span>Última Sincronización:</span>
                <span className="text-sm text-gray-500">Hace 2 minutos</span>
              </div>
              <div className="flex justify-between">
                <span>Tu Contexto:</span>
                <Badge variant="secondary">
                  {user?.role === 'psychologist' ? 'Privado' : 
                   user?.role === 'center_admin' ? 'Centro' : 'Global'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Simplified Patient Management
const PatientManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Cargando pacientes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'psychologist' ? 'Mis Pacientes' : 'Gestión de Pacientes'}
        </h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                </div>
                <Badge variant={patient.is_active ? "default" : "secondary"}>
                  {patient.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Tipo:</strong> {patient.patient_type === 'individual' ? 'Individual' : 'Compartido'}
                </p>
                {patient.phone && (
                  <p className="text-sm text-gray-600">
                    <strong>Teléfono:</strong> {patient.phone}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-1" />
                  Historia Clínica
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pacientes registrados</h3>
            <p className="text-gray-500 mb-4">Agrega tu primer paciente para comenzar</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Paciente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Coming Soon Component
const ComingSoon = ({ title }) => (
  <div className="p-6">
    <Card>
      <CardContent className="p-12 text-center">
        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500">Esta funcionalidad estará disponible próximamente</p>
      </CardContent>
    </Card>
  </div>
);

// Sidebar Component
const Sidebar = ({ isOpen, onClose, currentView, onViewChange, user }) => {
  const menuItems = getMenuItems(user);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <h2 className="text-xl font-bold">PsySystem</h2>
          <Button variant="ghost" size="sm" className="lg:hidden text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-4">
          {menuItems.map((item) => (
            <Button
              key={item.view}
              variant={currentView === item.view ? "secondary" : "ghost"}
              className="w-full justify-start mb-2 text-white hover:bg-white/10"
              onClick={() => onViewChange(item.view)}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-300 truncate">
                  {user?.role === 'super_admin' ? 'Super Admin' :
                   user?.role === 'center_admin' ? 'Admin Centro' : 'Psicólogo'}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full mt-2 text-white hover:bg-red-600"
            onClick={() => {
              const { logout } = useAuth();
              logout();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  );
};

// Main App Component
const MainApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const renderView = () => {
    switch (currentView) {
      case 'patients':
        return <PatientManagement />;
      case 'centers':
        return <ComingSoon title="Gestión de Centros" />;
      case 'users':
        return <ComingSoon title="Gestión de Usuarios" />;
      case 'psychologists':
        return <PatientManagement />; // Reuse for now
      case 'schedule':
        return <ComingSoon title="Agenda" />;
      case 'sessions':
        return <ComingSoon title="Sesiones" />;
      case 'finances':
        return <ComingSoon title="Finanzas" />;
      case 'settings':
        return <ComingSoon title="Configuración" />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">PsySystem</h1>
            <div className="w-8"></div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [language, setLanguage] = useState('es');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <AuthConsumer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageContext.Provider>
  );
};

const AuthConsumer = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/*" element={isAuthenticated ? <MainApp /> : <Navigate to="/login" />} />
    </Routes>
  );
};

export default App;