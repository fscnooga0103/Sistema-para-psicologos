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
  Gamepad2
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Language Context
const LanguageContext = createContext();

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    patients: "Patients",
    schedule: "Schedule",
    finances: "Finances",
    settings: "Settings",
    logout: "Logout",
    
    // Auth
    login: "Login",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    role: "Role",
    center: "Center",
    welcome: "Welcome",
    
    // Patient Management
    addPatient: "Add Patient",
    patientList: "Patient List",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    address: "Address",
    
    // Clinical
    clinicalHistory: "Clinical History",
    evaluations: "Evaluations",
    diagnosis: "Diagnosis",
    progressNotes: "Progress Notes",
    chiefComplaint: "Chief Complaint",
    historyOfPresentIllness: "History of Present Illness",
    pastMedicalHistory: "Past Medical History",
    familyHistory: "Family History",
    socialHistory: "Social History",
    
    // Actions
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    add: "Add",
    
    // Status
    active: "Active",
    inactive: "Inactive",
    total: "Total",
    thisMonth: "This Month",
    
    // Roles
    superAdmin: "Super Admin",
    centerAdmin: "Center Admin",
    psychologist: "Psychologist"
  },
  es: {
    // Navigation
    dashboard: "Panel de Control",
    patients: "Pacientes",
    schedule: "Agenda",
    finances: "Finanzas",
    settings: "Configuración",
    logout: "Cerrar Sesión",
    
    // Auth
    login: "Iniciar Sesión",
    email: "Correo Electrónico",
    password: "Contraseña",
    fullName: "Nombre Completo",
    role: "Rol",
    center: "Centro",
    welcome: "Bienvenido",
    
    // Patient Management
    addPatient: "Agregar Paciente",
    patientList: "Lista de Pacientes",
    firstName: "Nombre",
    lastName: "Apellido",
    phone: "Teléfono",
    dateOfBirth: "Fecha de Nacimiento",
    gender: "Género",
    address: "Dirección",
    
    // Clinical
    clinicalHistory: "Historia Clínica",
    evaluations: "Evaluaciones",
    diagnosis: "Diagnóstico",
    progressNotes: "Notas de Progreso",
    chiefComplaint: "Motivo de Consulta",
    historyOfPresentIllness: "Historia de Enfermedad Actual",
    pastMedicalHistory: "Antecedentes Médicos",
    familyHistory: "Antecedentes Familiares",
    socialHistory: "Historia Social",
    
    // Actions
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    view: "Ver",
    add: "Agregar",
    
    // Status
    active: "Activo",
    inactive: "Inactivo",
    total: "Total",
    thisMonth: "Este Mes",
    
    // Roles
    superAdmin: "Super Administrador",
    centerAdmin: "Administrador de Centro",
    psychologist: "Psicólogo"
  }
};

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      logout();
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
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
const useLanguage = () => useContext(LanguageContext);

