import requests
import sys
import json
from datetime import datetime

class PsychologyPortalAPITester:
    def __init__(self, base_url="https://mindtrack-pro.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.patient_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_init_super_admin(self):
        """Initialize super admin if needed"""
        print("\n🚀 Initializing Super Admin...")
        success, response = self.run_test(
            "Initialize Super Admin",
            "POST",
            "init/super-admin",
            200
        )
        if not success:
            # Super admin might already exist, which is fine
            print("   Note: Super admin might already exist")
        return True

    def test_login(self, email="admin@psychologyportal.com", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            print(f"   Logged in as: {self.user_data.get('full_name', 'Unknown')}")
            print(f"   Role: {self.user_data.get('role', 'Unknown')}")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_patient(self):
        """Create a test patient"""
        patient_data = {
            "first_name": "Juan",
            "last_name": "Pérez",
            "email": "juan.perez@test.com",
            "phone": "+1234567890",
            "date_of_birth": "2010-05-15",
            "gender": "male",
            "address": "123 Test Street"
        }
        
        success, response = self.run_test(
            "Create Patient",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        
        if success and 'id' in response:
            self.patient_id = response['id']
            print(f"   Created patient with ID: {self.patient_id}")
            return response['id']
        return None

    def test_get_patients(self):
        """Get all patients"""
        success, response = self.run_test(
            "Get Patients",
            "GET",
            "patients",
            200
        )
        
        if success:
            print(f"   Found {len(response)} patients")
            return response
        return []

    def test_get_patient_by_id(self, patient_id):
        """Get a specific patient by ID"""
        success, response = self.run_test(
            "Get Patient by ID",
            "GET",
            f"patients/{patient_id}",
            200
        )
        return success

    def test_create_center(self):
        """Test creating a center (Super Admin only)"""
        center_data = {
            "name": "Test Psychology Center",
            "address": "456 Center Ave, City, State 12345",
            "phone": "+1987654321",
            "email": "center@example.com"
        }
        
        success, response = self.run_test(
            "Create Center",
            "POST",
            "centers",
            200,
            data=center_data
        )
        return success

    def test_get_centers(self):
        """Test getting all centers (Super Admin only)"""
        success, response = self.run_test(
            "Get Centers",
            "GET",
            "centers",
            200
        )
        return success

    def test_patient_clinical_operations(self, patient_id):
        """Test clinical operations on a patient"""
        # Test clinical history update
        clinical_history = {
            "patient_id": patient_id,
            "chief_complaint": "Anxiety and stress management",
            "history_of_present_illness": "Patient reports increased anxiety over the past 6 months",
            "past_medical_history": "No significant medical history",
            "family_history": "Family history of anxiety disorders",
            "social_history": "Works full-time, lives alone",
            "created_by": self.user_data.get('id', '')
        }
        
        success1, _ = self.run_test(
            "Update Clinical History",
            "PUT",
            f"patients/{patient_id}/clinical-history",
            200,
            data=clinical_history
        )

        # Test adding evaluation
        evaluation = {
            "patient_id": patient_id,
            "evaluation_type": "Initial Assessment",
            "evaluation_date": "2024-01-15",
            "results": {"anxiety_score": 7, "depression_score": 3},
            "notes": "Patient shows moderate anxiety levels",
            "created_by": self.user_data.get('id', '')
        }
        
        success2, _ = self.run_test(
            "Add Evaluation",
            "POST",
            f"patients/{patient_id}/evaluations",
            200,
            data=evaluation
        )

        # Test updating diagnosis
        diagnosis = {
            "patient_id": patient_id,
            "primary_diagnosis": "Generalized Anxiety Disorder",
            "secondary_diagnosis": "Adjustment Disorder",
            "dsm5_codes": ["F41.1", "F43.20"],
            "severity": "Moderate",
            "notes": "Patient meets criteria for GAD",
            "created_by": self.user_data.get('id', '')
        }
        
        success3, _ = self.run_test(
            "Update Diagnosis",
            "PUT",
            f"patients/{patient_id}/diagnosis",
            200,
            data=diagnosis
        )

        # Test adding progress note
        progress_note = {
            "patient_id": patient_id,
            "session_date": "2024-01-22",
            "session_type": "Individual Therapy",
            "duration_minutes": 50,
            "objectives": ["Reduce anxiety symptoms", "Improve coping strategies"],
            "interventions": ["CBT techniques", "Breathing exercises"],
            "progress": "Patient showed good engagement and understanding",
            "homework_assigned": "Practice daily breathing exercises",
            "next_session_plan": "Continue CBT work on thought patterns",
            "created_by": self.user_data.get('id', '')
        }
        
        success4, _ = self.run_test(
            "Add Progress Note",
            "POST",
            f"patients/{patient_id}/progress-notes",
            200,
            data=progress_note
        )

        return all([success1, success2, success3, success4])

    def test_anamnesis_apis(self):
        """Test all anamnesis-related APIs"""
        print("\n" + "="*50)
        print("🧠 TESTING ANAMNESIS APIs")
        print("="*50)
        
        if not self.patient_id:
            print("❌ No patient ID available for anamnesis testing")
            return False

        # Test anamnesis data structure (comprehensive medical form)
        anamnesis_data = {
            "general_data": {
                "patient_name": "Juan Pérez",
                "birth_date": "2010-05-15",
                "birth_place": "Lima, Perú",
                "age_years": 13,
                "age_months": 8,
                "education_level": "Secundaria",
                "informants": ["Madre", "Padre"],
                "father_data": {
                    "name": "Carlos Pérez",
                    "age": "45",
                    "education": "Universitaria",
                    "occupation": "Ingeniero"
                },
                "mother_data": {
                    "name": "María González",
                    "age": "42",
                    "education": "Universitaria",
                    "occupation": "Profesora"
                },
                "siblings_data": []
            },
            "consultation_motive": {
                "difficulty_presentation": "Dificultades de atención en clase detectadas por la profesora hace 6 meses",
                "when_where_who": "Se presenta principalmente en el colegio durante las clases",
                "evolution": "Ha empeorado gradualmente, especialmente en matemáticas",
                "solutions_attempted": "Refuerzo escolar y cambio de rutina de estudio",
                "perceived_cause": "Posible déficit de atención, estrés académico",
                "treatments_received": "Ninguno hasta la fecha",
                "current_illness": {
                    "syndrome_time_years": "0",
                    "syndrome_time_months": "6",
                    "syndrome_time_days": "0",
                    "onset_type": "insidioso",
                    "main_symptoms": "Falta de concentración, distracción fácil, olvidos frecuentes",
                    "important_stressors": "Cambio de colegio, separación temporal de los padres",
                    "pharmacological_treatments": "Ninguno"
                }
            },
            "evolutionary_history": {
                "prenatal": {
                    "pregnancy_number": "1",
                    "pregnancy_conditions": "Normal",
                    "planned_desired": "Sí",
                    "control_type": "Médico privado",
                    "diseases_difficulties": "Ninguna",
                    "medications_xrays": "Vitaminas prenatales",
                    "alcohol_tobacco_drugs": "No",
                    "losses": "No"
                },
                "perinatal": {
                    "birth_time": "40 semanas",
                    "attended_by": "Médico obstetra",
                    "delivery_type": "Parto natural",
                    "anesthesia": "Epidural",
                    "instruments": "No",
                    "weight_height": "3.2kg, 50cm",
                    "cry_coloration": "Inmediato, rosado",
                    "reanimation": "No requerida",
                    "parents_age": {"father": "32", "mother": "29"}
                },
                "postnatal": {
                    "malformations": "No",
                    "breastfeeding": "6 meses exclusiva",
                    "sucking_difficulties": "No",
                    "postpartum_difficulties": "No"
                }
            },
            "medical_history": {
                "current_health": "Buena",
                "main_diseases": "Ninguna significativa",
                "medications": "Ninguna",
                "accidents": "Caída menor a los 8 años",
                "operations": {"performed": "No", "which": "", "why": ""},
                "exams": {"performed": "Sí", "results": "Exámenes de rutina normales"}
            },
            "neuromuscular_development": {
                "motor_milestones": {
                    "lift_head": "2 meses",
                    "sit_without_help": "6 meses",
                    "crawl": "8 meses",
                    "stand_without_help": "10 meses",
                    "walk": "12 meses"
                },
                "difficulties": {
                    "tendency_fall": False,
                    "tendency_hit": False
                },
                "automatic_movements": {
                    "balancing": "Normal",
                    "other_movements": "Normal"
                },
                "motor_skills": {
                    "run": "Normal",
                    "jump": "Normal",
                    "stand_one_foot": "Normal",
                    "hop_one_foot": "Normal"
                },
                "lateral_dominance": "Diestro"
            },
            "speech_history": {
                "speech_development": {
                    "babble_age": "6 meses",
                    "first_words": "12 meses",
                    "first_words_which": "Mamá, papá",
                    "understanding_way": "Buena comprensión",
                    "speech_frequency": "Normal",
                    "pronunciation_difficulties": "Ninguna"
                },
                "oral_movements": {
                    "bottle_use": "Hasta los 18 meses",
                    "food_consumption": "Variada",
                    "eats_well": "Sí",
                    "preferred_foods": "Frutas, pasta"
                }
            },
            "habits_formation": {
                "feeding": {
                    "breastfeeding_type": "Exclusiva",
                    "breastfeeding_duration": "6 meses",
                    "first_teeth_age": "6 meses",
                    "solid_foods_age": "6 meses"
                },
                "hygiene": {
                    "urine_control_age": "2.5 años",
                    "daytime_control": "Completo",
                    "nighttime_control": "Completo"
                },
                "sleep": {
                    "duration": "9-10 horas",
                    "medication_use": "No",
                    "nocturnal_fears": "Ocasionales",
                    "sleep_behaviors": {
                        "talks": False,
                        "screams": False,
                        "moves": True,
                        "sweats": False,
                        "walks": False,
                        "resists_bedtime": False
                    }
                },
                "personal_independence": {
                    "does_errands": "Sí",
                    "home_errands": "Ayuda con tareas simples",
                    "helps_at_home": "Sí"
                }
            },
            "conduct": {
                "maladaptive_behaviors": {
                    "bites_nails": True,
                    "sucks_fingers": False,
                    "bites_lip": False,
                    "sweaty_hands": True,
                    "trembling_hands_legs": False,
                    "unprovoked_aggression": False,
                    "drops_things_easily": True
                },
                "other_problems": "Dificultad para concentrarse en tareas largas",
                "child_character": "Sociable, activo, algo impulsivo pero cariñoso"
            },
            "play": {
                "play_preferences": {
                    "plays_alone": "A veces",
                    "why_alone": "Cuando está concentrado en algo específico",
                    "preferred_games": "Videojuegos, fútbol, construcción",
                    "favorite_toys": "Legos, pelota, tablet"
                }
            },
            "educational_history": {
                "initial_education": {
                    "age": "3 años",
                    "adaptation": "Buena",
                    "difficulties": "Ninguna"
                },
                "primary_secondary": {
                    "age": "6 años",
                    "performance": "Bueno hasta 6to grado",
                    "difficulties": "Matemáticas en secundaria"
                },
                "learning_difficulties": {
                    "observed": "Sí",
                    "since_when": "Inicio de secundaria",
                    "actions_taken": "Refuerzo académico"
                },
                "special_services": {
                    "received": "No",
                    "logopedia": "No",
                    "reinforcement": "Sí"
                }
            },
            "psychosexuality": {
                "sexual_questions_age": "8 años",
                "information_provided": "Información básica apropiada para la edad",
                "opposite_sex_friends": True,
                "genital_behaviors": {
                    "present": "No",
                    "frequency": "",
                    "circumstances": ""
                }
            },
            "parental_attitudes": {
                "parental_reactions": ["Preocupación", "Apoyo", "Búsqueda de ayuda"],
                "beliefs_guilt": "Los padres se sienten algo culpables por la separación temporal",
                "behavioral_changes": "Más atención y estructura en casa",
                "punishment_use": {
                    "method": "Pérdida de privilegios",
                    "frequency": "Ocasional",
                    "child_reaction": "Acepta las consecuencias"
                },
                "child_behavior": {
                    "with_parents": "Cariñoso y obediente",
                    "with_siblings": "No aplica",
                    "with_friends": "Sociable y popular",
                    "with_others": "Respetuoso"
                }
            },
            "family_history": {
                "psychiatric_diseases": False,
                "speech_problems": False,
                "learning_difficulties": True,
                "epilepsy_convulsions": False,
                "mental_retardation": False,
                "other_conditions": "Tío paterno con TDAH",
                "parents_character": "Padres responsables, algo ansiosos",
                "couple_relationship": "En proceso de reconciliación"
            },
            "interview_observations": "El niño se mostró colaborativo durante la entrevista. Presenta signos de ansiedad leve. Los padres muestran buena disposición para el tratamiento."
        }

        # Test 1: Create anamnesis
        success, response = self.run_test(
            "Create Anamnesis (POST)",
            "POST",
            f"patients/{self.patient_id}/anamnesis",
            200,
            data=anamnesis_data
        )
        
        if not success:
            print("❌ Failed to create anamnesis")
            return False

        # Test 2: Get anamnesis
        success, response = self.run_test(
            "Get Anamnesis (GET)",
            "GET",
            f"patients/{self.patient_id}/anamnesis",
            200
        )
        
        if not success:
            print("❌ Failed to get anamnesis")
            return False

        # Test 3: Update anamnesis
        updated_data = anamnesis_data.copy()
        updated_data["interview_observations"] = "Observaciones actualizadas durante la segunda entrevista."
        updated_data["general_data"]["age_years"] = 14
        
        success, response = self.run_test(
            "Update Anamnesis (PUT)",
            "PUT",
            f"patients/{self.patient_id}/anamnesis",
            200,
            data=updated_data
        )
        
        if not success:
            print("❌ Failed to update anamnesis")
            return False

        # Test 4: Verify update
        success, response = self.run_test(
            "Verify Anamnesis Update",
            "GET",
            f"patients/{self.patient_id}/anamnesis",
            200
        )
        
        if success and response.get('anamnesis', {}).get('interview_observations') == "Observaciones actualizadas durante la segunda entrevista.":
            print("✅ Anamnesis update verified successfully")
        else:
            print("❌ Anamnesis update verification failed")
            return False

        # Test 5: Verify patient shows anamnesis
        success, response = self.run_test(
            "Get Patient with Anamnesis",
            "GET",
            f"patients/{self.patient_id}",
            200
        )
        
        if success and response.get('anamnesis'):
            print("✅ Patient correctly shows anamnesis data")
        else:
            print("❌ Patient does not show anamnesis data")
            return False

        print("🎉 All anamnesis API tests passed!")
        return True

    def test_anamnesis_error_cases(self):
        """Test anamnesis error handling"""
        print("\n📋 Testing Anamnesis Error Cases...")
        
        # Test with non-existent patient
        success, response = self.run_test(
            "Get Anamnesis for Non-existent Patient",
            "GET",
            "patients/non-existent-id/anamnesis",
            404
        )
        
        if not success:
            print("❌ Error handling for non-existent patient failed")
            return False

        # Test without authentication
        old_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Access Anamnesis without Authentication",
            "GET",
            f"patients/{self.patient_id}/anamnesis",
            401
        )
        
        self.token = old_token
        
        if not success:
            print("❌ Error handling for unauthorized access failed")
            return False

        print("✅ Anamnesis error handling tests passed!")
        return True

    def test_appointments_apis(self):
        """Test all appointment-related APIs"""
        print("\n" + "="*50)
        print("📅 TESTING APPOINTMENTS APIs")
        print("="*50)
        
        if not self.patient_id:
            print("❌ No patient ID available for appointment testing")
            return False

        # Test 1: Create appointment
        appointment_data = {
            "patient_id": self.patient_id,
            "appointment_date": "2024-02-15",
            "appointment_time": "10:00",
            "duration_minutes": 60,
            "appointment_type": "therapy",
            "notes": "Sesión de terapia cognitivo-conductual",
            "session_objectives": [
                "Trabajar técnicas de relajación",
                "Revisar tareas de la semana anterior"
            ]
        }
        
        success, response = self.run_test(
            "Create Appointment (POST)",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        if not success:
            print("❌ Failed to create appointment")
            return False
        
        appointment_id = response.get('id')
        if not appointment_id:
            print("❌ No appointment ID returned")
            return False

        # Test 2: Get all appointments
        success, response = self.run_test(
            "Get All Appointments (GET)",
            "GET",
            "appointments",
            200
        )
        
        if not success:
            print("❌ Failed to get appointments")
            return False
        
        print(f"   Found {len(response)} appointments")

        # Test 3: Get specific appointment
        success, response = self.run_test(
            "Get Specific Appointment (GET)",
            "GET",
            f"appointments/{appointment_id}",
            200
        )
        
        if not success:
            print("❌ Failed to get specific appointment")
            return False

        # Test 4: Update appointment
        update_data = {
            "appointment_time": "11:00",
            "status": "completed",
            "notes": "Sesión completada exitosamente"
        }
        
        success, response = self.run_test(
            "Update Appointment (PUT)",
            "PUT",
            f"appointments/{appointment_id}",
            200,
            data=update_data
        )
        
        if not success:
            print("❌ Failed to update appointment")
            return False

        # Test 5: Get appointments with filters
        success, response = self.run_test(
            "Get Appointments with Patient Filter",
            "GET",
            f"appointments?patient_id={self.patient_id}",
            200
        )
        
        if not success:
            print("❌ Failed to get filtered appointments")
            return False

        print("🎉 All appointment API tests passed!")
        return True

    def test_session_objectives_apis(self):
        """Test all session objectives APIs"""
        print("\n" + "="*50)
        print("🎯 TESTING SESSION OBJECTIVES APIs")
        print("="*50)
        
        if not self.patient_id:
            print("❌ No patient ID available for session objectives testing")
            return False

        # Test 1: Create session objective
        objective_data = {
            "patient_id": self.patient_id,
            "week_start_date": "2024-02-12",  # Monday
            "objective_title": "Reducir ansiedad matutina",
            "objective_description": "Implementar técnicas de respiración profunda cada mañana durante 10 minutos",
            "priority": "high",
            "target_date": "2024-02-18"
        }
        
        success, response = self.run_test(
            "Create Session Objective (POST)",
            "POST",
            "session-objectives",
            200,
            data=objective_data
        )
        
        if not success:
            print("❌ Failed to create session objective")
            return False
        
        objective_id = response.get('id')
        if not objective_id:
            print("❌ No objective ID returned")
            return False

        # Test 2: Create another objective
        objective_data2 = {
            "patient_id": self.patient_id,
            "week_start_date": "2024-02-12",
            "objective_title": "Mejorar patrones de sueño",
            "objective_description": "Establecer rutina de sueño consistente, acostarse a las 10 PM",
            "priority": "medium",
            "target_date": "2024-02-25"
        }
        
        success, response = self.run_test(
            "Create Second Session Objective (POST)",
            "POST",
            "session-objectives",
            200,
            data=objective_data2
        )
        
        if not success:
            print("❌ Failed to create second session objective")
            return False

        # Test 3: Get all session objectives
        success, response = self.run_test(
            "Get All Session Objectives (GET)",
            "GET",
            "session-objectives",
            200
        )
        
        if not success:
            print("❌ Failed to get session objectives")
            return False
        
        print(f"   Found {len(response)} session objectives")

        # Test 4: Get objectives for specific patient
        success, response = self.run_test(
            "Get Objectives for Patient",
            "GET",
            f"session-objectives?patient_id={self.patient_id}",
            200
        )
        
        if not success:
            print("❌ Failed to get patient objectives")
            return False

        # Test 5: Update objective status
        update_data = {
            "status": "completed",
            "completion_notes": "Objetivo completado exitosamente. Paciente reporta mejora significativa."
        }
        
        success, response = self.run_test(
            "Update Session Objective (PUT)",
            "PUT",
            f"session-objectives/{objective_id}",
            200,
            data=update_data
        )
        
        if not success:
            print("❌ Failed to update session objective")
            return False

        # Test 6: Get objectives by week
        success, response = self.run_test(
            "Get Objectives by Week",
            "GET",
            "session-objectives?week_start_date=2024-02-12",
            200
        )
        
        if not success:
            print("❌ Failed to get objectives by week")
            return False

        print("🎉 All session objectives API tests passed!")
        return True

    def test_payments_apis(self):
        """Test all payment-related APIs"""
        print("\n" + "="*50)
        print("💰 TESTING PAYMENTS APIs")
        print("="*50)
        
        if not self.patient_id:
            print("❌ No patient ID available for payment testing")
            return False

        # Test 1: Create payment
        payment_data = {
            "patient_id": self.patient_id,
            "amount": 150.00,
            "payment_date": "2024-02-15",
            "session_date": "2024-02-15",
            "payment_method": "efectivo",
            "notes": "Pago por sesión de terapia individual"
        }
        
        success, response = self.run_test(
            "Create Payment (POST)",
            "POST",
            "payments",
            200,
            data=payment_data
        )
        
        if not success:
            print("❌ Failed to create payment")
            return False
        
        payment_id = response.get('id')
        if not payment_id:
            print("❌ No payment ID returned")
            return False

        # Test 2: Create additional payments for stats testing
        payments_data = [
            {
                "patient_id": self.patient_id,
                "amount": 150.00,
                "payment_date": "2024-02-14",
                "session_date": "2024-02-14",
                "payment_method": "tarjeta",
                "notes": "Pago por sesión anterior"
            },
            {
                "patient_id": self.patient_id,
                "amount": 175.00,
                "payment_date": "2024-02-13",
                "session_date": "2024-02-13",
                "payment_method": "transferencia",
                "notes": "Pago por evaluación inicial"
            }
        ]
        
        for i, payment in enumerate(payments_data):
            success, response = self.run_test(
                f"Create Additional Payment {i+1}",
                "POST",
                "payments",
                200,
                data=payment
            )
            if not success:
                print(f"❌ Failed to create additional payment {i+1}")

        # Test 3: Get all payments
        success, response = self.run_test(
            "Get All Payments (GET)",
            "GET",
            "payments",
            200
        )
        
        if not success:
            print("❌ Failed to get payments")
            return False
        
        print(f"   Found {len(response)} payments")

        # Test 4: Get payments with date filter
        success, response = self.run_test(
            "Get Payments with Date Filter",
            "GET",
            "payments?start_date=2024-02-13&end_date=2024-02-15",
            200
        )
        
        if not success:
            print("❌ Failed to get filtered payments")
            return False

        # Test 5: Get payments for specific patient
        success, response = self.run_test(
            "Get Payments for Patient",
            "GET",
            f"payments?patient_id={self.patient_id}",
            200
        )
        
        if not success:
            print("❌ Failed to get patient payments")
            return False

        # Test 6: Get payment statistics
        success, response = self.run_test(
            "Get Payment Statistics (GET)",
            "GET",
            "payments/stats",
            200
        )
        
        if not success:
            print("❌ Failed to get payment statistics")
            return False
        
        # Verify stats structure
        expected_keys = ['daily_total', 'weekly_total', 'monthly_total', 'total_payments', 'average_per_session']
        if all(key in response for key in expected_keys):
            print("✅ Payment statistics structure is correct")
            print(f"   Daily total: ${response.get('daily_total', 0)}")
            print(f"   Weekly total: ${response.get('weekly_total', 0)}")
            print(f"   Monthly total: ${response.get('monthly_total', 0)}")
            print(f"   Total payments: {response.get('total_payments', 0)}")
            print(f"   Average per session: ${response.get('average_per_session', 0)}")
        else:
            print("❌ Payment statistics structure is incorrect")
            return False

        # Test 7: Update payment
        update_data = {
            "amount": 160.00,
            "notes": "Pago actualizado - incluye descuento por puntualidad"
        }
        
        success, response = self.run_test(
            "Update Payment (PUT)",
            "PUT",
            f"payments/{payment_id}",
            200,
            data=update_data
        )
        
        if not success:
            print("❌ Failed to update payment")
            return False

        print("🎉 All payment API tests passed!")
        return True

def main():
    print("🏥 Psychology Practice Management System - API Testing")
    print("=" * 60)
    
    tester = PsychologyPortalAPITester()
    
    # Test sequence
    print("\n📋 Starting API Tests...")
    
    # 1. Initialize super admin
    tester.test_init_super_admin()
    
    # 2. Test authentication
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
    
    # 3. Test user info
    tester.test_get_current_user()
    
    # 4. Test center management (Super Admin only)
    if tester.user_data.get('role') == 'super_admin':
        tester.test_create_center()
        tester.test_get_centers()
    
    # 5. Test patient management
    patient_id = tester.test_create_patient()
    if not patient_id:
        print("❌ Patient creation failed, stopping patient tests")
    else:
        # Test getting patients
        patients = tester.test_get_patients()
        
        # Test getting specific patient
        tester.test_get_patient_by_id(patient_id)
        
        # Test clinical operations
        tester.test_patient_clinical_operations(patient_id)
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())