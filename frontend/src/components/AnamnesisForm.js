import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Save, 
  ChevronRight, 
  User, 
  Heart, 
  Brain, 
  Activity,
  MessageSquare,
  Utensils,
  Users,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Home,
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Simplified sections - reduced from 13 to 6 key sections
const sections = [
  {
    id: 'general_data',
    title: 'Datos Generales',
    description: 'Información básica del paciente',
    icon: User,
    color: 'bg-blue-500'
  },
  {
    id: 'consultation_motive',
    title: 'Motivo de Consulta',
    description: 'Razón principal de la visita',
    icon: MessageSquare,
    color: 'bg-green-500'
  },
  {
    id: 'medical_history',
    title: 'Historia Médica',
    description: 'Antecedentes médicos relevantes',
    icon: Heart,
    color: 'bg-red-500'
  },
  {
    id: 'family_history',
    title: 'Historia Familiar',
    description: 'Antecedentes familiares importantes',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    id: 'psychological_evaluation',
    title: 'Evaluación Psicológica',
    description: 'Estado psicológico actual',
    icon: Brain,
    color: 'bg-orange-500'
  },
  {
    id: 'observations',
    title: 'Observaciones',
    description: 'Notas adicionales y observaciones',
    icon: FileText,
    color: 'bg-gray-500'
  }
];