// Components
const Sidebar = ({ isOpen, onClose, currentView, setCurrentView }) => {
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();

  const menuItems = [
    { icon: FileText, label: t.dashboard, view: "dashboard" },
    { icon: Users, label: t.patients, view: "patients" },
    { icon: Calendar, label: t.schedule, view: "schedule" },
    { icon: DollarSign, label: t.finances, view: "finances" },
    { icon: Settings, label: t.settings, view: "settings" },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-blue-900 to-purple-900 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Psychology Portal</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="lg:hidden text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Avatar>
            <AvatarFallback className="bg-white/20 text-white">
              {user?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">{user?.full_name}</p>
            <p className="text-xs text-blue-200">{t[user?.role] || user?.role}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.view}
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/10 ${
                currentView === item.view ? 'bg-white/20' : ''
              }`}
              onClick={() => {
                setCurrentView(item.view);
                onClose(); // Close mobile sidebar after selection
              }}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-white hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4 mr-3" />
          {t.logout}
        </Button>
      </div>
    </div>
  );
};

const Header = ({ onMenuClick }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between px-6">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onMenuClick}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        >
          <Globe className="h-4 w-4 mr-2" />
          {language === 'en' ? 'ES' : 'EN'}
        </Button>
      </div>
    </header>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useLanguage();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Psychology Portal</CardTitle>
          <CardDescription>{t.welcome}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : t.login}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-600">Email: admin@psychologyportal.com</p>
            <p className="text-xs text-blue-600">Password: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
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
        axios.get(`${API}/patients`),
        axios.get(`${API}/appointments?start_date=${new Date().toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`),
        axios.get(`${API}/payments/stats`)
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.dashboard}</h1>
        <p className="text-gray-600 mt-1">{t.welcome}, {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
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

        <Card className="border-l-4 border-l-green-500">
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

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.thisMonth} Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">No recent patients to display</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">No upcoming appointments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PatientManagement = () => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnamnesisModal, setShowAnamnesisModal] = useState(false);
  const [currentPatientForAnamnesis, setCurrentPatientForAnamnesis] = useState(null);
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

  const handleOpenAnamnesis = (patient) => {
    setCurrentPatientForAnamnesis(patient);
    setShowAnamnesisModal(true);
  };

  const handleCloseAnamnesis = () => {
    setShowAnamnesisModal(false);
    setCurrentPatientForAnamnesis(null);
  };

  const handleAnamnesisUpdate = () => {
    // Refresh patient data after anamnesis update
    fetchPatients();
  };

  const AddPatientModal = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      address: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API}/patients`, formData);
        fetchPatients();
        setShowAddModal(false);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          gender: '',
          address: ''
        });
      } catch (error) {
        console.error('Error creating patient:', error);
      }
    };

    return (
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.addPatient}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">{t.firstName}</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">{t.lastName}</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">{t.dateOfBirth}</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="gender">{t.gender}</Label>
              <Select onValueChange={(value) => setFormData({...formData, gender: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male / Masculino</SelectItem>
                  <SelectItem value="female">Female / Femenino</SelectItem>
                  <SelectItem value="other">Other / Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                {t.cancel}
              </Button>
              <Button type="submit">{t.save}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t.patientList}</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t.addPatient}
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
                  <p className="text-sm text-gray-500">{patient.phone}</p>
                </div>
                <Badge variant={patient.is_active ? "default" : "secondary"}>
                  {patient.is_active ? t.active : t.inactive}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                <span>{patient.gender}</span>
                <span>{patient.date_of_birth}</span>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAnamnesis(patient)}
                  className="flex items-center space-x-1"
                >
                  <FileText className="h-4 w-4" />
                  <span>
                    {patient.anamnesis ? 'Ver Historia Clínica' : 'Crear Historia Clínica'}
                  </span>
                </Button>
                
                {patient.anamnesis && (
                  <Badge variant="secondary" className="text-xs">
                    Historia completa
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first patient</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.addPatient}
            </Button>
          </CardContent>
        </Card>
      )}

      <AddPatientModal />
      
      {/* Anamnesis Form Modal */}
      <AnamnesisForm
        patient={currentPatientForAnamnesis}
        isOpen={showAnamnesisModal}
        onClose={handleCloseAnamnesis}
        onSave={handleAnamnesisUpdate}
      />
    </div>
  );
};

const MainApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'patients':
        return <PatientManagement />;
      case 'schedule':
        return <div className="p-6"><h1 className="text-2xl">Schedule Management (Coming Soon)</h1></div>;
      case 'finances':
        return <div className="p-6"><h1 className="text-2xl">Financial Management (Coming Soon)</h1></div>;
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl">Settings (Coming Soon)</h1></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Tabs value={currentView} onValueChange={setCurrentView} className="h-full">
            <div className="hidden">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="finances">Finances</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="dashboard" className="m-0 h-full">
              <Dashboard />
            </TabsContent>
            <TabsContent value="patients" className="m-0 h-full">
              <PatientManagement />
            </TabsContent>
            <TabsContent value="schedule" className="m-0 h-full">
              <div className="p-6"><h1 className="text-2xl">Schedule Management (Coming Soon)</h1></div>
            </TabsContent>
            <TabsContent value="finances" className="m-0 h-full">
              <div className="p-6"><h1 className="text-2xl">Financial Management (Coming Soon)</h1></div>
            </TabsContent>
            <TabsContent value="settings" className="m-0 h-full">
              <div className="p-6"><h1 className="text-2xl">Settings (Coming Soon)</h1></div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

function App() {
  const [language, setLanguage] = useState('en');
  
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <AuthConsumer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageContext.Provider>
  );
}

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