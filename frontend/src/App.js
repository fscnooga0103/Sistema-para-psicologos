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
    appointments: "Appointments",
    sessions: "Sessions",
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
    appointments: "Citas",
    sessions: "Sesiones",
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

const AppointmentManagement = () => {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments?start_date=${selectedDate}&end_date=${selectedDate}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Generate timeline hours (8 AM to 8 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const appointment = appointments.find(apt => apt.appointment_time === timeString);
      slots.push({
        time: timeString,
        displayTime: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        appointment: appointment || null,
        available: !appointment
      });
    }
    return slots;
  };

  const AddAppointmentModal = () => {
    const [formData, setFormData] = useState({
      patient_id: '',
      appointment_date: selectedDate,
      appointment_time: '10:00',
      duration_minutes: 60,
      appointment_type: 'consultation',
      notes: '',
      session_objectives: []
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API}/appointments`, formData);
        fetchAppointments();
        setShowAddModal(false);
        setFormData({
          patient_id: '',
          appointment_date: selectedDate,
          appointment_time: '10:00',
          duration_minutes: 60,
          appointment_type: 'consultation',
          notes: '',
          session_objectives: []
        });
      } catch (error) {
        console.error('Error creating appointment:', error);
      }
    };

    return (
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="patient_id">Paciente</Label>
              <Select onValueChange={(value) => setFormData({...formData, patient_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appointment_date">Fecha</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment_time">Hora</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Duración (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="appointment_type">Tipo de Cita</Label>
              <Select onValueChange={(value) => setFormData({...formData, appointment_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de cita" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="therapy">Terapia</SelectItem>
                  <SelectItem value="evaluation">Evaluación</SelectItem>
                  <SelectItem value="follow_up">Seguimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notas de la cita..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const formatAppointmentType = (type) => {
    const types = {
      consultation: "Consulta",
      therapy: "Terapia", 
      evaluation: "Evaluación",
      follow_up: "Seguimiento"
    };
    return types[type] || type;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Timeline View Component
  const TimelineView = () => {
    const timeSlots = generateTimeSlots();
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Citas</p>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.status === 'completed').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.status === 'scheduled').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cronograma del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div 
                  key={slot.time}
                  className={`flex items-center p-3 rounded-lg border ${
                    slot.appointment 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } transition-colors cursor-pointer`}
                  onClick={() => {
                    if (!slot.appointment) {
                      // Auto-fill time in modal when clicking empty slot
                      setShowAddModal(true);
                    }
                  }}
                >
                  <div className="w-20 text-sm font-medium text-gray-600">
                    {slot.displayTime}
                  </div>
                  
                  {slot.appointment ? (
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {(() => {
                            const patient = patients.find(p => p.id === slot.appointment.patient_id);
                            return patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente desconocido';
                          })()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatAppointmentType(slot.appointment.appointment_type)} - {slot.appointment.duration_minutes} min
                        </p>
                      </div>
                      <Badge className={getStatusColor(slot.appointment.status)}>
                        {slot.appointment.status === 'scheduled' ? 'Programada' : 
                         slot.appointment.status === 'completed' ? 'Completada' :
                         slot.appointment.status === 'cancelled' ? 'Cancelada' : 'No Asistió'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center">
                      <p className="text-gray-400 text-sm">Disponible - Clic para agregar cita</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Vista Tarjetas
            </Button>
            <Button 
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
            >
              Vista Cronograma
            </Button>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div>
          <Label htmlFor="date-select">Seleccionar Fecha</Label>
          <Input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex items-end">
          <Button 
            variant="outline"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* Render based on view mode */}
      {viewMode === 'timeline' ? (
        <TimelineView />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => {
              const patient = patients.find(p => p.id === appointment.patient_id);
              return (
                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente no encontrado'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {appointment.appointment_time} - {formatAppointmentType(appointment.appointment_type)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status === 'scheduled' ? 'Programada' : 
                         appointment.status === 'completed' ? 'Completada' :
                         appointment.status === 'cancelled' ? 'Cancelada' : 'No Asistió'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Duración:</strong> {appointment.duration_minutes} min
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600">
                          <strong>Notas:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {appointment.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await axios.put(`${API}/appointments/${appointment.id}`, { status: 'completed' });
                              fetchAppointments();
                            } catch (error) {
                              console.error('Error updating appointment:', error);
                            }
                          }}
                        >
                          Completar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {appointments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas para esta fecha</h3>
                <p className="text-gray-500 mb-4">Programa una nueva cita para comenzar</p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cita
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AddAppointmentModal />
    </div>
  );
};

const SessionManagement = () => {
  const { t } = useLanguage();
  const [objectives, setObjectives] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [editingObjective, setEditingObjective] = useState(null);

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  function formatWeekRange(weekStart) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}`;
  }

  useEffect(() => {
    fetchObjectives();
    fetchPatients();
  }, [selectedWeek, selectedPatient]);

  const fetchObjectives = async () => {
    try {
      const params = new URLSearchParams();
      params.append('week_start_date', selectedWeek);
      if (selectedPatient !== 'all') {
        params.append('patient_id', selectedPatient);
      }
      
      const response = await axios.get(`${API}/session-objectives?${params.toString()}`);
      setObjectives(response.data);
    } catch (error) {
      console.error('Error fetching objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const AddObjectiveModal = () => {
    const [formData, setFormData] = useState({
      patient_id: '',
      week_start_date: selectedWeek,
      objective_title: '',
      objective_description: '',
      priority: 'medium',
      target_date: ''
    });

    useEffect(() => {
      if (editingObjective) {
        setFormData(editingObjective);
      } else {
        setFormData({
          patient_id: '',
          week_start_date: selectedWeek,
          objective_title: '',
          objective_description: '',
          priority: 'medium',
          target_date: ''
        });
      }
    }, [editingObjective, selectedWeek]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (editingObjective) {
          await axios.put(`${API}/session-objectives/${editingObjective.id}`, formData);
        } else {
          await axios.post(`${API}/session-objectives`, formData);
        }
        
        fetchObjectives();
        setShowAddModal(false);
        setEditingObjective(null);
        setFormData({
          patient_id: '',
          week_start_date: selectedWeek,
          objective_title: '',
          objective_description: '',
          priority: 'medium',
          target_date: ''
        });
      } catch (error) {
        console.error('Error saving objective:', error);
      }
    };

    return (
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingObjective ? 'Editar Objetivo Semanal' : 'Nuevo Objetivo Semanal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="patient_id">Paciente</Label>
              <Select 
                value={formData.patient_id}
                onValueChange={(value) => setFormData({...formData, patient_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="objective_title">Título del Objetivo</Label>
              <Input
                id="objective_title"
                value={formData.objective_title}
                onChange={(e) => setFormData({...formData, objective_title: e.target.value})}
                placeholder="Ej: Reducir episodios de ansiedad"
                required
              />
            </div>
            <div>
              <Label htmlFor="objective_description">Descripción</Label>
              <Textarea
                id="objective_description"
                value={formData.objective_description}
                onChange={(e) => setFormData({...formData, objective_description: e.target.value})}
                placeholder="Describe el objetivo y las acciones específicas a realizar..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_date">Fecha Objetivo</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingObjective(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">{editingObjective ? 'Actualizar' : 'Guardar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateObjectiveStatus = async (objectiveId, newStatus) => {
    try {
      await axios.put(`${API}/session-objectives/${objectiveId}`, { status: newStatus });
      fetchObjectives();
    } catch (error) {
      console.error('Error updating objective:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Sesiones y Objetivos</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Objetivo
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div>
          <Label htmlFor="week-select">Semana</Label>
          <Input
            id="week-select"
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(getWeekStart(new Date(e.target.value)))}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">{formatWeekRange(selectedWeek)}</p>
        </div>
        <div>
          <Label htmlFor="patient-filter">Paciente</Label>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Todos los pacientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pacientes</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button 
            variant="outline"
            onClick={() => setSelectedWeek(getWeekStart(new Date()))}
          >
            Esta Semana
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {objectives.map((objective) => {
          const patient = patients.find(p => p.id === objective.patient_id);
          return (
            <Card key={objective.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {objective.objective_title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente no encontrado'}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Badge className={getPriorityColor(objective.priority)}>
                      {objective.priority === 'high' ? 'Alta' : 
                       objective.priority === 'low' ? 'Baja' : 'Media'}
                    </Badge>
                    <Badge className={getStatusColor(objective.status)}>
                      {objective.status === 'completed' ? 'Completado' :
                       objective.status === 'in_progress' ? 'En Progreso' :
                       objective.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    {objective.objective_description}
                  </p>
                  {objective.target_date && (
                    <p className="text-xs text-gray-500">
                      <strong>Fecha objetivo:</strong> {new Date(objective.target_date).toLocaleDateString('es-ES')}
                    </p>
                  )}
                  {objective.completion_notes && (
                    <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      <strong>Notas de finalización:</strong> {objective.completion_notes}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingObjective(objective);
                      setShowAddModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  {objective.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateObjectiveStatus(objective.id, 'in_progress')}
                    >
                      Iniciar
                    </Button>
                  )}
                  {objective.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateObjectiveStatus(objective.id, 'completed')}
                    >
                      Completar
                    </Button>
                  )}
                  {objective.status !== 'completed' && objective.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateObjectiveStatus(objective.id, 'cancelled')}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {objectives.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay objetivos para esta semana</h3>
            <p className="text-gray-500 mb-4">Crea objetivos semanales para hacer seguimiento del progreso</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Objetivo
            </Button>
          </CardContent>
        </Card>
      )}

      <AddObjectiveModal />
    </div>
  );
};

const FinanceManagement = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchPayments();
    fetchPatients();
    fetchStats();
  }, [selectedDate]);

  const fetchPayments = async () => {
    try {
      const startDate = getDateRange().start;
      const endDate = getDateRange().end;
      
      const response = await axios.get(`${API}/payments?start_date=${startDate}&end_date=${endDate}`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/payments/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const getDateRange = () => {
    const date = new Date(selectedDate);
    let start, end;

    switch(selectedPeriod) {
      case 'day':
        start = end = selectedDate;
        break;
      case 'week':
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        start = weekStart.toISOString().split('T')[0];
        end = weekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      default:
        start = end = selectedDate;
    }

    return { start, end };
  };

  const AddPaymentModal = () => {
    const [formData, setFormData] = useState({
      patient_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      session_date: new Date().toISOString().split('T')[0],
      payment_method: 'efectivo',
      notes: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API}/payments`, {
          ...formData,
          amount: parseFloat(formData.amount)
        });
        fetchPayments();
        fetchStats();
        setShowAddModal(false);
        setFormData({
          patient_id: '',
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          session_date: new Date().toISOString().split('T')[0],
          payment_method: 'efectivo',
          notes: ''
        });
      } catch (error) {
        console.error('Error creating payment:', error);
      }
    };

    return (
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="patient_id">Paciente</Label>
              <Select onValueChange={(value) => setFormData({...formData, patient_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_date">Fecha de Pago</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="session_date">Fecha de Sesión</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="payment_method">Método de Pago</Label>
              <Select onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notas adicionales..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión Financiera</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ganancia Diaria</p>
                <p className="text-2xl font-bold text-gray-900">${stats.daily_total?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ganancia Semanal</p>
                <p className="text-2xl font-bold text-gray-900">${stats.weekly_total?.toFixed(2) || '0.00'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ganancia Mensual</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthly_total?.toFixed(2) || '0.00'}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio por Sesión</p>
                <p className="text-2xl font-bold text-gray-900">${stats.average_per_session?.toFixed(2) || '0.00'}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div>
          <Label htmlFor="period-select">Período</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Día</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date-select">Fecha</Label>
          <Input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex items-end">
          <Button 
            variant="outline"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* Payments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payments.map((payment) => {
          const patient = patients.find(p => p.id === payment.patient_id);
          return (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente no encontrado'}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {payment.status === 'completed' ? 'Completado' : 'Pendiente'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Fecha de pago:</strong> {new Date(payment.payment_date).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Fecha de sesión:</strong> {new Date(payment.session_date).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Método:</strong> {payment.payment_method}
                  </p>
                  {payment.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Notas:</strong> {payment.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {payments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
            <p className="text-gray-500 mb-4">Registra tu primer pago para comenzar el seguimiento financiero</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </CardContent>
        </Card>
      )}

      <AddPaymentModal />
    </div>
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
    { icon: TrendingUp, label: t.sessions, view: "sessions" },
    { icon: DollarSign, label: t.finances, view: "finances" },
    // Only show user management for admins
    ...(user && (user.role === 'super_admin' || user.role === 'center_admin') ? 
      [{ icon: UserPlus, label: "Usuarios", view: "users" }] : []
    ),
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

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    appointmentsToday: 0,
    monthlyRevenue: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentData();
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

  const fetchRecentData = async () => {
    try {
      const [patientsResponse, appointmentsResponse] = await Promise.all([
        axios.get(`${API}/patients`),
        axios.get(`${API}/appointments?start_date=${new Date().toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`)
      ]);
      
      // Get 3 most recent patients
      const sortedPatients = patientsResponse.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      
      setRecentPatients(sortedPatients);
      setTodayAppointments(appointmentsResponse.data.slice(0, 5)); // Show max 5 appointments
    } catch (error) {
      console.error('Error fetching recent data:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.dashboard}</h1>
        <p className="text-gray-600 mt-1">{t.welcome}, {user?.full_name}</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle 
              className="cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onNavigate('patients')}
            >
              Pacientes Recientes
            </CardTitle>
            <Button size="sm" onClick={() => onNavigate('patients')}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Paciente
            </Button>
          </CardHeader>
          <CardContent>
            {recentPatients.length > 0 ? (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onNavigate('patients')}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{patient.email}</p>
                    </div>
                    <Badge variant={patient.is_active ? "default" : "secondary"}>
                      {patient.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onNavigate('patients')}
                  >
                    Ver Todos los Pacientes →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No hay pacientes registrados</p>
                <Button size="sm" onClick={() => onNavigate('patients')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Primer Paciente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle 
              className="cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onNavigate('schedule')}
            >
              Citas de Hoy
            </CardTitle>
            <Button size="sm" onClick={() => onNavigate('schedule')}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva Cita
            </Button>
          </CardHeader>
          <CardContent>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => onNavigate('schedule')}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.appointment_time}
                      </p>
                      <p className="text-sm text-gray-500">
                        Paciente ID: {appointment.patient_id.slice(-8)}
                      </p>
                    </div>
                    <Badge className={
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {appointment.status === 'scheduled' ? 'Programada' : 
                       appointment.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </Badge>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => onNavigate('schedule')}
                  >
                    Ver Todas las Citas →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No hay citas programadas para hoy</p>
                <Button size="sm" onClick={() => onNavigate('schedule')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Programar Primera Cita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate('patients')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Gestión de Pacientes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate('schedule')}
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Programar Cita</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate('sessions')}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Objetivos Semanales</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate('finances')}
            >
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Gestión Financiera</span>
            </Button>
          </div>
        </CardContent>
      </Card>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patientNotes, setPatientNotes] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);

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

  const openPatientSidebar = (patient) => {
    setSelectedPatient(patient);
    setPatientNotes(patient.notes || '');
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedPatient(null);
    setPatientNotes('');
    setActiveTab('general');
  };

  const savePatientNotes = async () => {
    if (!selectedPatient) return;
    
    try {
      await axios.put(`${API}/patients/${selectedPatient.id}`, {
        notes: patientNotes
      });
      
      // Update local patient data
      setPatients(patients.map(p => 
        p.id === selectedPatient.id 
          ? { ...p, notes: patientNotes }
          : p
      ));
      
      alert('Notas guardadas exitosamente');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Error al guardar las notas');
    }
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

  // Evaluation Modal Component
  const EvaluationModal = () => {
    const [formData, setFormData] = useState({
      evaluation_type: '',
      evaluation_date: new Date().toISOString().split('T')[0],
      results: {},
      notes: ''
    });

    useEffect(() => {
      if (editingEvaluation) {
        setFormData(editingEvaluation);
      }
    }, [editingEvaluation]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.post(`${API}/patients/${selectedPatient.id}/evaluations`, {
          patient_id: selectedPatient.id,
          ...formData
        });
        
        // Refresh patient data
        fetchPatients();
        setShowEvaluationModal(false);
        setEditingEvaluation(null);
        setFormData({
          evaluation_type: '',
          evaluation_date: new Date().toISOString().split('T')[0],
          results: {},
          notes: ''
        });
      } catch (error) {
        console.error('Error saving evaluation:', error);
      }
    };

    return (
      <Dialog open={showEvaluationModal} onOpenChange={setShowEvaluationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="evaluation_type">Tipo de Evaluación</Label>
              <Select onValueChange={(value) => setFormData({...formData, evaluation_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="psychological">Evaluación Psicológica</SelectItem>
                  <SelectItem value="cognitive">Evaluación Cognitiva</SelectItem>
                  <SelectItem value="emotional">Evaluación Emocional</SelectItem>
                  <SelectItem value="behavioral">Evaluación Conductual</SelectItem>
                  <SelectItem value="neuropsychological">Evaluación Neuropsicológica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="evaluation_date">Fecha de Evaluación</Label>
              <Input
                id="evaluation_date"
                type="date"
                value={formData.evaluation_date}
                onChange={(e) => setFormData({...formData, evaluation_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Resultados y Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Describe los resultados de la evaluación..."
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEvaluationModal(false);
                  setEditingEvaluation(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Diagnosis Modal Component
  const DiagnosisModal = () => {
    const [formData, setFormData] = useState({
      primary_diagnosis: '',
      secondary_diagnosis: '',
      dsm5_codes: [],
      severity: 'medium',
      notes: ''
    });

    useEffect(() => {
      if (editingDiagnosis) {
        setFormData(editingDiagnosis);
      } else if (selectedPatient?.diagnosis) {
        setFormData(selectedPatient.diagnosis);
      }
    }, [editingDiagnosis, selectedPatient]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.put(`${API}/patients/${selectedPatient.id}/diagnosis`, {
          patient_id: selectedPatient.id,
          ...formData
        });
        
        // Refresh patient data
        fetchPatients();
        setShowDiagnosisModal(false);
        setEditingDiagnosis(null);
        setFormData({
          primary_diagnosis: '',
          secondary_diagnosis: '',
          dsm5_codes: [],
          severity: 'medium',
          notes: ''
        });
      } catch (error) {
        console.error('Error saving diagnosis:', error);
      }
    };

    return (
      <Dialog open={showDiagnosisModal} onOpenChange={setShowDiagnosisModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDiagnosis ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="primary_diagnosis">Diagnóstico Principal</Label>
              <Input
                id="primary_diagnosis"
                value={formData.primary_diagnosis}
                onChange={(e) => setFormData({...formData, primary_diagnosis: e.target.value})}
                placeholder="Ej: Trastorno de ansiedad generalizada"
                required
              />
            </div>
            <div>
              <Label htmlFor="secondary_diagnosis">Diagnóstico Secundario</Label>
              <Input
                id="secondary_diagnosis"
                value={formData.secondary_diagnosis}
                onChange={(e) => setFormData({...formData, secondary_diagnosis: e.target.value})}
                placeholder="Diagnóstico secundario (opcional)"
              />
            </div>
            <div>
              <Label htmlFor="severity">Severidad</Label>
              <Select onValueChange={(value) => setFormData({...formData, severity: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Leve</SelectItem>
                  <SelectItem value="medium">Moderada</SelectItem>
                  <SelectItem value="high">Severa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dsm5_codes">Códigos DSM-5 (separados por comas)</Label>
              <Input
                id="dsm5_codes"
                value={Array.isArray(formData.dsm5_codes) ? formData.dsm5_codes.join(', ') : ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  dsm5_codes: e.target.value.split(',').map(code => code.trim()).filter(code => code)
                })}
                placeholder="Ej: F41.1, F32.9"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas del Diagnóstico</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observaciones adicionales sobre el diagnóstico..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDiagnosisModal(false);
                  setEditingDiagnosis(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Patient Sidebar Component
  const PatientSidebar = () => {
    if (!selectedPatient) return null;

    const sidebarTabs = [
      { id: 'general', label: 'Información General', icon: Users },
      { id: 'evaluations', label: 'Evaluaciones', icon: ClipboardList },
      { id: 'diagnosis', label: 'Diagnóstico', icon: Stethoscope },
      { id: 'notes', label: 'Notas', icon: FileText }
    ];

    const renderTabContent = () => {
      switch(activeTab) {
        case 'general':
          return (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Datos Personales</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Nombre:</strong> {selectedPatient.first_name} {selectedPatient.last_name}</p>
                  <p><strong>Email:</strong> {selectedPatient.email || 'No especificado'}</p>
                  <p><strong>Teléfono:</strong> {selectedPatient.phone || 'No especificado'}</p>
                  <p><strong>Fecha de nacimiento:</strong> {selectedPatient.date_of_birth || 'No especificado'}</p>
                  <p><strong>Género:</strong> {selectedPatient.gender || 'No especificado'}</p>
                  <p><strong>Dirección:</strong> {selectedPatient.address || 'No especificado'}</p>
                </div>
              </div>
              
              {selectedPatient.emergency_contact && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Contacto de Emergencia</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nombre:</strong> {selectedPatient.emergency_contact.name}</p>
                    <p><strong>Teléfono:</strong> {selectedPatient.emergency_contact.phone}</p>
                    <p><strong>Relación:</strong> {selectedPatient.emergency_contact.relationship}</p>
                  </div>
                </div>
              )}
            </div>
          );
        
        case 'evaluations':
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Evaluaciones</h3>
                <Button size="sm" variant="outline" onClick={() => setShowEvaluationModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva
                </Button>
              </div>
              
              {selectedPatient.evaluations && selectedPatient.evaluations.length > 0 ? (
                <div className="space-y-3">
                  {selectedPatient.evaluations.map((evaluation, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">{evaluation.evaluation_type}</h4>
                          <div className="flex space-x-1">
                            <span className="text-xs text-gray-500">{evaluation.evaluation_date}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingEvaluation(evaluation);
                                setShowEvaluationModal(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{evaluation.notes}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">No hay evaluaciones registradas</p>
                  <Button size="sm" onClick={() => setShowEvaluationModal(true)}>
                    Agregar Evaluación
                  </Button>
                </div>
              )}
            </div>
          );
        
        case 'diagnosis':
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Diagnóstico Presuntivo</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setEditingDiagnosis(selectedPatient.diagnosis);
                    setShowDiagnosisModal(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {selectedPatient.diagnosis ? 'Editar' : 'Agregar'}
                </Button>
              </div>
              
              {selectedPatient.diagnosis ? (
                <Card className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Diagnóstico Principal</h4>
                      <p className="text-sm text-gray-600">{selectedPatient.diagnosis.primary_diagnosis}</p>
                    </div>
                    
                    {selectedPatient.diagnosis.secondary_diagnosis && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Diagnóstico Secundario</h4>
                        <p className="text-sm text-gray-600">{selectedPatient.diagnosis.secondary_diagnosis}</p>
                      </div>
                    )}
                    
                    {selectedPatient.diagnosis.dsm5_codes && selectedPatient.diagnosis.dsm5_codes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Códigos DSM-5</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedPatient.diagnosis.dsm5_codes.map((code, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{code}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Severidad</h4>
                      <Badge className={`text-xs ${
                        selectedPatient.diagnosis.severity === 'high' ? 'bg-red-100 text-red-800' :
                        selectedPatient.diagnosis.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedPatient.diagnosis.severity === 'high' ? 'Severa' :
                         selectedPatient.diagnosis.severity === 'medium' ? 'Moderada' : 'Leve'}
                      </Badge>
                    </div>
                    
                    {selectedPatient.diagnosis.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Notas</h4>
                        <p className="text-sm text-gray-600">{selectedPatient.diagnosis.notes}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">No hay diagnóstico registrado</p>
                  <Button size="sm" onClick={() => setShowDiagnosisModal(true)}>
                    Agregar Diagnóstico
                  </Button>
                </div>
              )}
            </div>
          );
        
        case 'notes':
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Notas del Paciente</h3>
                <Button size="sm" onClick={savePatientNotes}>
                  Guardar
                </Button>
              </div>
              
              <div>
                <Textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="Escribe tus notas sobre el paciente aquí..."
                  className="min-h-[200px]"
                />
              </div>
              
              {selectedPatient.progress_notes && selectedPatient.progress_notes.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Notas de Progreso</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedPatient.progress_notes.map((note, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">{note.session_type}</span>
                            <span className="text-xs text-gray-500">{note.session_date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{note.progress}</p>
                          {note.homework_assigned && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              <strong>Tarea asignada:</strong> {note.homework_assigned}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        
        default:
          return null;
      }
    };

    return (
      <div className={`fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } overflow-hidden`}>
        <div className="flex flex-col h-full max-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </h2>
              <p className="text-xs text-gray-500">Detalles del Paciente</p>
            </div>
            <Button variant="ghost" size="sm" onClick={closeSidebar}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b bg-white flex-shrink-0">
            <ScrollArea className="w-full">
              <div className="flex p-1 space-x-1 min-w-max">
                {sidebarTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="whitespace-nowrap text-xs px-3 py-2"
                  >
                    <tab.icon className="h-3 w-3 mr-1" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 pb-6">
                {renderTabContent()}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
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
                  onClick={() => openPatientSidebar(patient)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver Detalles</span>
                </Button>
                
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
      
      {/* Evaluation and Diagnosis Modals */}
      <EvaluationModal />
      <DiagnosisModal />
      
      <PatientSidebar />
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
        return <AppointmentManagement />;
      case 'sessions':
        return <SessionManagement />;
      case 'finances':
        return <FinanceManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SettingsManagement />;
const UserManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const AddUserModal = () => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      role: 'psychologist',
      phone: '',
      specialization: '',
      license_number: ''
    });

    useEffect(() => {
      if (editingUser) {
        setFormData({
          ...editingUser,
          password: '' // Don't prefill password for security
        });
      }
    }, [editingUser]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (editingUser) {
          // Update user (exclude password and username/email if not provided)
          const updateData = { ...formData };
          delete updateData.username;
          delete updateData.email;
          if (!updateData.password) delete updateData.password;
          
          await axios.put(`${API}/users/${editingUser.id}`, updateData);
        } else {
          await axios.post(`${API}/users`, formData);
        }
        
        fetchUsers();
        setShowAddModal(false);
        setEditingUser(null);
        setFormData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          role: 'psychologist',
          phone: '',
          specialization: '',
          license_number: ''
        });
      } catch (error) {
        console.error('Error saving user:', error);
        alert(error.response?.data?.detail || 'Error al guardar usuario');
      }
    };

    return (
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            {!editingUser && (
              <>
                <div>
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={formData.role}
                onValueChange={(value) => setFormData({...formData, role: value})}
                disabled={user.role !== 'super_admin'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="psychologist">Psicólogo</SelectItem>
                  {user.role === 'super_admin' && (
                    <SelectItem value="center_admin">Administrador de Centro</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="license_number">Núm. Licencia</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialization">Especialización</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                placeholder="Psicología Clínica, Terapia Cognitiva, etc."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">{editingUser ? 'Actualizar' : 'Crear Usuario'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'super_admin':
        return <Badge className="bg-red-100 text-red-800">Super Admin</Badge>;
      case 'center_admin':
        return <Badge className="bg-blue-100 text-blue-800">Admin Centro</Badge>;
      case 'psychologist':
        return <Badge className="bg-green-100 text-green-800">Psicólogo</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API}/users/${userId}`, { is_active: !currentStatus });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  // Only allow access to admin users
  if (user.role !== 'super_admin' && user.role !== 'center_admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
            <p className="text-gray-500">Solo los administradores pueden acceder a la gestión de usuarios</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((usr) => (
          <Card key={usr.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {usr.first_name} {usr.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{usr.email}</p>
                  <p className="text-sm text-gray-500">@{usr.username}</p>
                </div>
                <div className="flex flex-col space-y-2">
                  {getRoleBadge(usr.role)}
                  <Badge variant={usr.is_active ? "default" : "secondary"}>
                    {usr.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {usr.phone && (
                  <p className="text-sm text-gray-600">
                    <strong>Teléfono:</strong> {usr.phone}
                  </p>
                )}
                {usr.specialization && (
                  <p className="text-sm text-gray-600">
                    <strong>Especialización:</strong> {usr.specialization}
                  </p>
                )}
                {usr.license_number && (
                  <p className="text-sm text-gray-600">
                    <strong>Licencia:</strong> {usr.license_number}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingUser(usr);
                    setShowAddModal(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant={usr.is_active ? "destructive" : "default"}
                  onClick={() => toggleUserStatus(usr.id, usr.is_active)}
                  disabled={usr.id === user.id} // Can't deactivate yourself
                >
                  {usr.is_active ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios registrados</h3>
            <p className="text-gray-500 mb-4">Crea el primer usuario para comenzar</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </CardContent>
        </Card>
      )}

      <AddUserModal />
    </div>
  );
};

const SettingsManagement = () => {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    specialization: '',
    license_number: ''
  });
  const [preferences, setPreferences] = useState({
    default_appointment_duration: 60,
    default_session_rate: 0,
    work_hours_start: '08:00',
    work_hours_end: '18:00',
    notifications_enabled: true,
    email_reminders: true
  });

  const updateProfile = async () => {
    try {
      await axios.put(`${API}/users/profile`, profileData);
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar perfil');
    }
  };

  const updatePreferences = async () => {
    try {
      await axios.put(`${API}/users/preferences`, preferences);
      alert('Preferencias actualizadas exitosamente');
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Error al actualizar preferencias');
    }
  };

  const settingsTabs = [
    { id: 'profile', label: 'Perfil', icon: Users },
    { id: 'preferences', label: 'Preferencias', icon: Settings },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'about', label: 'Acerca de', icon: FileText }
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                    placeholder="Tu apellido"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Especialización</Label>
                  <Input
                    id="specialization"
                    value={profileData.specialization}
                    onChange={(e) => setProfileData({...profileData, specialization: e.target.value})}
                    placeholder="Psicología Clínica, Terapia Cognitiva, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="license_number">Número de Licencia</Label>
                  <Input
                    id="license_number"
                    value={profileData.license_number}
                    onChange={(e) => setProfileData({...profileData, license_number: e.target.value})}
                    placeholder="Número de licencia profesional"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={updateProfile}>
                  Actualizar Perfil
                </Button>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preferencias de Trabajo</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duración Default de Citas (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={preferences.default_appointment_duration}
                      onChange={(e) => setPreferences({...preferences, default_appointment_duration: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Tarifa por Sesión</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={preferences.default_session_rate}
                      onChange={(e) => setPreferences({...preferences, default_session_rate: parseFloat(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time">Hora de Inicio</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={preferences.work_hours_start}
                      onChange={(e) => setPreferences({...preferences, work_hours_start: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Hora de Fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={preferences.work_hours_end}
                      onChange={(e) => setPreferences({...preferences, work_hours_end: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Idioma</h4>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Notificaciones</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notifications"
                        checked={preferences.notifications_enabled}
                        onChange={(e) => setPreferences({...preferences, notifications_enabled: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="notifications">Habilitar notificaciones del sistema</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email_reminders"
                        checked={preferences.email_reminders}
                        onChange={(e) => setPreferences({...preferences, email_reminders: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="email_reminders">Recordatorios por email</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={updatePreferences}>
                  Guardar Preferencias
                </Button>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="current_password">Contraseña Actual</Label>
                  <Input
                    id="current_password"
                    type="password"
                    placeholder="Contraseña actual"
                  />
                </div>
                <div>
                  <Label htmlFor="new_password">Nueva Contraseña</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Nueva contraseña"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirmar contraseña"
                  />
                </div>
                <Button>Cambiar Contraseña</Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sesiones Activas</h3>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sesión Actual</p>
                    <p className="text-sm text-gray-500">Iniciada: {new Date().toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Cerrar Otras Sesiones
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Acerca del Sistema</h3>
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Sistema de Gestión Psicológica</h4>
                    <p className="text-sm text-gray-600">Versión 1.0.0</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Descripción</h4>
                    <p className="text-sm text-gray-600">
                      Sistema integral para la gestión de práctica psicológica, incluyendo manejo de pacientes, 
                      agenda de citas, seguimiento de objetivos terapéuticos y gestión financiera.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Características</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      <li>Gestión completa de pacientes con historia clínica</li>
                      <li>Sistema de citas con vista de cronograma</li>
                      <li>Seguimiento de objetivos semanales</li>
                      <li>Gestión financiera con reportes</li>
                      <li>Interfaz responsive para móvil y escritorio</li>
                      <li>Soporte multiidioma (Español/Inglés)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Soporte</h4>
                    <p className="text-sm text-gray-600">
                      Para soporte técnico o consultas, contacta al administrador del sistema.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
      </div>

      <div className="flex space-x-6">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white rounded-lg border p-4">
          <nav className="space-y-2">
            {settingsTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-lg border p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
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
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="finances">Finances</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="dashboard" className="m-0 h-full">
              <Dashboard onNavigate={setCurrentView} />
            </TabsContent>
            <TabsContent value="patients" className="m-0 h-full">
              <PatientManagement />
            </TabsContent>
            <TabsContent value="schedule" className="m-0 h-full">
              <AppointmentManagement />
            </TabsContent>
            <TabsContent value="sessions" className="m-0 h-full">
              <SessionManagement />
            </TabsContent>
            <TabsContent value="finances" className="m-0 h-full">
              <FinanceManagement />
            </TabsContent>
            <TabsContent value="users" className="m-0 h-full">
              <UserManagement />
            </TabsContent>
            <TabsContent value="settings" className="m-0 h-full">
              <SettingsManagement />
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