const AnamnesisForm = ({ patient, isOpen, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    general_data: {
      age: '',
      birth_date: '',
      birth_place: '',
      current_residence: '',
      education_level: '',
      occupation: '',
      marital_status: '',
      religion: ''
    },
    consultation_motive: {
      primary_complaint: '',
      symptom_duration: '',
      symptom_frequency: '',
      what_triggers: '',
      what_helps: '',
      previous_treatments: ''
    },
    medical_history: {
      current_medications: '',
      allergies: '',
      chronic_conditions: '',
      surgeries: '',
      hospitalizations: '',
      substance_use: ''
    },
    family_history: {
      family_structure: '',
      family_medical_history: '',
      family_psychological_history: '',
      family_relationships: '',
      family_support: ''
    },
    psychological_evaluation: {
      mood_state: '',
      anxiety_level: '',
      sleep_patterns: '',
      appetite: '',
      social_functioning: '',
      coping_mechanisms: ''
    },
    observations: {
      general_observations: '',
      behavioral_observations: '',
      cognitive_observations: '',
      emotional_observations: '',
      recommendations: ''
    }
  });

  useEffect(() => {
    if (patient && isOpen) {
      loadExistingAnamnesis();
    }
  }, [patient, isOpen]);

  const loadExistingAnamnesis = async () => {
    if (patient?.anamnesis) {
      setFormData(patient.anamnesis);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/patients/${patient.id}/anamnesis`, formData);
      alert('Anamnesis guardada exitosamente');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving anamnesis:', error);
      alert('Error al guardar la anamnesis');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentSection = () => {
    const section = sections[currentStep];
    
    switch (section.id) {
      case 'general_data':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  value={formData.general_data.age}
                  onChange={(e) => handleInputChange('general_data', 'age', e.target.value)}
                  placeholder="25 años"
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.general_data.birth_date}
                  onChange={(e) => handleInputChange('general_data', 'birth_date', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_place">Lugar de Nacimiento</Label>
                <Input
                  id="birth_place"
                  value={formData.general_data.birth_place}
                  onChange={(e) => handleInputChange('general_data', 'birth_place', e.target.value)}
                  placeholder="Lima, Perú"
                />
              </div>
              <div>
                <Label htmlFor="current_residence">Residencia Actual</Label>
                <Input
                  id="current_residence"
                  value={formData.general_data.current_residence}
                  onChange={(e) => handleInputChange('general_data', 'current_residence', e.target.value)}
                  placeholder="San Isidro, Lima"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="education_level">Nivel Educativo</Label>
                <Input
                  id="education_level"
                  value={formData.general_data.education_level}
                  onChange={(e) => handleInputChange('general_data', 'education_level', e.target.value)}
                  placeholder="Universitario completo"
                />
              </div>
              <div>
                <Label htmlFor="occupation">Ocupación</Label>
                <Input
                  id="occupation"
                  value={formData.general_data.occupation}
                  onChange={(e) => handleInputChange('general_data', 'occupation', e.target.value)}
                  placeholder="Ingeniero de Software"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marital_status">Estado Civil</Label>
                <Input
                  id="marital_status"
                  value={formData.general_data.marital_status}
                  onChange={(e) => handleInputChange('general_data', 'marital_status', e.target.value)}
                  placeholder="Soltero/a"
                />
              </div>
              <div>
                <Label htmlFor="religion">Religión</Label>
                <Input
                  id="religion"
                  value={formData.general_data.religion}
                  onChange={(e) => handleInputChange('general_data', 'religion', e.target.value)}
                  placeholder="Católica"
                />
              </div>
            </div>
          </div>
        );

      case 'consultation_motive':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="primary_complaint">Motivo Principal de Consulta</Label>
              <Textarea
                id="primary_complaint"
                value={formData.consultation_motive.primary_complaint}
                onChange={(e) => handleInputChange('consultation_motive', 'primary_complaint', e.target.value)}
                placeholder="Describa el motivo principal por el cual busca ayuda..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symptom_duration">Duración de los Síntomas</Label>
                <Input
                  id="symptom_duration"
                  value={formData.consultation_motive.symptom_duration}
                  onChange={(e) => handleInputChange('consultation_motive', 'symptom_duration', e.target.value)}
                  placeholder="3 meses"
                />
              </div>
              <div>
                <Label htmlFor="symptom_frequency">Frecuencia</Label>
                <Input
                  id="symptom_frequency"
                  value={formData.consultation_motive.symptom_frequency}
                  onChange={(e) => handleInputChange('consultation_motive', 'symptom_frequency', e.target.value)}
                  placeholder="Diario, semanal"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="what_triggers">¿Qué lo Desencadena?</Label>
              <Textarea
                id="what_triggers"
                value={formData.consultation_motive.what_triggers}
                onChange={(e) => handleInputChange('consultation_motive', 'what_triggers', e.target.value)}
                placeholder="Situaciones, personas, o eventos que empeoran los síntomas..."
              />
            </div>

            <div>
              <Label htmlFor="what_helps">¿Qué lo Mejora?</Label>
              <Textarea
                id="what_helps"
                value={formData.consultation_motive.what_helps}
                onChange={(e) => handleInputChange('consultation_motive', 'what_helps', e.target.value)}
                placeholder="Actividades, situaciones que alivian los síntomas..."
              />
            </div>

            <div>
              <Label htmlFor="previous_treatments">Tratamientos Anteriores</Label>
              <Textarea
                id="previous_treatments"
                value={formData.consultation_motive.previous_treatments}
                onChange={(e) => handleInputChange('consultation_motive', 'previous_treatments', e.target.value)}
                placeholder="Psicoterapia previa, medicamentos, otros tratamientos..."
              />
            </div>
          </div>
        );

      case 'medical_history':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="current_medications">Medicamentos Actuales</Label>
              <Textarea
                id="current_medications"
                value={formData.medical_history.current_medications}
                onChange={(e) => handleInputChange('medical_history', 'current_medications', e.target.value)}
                placeholder="Lista de medicamentos que toma actualmente..."
              />
            </div>

            <div>
              <Label htmlFor="allergies">Alergias</Label>
              <Input
                id="allergies"
                value={formData.medical_history.allergies}
                onChange={(e) => handleInputChange('medical_history', 'allergies', e.target.value)}
                placeholder="Alergias conocidas a medicamentos, alimentos, etc."
              />
            </div>

            <div>
              <Label htmlFor="chronic_conditions">Condiciones Crónicas</Label>
              <Textarea
                id="chronic_conditions"
                value={formData.medical_history.chronic_conditions}
                onChange={(e) => handleInputChange('medical_history', 'chronic_conditions', e.target.value)}
                placeholder="Diabetes, hipertensión, enfermedades crónicas..."
              />
            </div>

            <div>
              <Label htmlFor="surgeries">Cirugías</Label>
              <Textarea
                id="surgeries"
                value={formData.medical_history.surgeries}
                onChange={(e) => handleInputChange('medical_history', 'surgeries', e.target.value)}
                placeholder="Cirugías previas con fechas aproximadas..."
              />
            </div>

            <div>
              <Label htmlFor="hospitalizations">Hospitalizaciones</Label>
              <Textarea
                id="hospitalizations"
                value={formData.medical_history.hospitalizations}
                onChange={(e) => handleInputChange('medical_history', 'hospitalizations', e.target.value)}
                placeholder="Hospitalizaciones previas y motivos..."
              />
            </div>

            <div>
              <Label htmlFor="substance_use">Uso de Sustancias</Label>
              <Textarea
                id="substance_use"
                value={formData.medical_history.substance_use}
                onChange={(e) => handleInputChange('medical_history', 'substance_use', e.target.value)}
                placeholder="Alcohol, tabaco, drogas (frecuencia y cantidad)..."
              />
            </div>
          </div>
        );

      case 'family_history':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="family_structure">Estructura Familiar</Label>
              <Textarea
                id="family_structure"
                value={formData.family_history.family_structure}
                onChange={(e) => handleInputChange('family_history', 'family_structure', e.target.value)}
                placeholder="Composición familiar, con quién vive..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="family_medical_history">Antecedentes Médicos Familiares</Label>
              <Textarea
                id="family_medical_history"
                value={formData.family_history.family_medical_history}
                onChange={(e) => handleInputChange('family_history', 'family_medical_history', e.target.value)}
                placeholder="Enfermedades hereditarias, condiciones médicas en la familia..."
              />
            </div>

            <div>
              <Label htmlFor="family_psychological_history">Antecedentes Psicológicos Familiares</Label>
              <Textarea
                id="family_psychological_history"
                value={formData.family_history.family_psychological_history}
                onChange={(e) => handleInputChange('family_history', 'family_psychological_history', e.target.value)}
                placeholder="Depresión, ansiedad, otros problemas psicológicos en la familia..."
              />
            </div>

            <div>
              <Label htmlFor="family_relationships">Relaciones Familiares</Label>
              <Textarea
                id="family_relationships"
                value={formData.family_history.family_relationships}
                onChange={(e) => handleInputChange('family_history', 'family_relationships', e.target.value)}
                placeholder="Calidad de las relaciones familiares, conflictos, apoyo..."
              />
            </div>

            <div>
              <Label htmlFor="family_support">Apoyo Familiar</Label>
              <Textarea
                id="family_support"
                value={formData.family_history.family_support}
                onChange={(e) => handleInputChange('family_history', 'family_support', e.target.value)}
                placeholder="Nivel de apoyo que recibe de la familia..."
              />
            </div>
          </div>
        );

      case 'psychological_evaluation':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="mood_state">Estado de Ánimo</Label>
              <Textarea
                id="mood_state"
                value={formData.psychological_evaluation.mood_state}
                onChange={(e) => handleInputChange('psychological_evaluation', 'mood_state', e.target.value)}
                placeholder="Describa su estado de ánimo general..."
              />
            </div>

            <div>
              <Label htmlFor="anxiety_level">Nivel de Ansiedad</Label>
              <Input
                id="anxiety_level"
                value={formData.psychological_evaluation.anxiety_level}
                onChange={(e) => handleInputChange('psychological_evaluation', 'anxiety_level', e.target.value)}
                placeholder="Bajo, medio, alto"
              />
            </div>

            <div>
              <Label htmlFor="sleep_patterns">Patrones de Sueño</Label>
              <Textarea
                id="sleep_patterns"
                value={formData.psychological_evaluation.sleep_patterns}
                onChange={(e) => handleInputChange('psychological_evaluation', 'sleep_patterns', e.target.value)}
                placeholder="Horas de sueño, calidad, problemas para dormir..."
              />
            </div>

            <div>
              <Label htmlFor="appetite">Apetito</Label>
              <Input
                id="appetite"
                value={formData.psychological_evaluation.appetite}
                onChange={(e) => handleInputChange('psychological_evaluation', 'appetite', e.target.value)}
                placeholder="Normal, aumentado, disminuido"
              />
            </div>

            <div>
              <Label htmlFor="social_functioning">Funcionamiento Social</Label>
              <Textarea
                id="social_functioning"
                value={formData.psychological_evaluation.social_functioning}
                onChange={(e) => handleInputChange('psychological_evaluation', 'social_functioning', e.target.value)}
                placeholder="Relaciones sociales, trabajo, actividades diarias..."
              />
            </div>

            <div>
              <Label htmlFor="coping_mechanisms">Mecanismos de Afrontamiento</Label>
              <Textarea
                id="coping_mechanisms"
                value={formData.psychological_evaluation.coping_mechanisms}
                onChange={(e) => handleInputChange('psychological_evaluation', 'coping_mechanisms', e.target.value)}
                placeholder="Cómo maneja el estrés y los problemas..."
              />
            </div>
          </div>
        );

      case 'observations':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="general_observations">Observaciones Generales</Label>
              <Textarea
                id="general_observations"
                value={formData.observations.general_observations}
                onChange={(e) => handleInputChange('observations', 'general_observations', e.target.value)}
                placeholder="Observaciones generales durante la entrevista..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="behavioral_observations">Observaciones Conductuales</Label>
              <Textarea
                id="behavioral_observations"
                value={formData.observations.behavioral_observations}
                onChange={(e) => handleInputChange('observations', 'behavioral_observations', e.target.value)}
                placeholder="Comportamiento, postura, movimientos..."
              />
            </div>

            <div>
              <Label htmlFor="cognitive_observations">Observaciones Cognitivas</Label>
              <Textarea
                id="cognitive_observations"
                value={formData.observations.cognitive_observations}
                onChange={(e) => handleInputChange('observations', 'cognitive_observations', e.target.value)}
                placeholder="Atención, memoria, orientación, lenguaje..."
              />
            </div>

            <div>
              <Label htmlFor="emotional_observations">Observaciones Emocionales</Label>
              <Textarea
                id="emotional_observations"
                value={formData.observations.emotional_observations}
                onChange={(e) => handleInputChange('observations', 'emotional_observations', e.target.value)}
                placeholder="Estado emocional, reactividad, expresión afectiva..."
              />
            </div>

            <div>
              <Label htmlFor="recommendations">Recomendaciones</Label>
              <Textarea
                id="recommendations"
                value={formData.observations.recommendations}
                onChange={(e) => handleInputChange('observations', 'recommendations', e.target.value)}
                placeholder="Recomendaciones iniciales y plan de tratamiento..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r">
            <DialogHeader className="p-6 border-b">
              <DialogTitle className="text-lg">
                Historia Clínica
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {patient?.first_name} {patient?.last_name}
              </p>
            </DialogHeader>

            <ScrollArea className="h-full pb-20">
              <div className="p-4 space-y-2">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      currentStep === index
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${
                      currentStep === index ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}>
                      <section.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {section.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {section.description}
                      </p>
                    </div>
                    {currentStep > index && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Bottom actions in sidebar */}
            <div className="absolute bottom-0 left-0 right-64 p-4 bg-gray-50 border-t">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex-1"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Anterior
                </Button>
                {currentStep === sections.length - 1 ? (
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1"
                    size="sm"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    className="flex-1"
                    size="sm"
                  >
                    Siguiente
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {sections[currentStep].title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {sections[currentStep].description}
                  </p>
                </div>
                <Badge variant="secondary">
                  {currentStep + 1} de {sections.length}
                </Badge>
              </div>
              <Progress 
                value={((currentStep + 1) / sections.length) * 100} 
                className="h-2"
              />
            </div>

            {/* Form Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl">
                {renderCurrentSection()}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnamnesisForm;