#!/usr/bin/env python3
"""
Focused Anamnesis Testing Script
Tests specifically the anamnesis (clinical history) functionality as requested by the user.
"""

import requests
import json
from datetime import datetime

class AnamnesisSpecificTester:
    def __init__(self, base_url="https://mindtrack-pro.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.existing_patients = []

    def login(self, email="admin@psychologyportal.com", password="admin123"):
        """Login and get authentication token"""
        print("🔐 Logging in...")
        url = f"{self.api_url}/auth/login"
        data = {"email": email, "password": password}
        
        try:
            response = requests.post(url, json=data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                self.token = result['access_token']
                self.user_data = result.get('user', {})
                print(f"✅ Login successful as: {self.user_data.get('full_name', 'Unknown')}")
                print(f"   Role: {self.user_data.get('role', 'Unknown')}")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False

    def get_existing_patients(self):
        """Get list of existing patients"""
        print("\n👥 Getting existing patients...")
        url = f"{self.api_url}/patients"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                self.existing_patients = response.json()
                print(f"✅ Found {len(self.existing_patients)} existing patients:")
                for i, patient in enumerate(self.existing_patients[:5]):  # Show first 5
                    print(f"   {i+1}. {patient.get('first_name', '')} {patient.get('last_name', '')} (ID: {patient.get('id', '')})")
                return True
            else:
                print(f"❌ Failed to get patients: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error getting patients: {str(e)}")
            return False

    def create_comprehensive_anamnesis(self, patient_id, patient_name="Paciente de Prueba"):
        """Create a comprehensive anamnesis with realistic psychology data"""
        print(f"\n📋 Creating comprehensive anamnesis for patient {patient_id}...")
        
        # Comprehensive anamnesis data with realistic psychology practice information
        anamnesis_data = {
            "general_data": {
                "patient_name": patient_name,
                "birth_date": "2010-03-15",
                "birth_place": "Lima, Perú",
                "age_years": 14,
                "age_months": 5,
                "education_level": "Secundaria - 2do año",
                "informants": ["Madre - María González", "Padre - Carlos Pérez"],
                "father_data": {
                    "name": "Carlos Pérez",
                    "age": "45",
                    "education": "Universitaria completa",
                    "occupation": "Ingeniero de sistemas",
                    "civil_status": "Casado"
                },
                "mother_data": {
                    "name": "María González",
                    "age": "42",
                    "education": "Universitaria completa",
                    "occupation": "Profesora de primaria",
                    "civil_status": "Casada"
                },
                "siblings_data": [
                    {
                        "name": "Ana Pérez",
                        "age": "10",
                        "relationship": "Hermana menor",
                        "education": "Primaria - 5to grado"
                    }
                ]
            },
            "consultation_motive": {
                "difficulty_presentation": "Dificultades de concentración y atención en el ámbito escolar, reportadas por profesores hace aproximadamente 8 meses. Presenta bajo rendimiento académico especialmente en matemáticas y ciencias.",
                "when_where_who": "Las dificultades se manifiestan principalmente en el colegio durante las clases que requieren mayor concentración. Los profesores reportan que se distrae fácilmente y no completa las tareas asignadas.",
                "evolution": "El problema ha ido empeorando gradualmente. Inicialmente solo se presentaba en matemáticas, pero ahora se extiende a otras materias. Los padres también notan dificultades en casa para hacer tareas.",
                "solutions_attempted": "Los padres han intentado: cambio de rutina de estudio, refuerzo escolar con profesora particular, reducción de tiempo de pantalla, establecimiento de horarios más estrictos.",
                "perceived_cause": "Los padres sospechan posible déficit de atención. También consideran que el estrés por cambio de colegio y problemas familiares temporales pueden haber influido.",
                "treatments_received": "No ha recibido tratamiento psicológico ni psiquiátrico previo. Solo apoyo pedagógico.",
                "current_illness": {
                    "syndrome_time_years": "0",
                    "syndrome_time_months": "8",
                    "syndrome_time_days": "15",
                    "onset_type": "Insidioso y progresivo",
                    "main_symptoms": "Falta de concentración, distracción fácil, olvidos frecuentes, dificultad para completar tareas, inquietud motora leve",
                    "important_stressors": "Cambio de colegio hace 10 meses, separación temporal de los padres (3 meses), nacimiento de prima cercana",
                    "pharmacological_treatments": "Ninguno"
                }
            },
            "evolutionary_history": {
                "prenatal": {
                    "pregnancy_number": "Primera gestación",
                    "pregnancy_conditions": "Embarazo normal sin complicaciones",
                    "planned_desired": "Embarazo planificado y deseado por ambos padres",
                    "control_type": "Control médico privado mensual",
                    "diseases_difficulties": "Náuseas leves en primer trimestre, sin otras complicaciones",
                    "medications_xrays": "Vitaminas prenatales, ácido fólico. No rayos X",
                    "alcohol_tobacco_drugs": "No consumo de alcohol, tabaco ni drogas",
                    "losses": "No pérdidas previas"
                },
                "perinatal": {
                    "birth_time": "39 semanas y 4 días",
                    "attended_by": "Médico obstetra especialista",
                    "delivery_type": "Parto vaginal normal",
                    "anesthesia": "Anestesia epidural",
                    "instruments": "No se utilizaron instrumentos",
                    "weight_height": "3.1 kg, 49 cm",
                    "cry_coloration": "Llanto inmediato, coloración rosada normal",
                    "reanimation": "No requirió reanimación",
                    "parents_age": {
                        "father": "31 años",
                        "mother": "28 años"
                    }
                },
                "postnatal": {
                    "malformations": "No se observaron malformaciones",
                    "breastfeeding": "Lactancia materna exclusiva por 6 meses",
                    "sucking_difficulties": "No presentó dificultades para succionar",
                    "postpartum_difficulties": "No hubo complicaciones postparto"
                }
            },
            "medical_history": {
                "current_health": "Buena salud general, sin enfermedades crónicas",
                "main_diseases": "Varicela a los 5 años, gripes estacionales comunes",
                "medications": "No toma medicamentos de forma regular",
                "accidents": "Caída de bicicleta a los 8 años con raspones menores, sin fracturas",
                "operations": {
                    "performed": "No",
                    "which": "",
                    "why": ""
                },
                "exams": {
                    "performed": "Sí",
                    "results": "Exámenes de rutina anuales normales. Última evaluación oftalmológica normal."
                }
            },
            "neuromuscular_development": {
                "motor_milestones": {
                    "lift_head": "2 meses",
                    "sit_without_help": "6 meses",
                    "crawl": "8 meses",
                    "stand_without_help": "10 meses",
                    "walk": "12 meses",
                    "run": "18 meses",
                    "jump": "24 meses"
                },
                "difficulties": {
                    "tendency_fall": False,
                    "tendency_hit": False,
                    "clumsiness": True
                },
                "automatic_movements": {
                    "balancing": "Normal",
                    "coordination": "Ligeramente por debajo del promedio",
                    "other_movements": "Movimientos normales"
                },
                "motor_skills": {
                    "run": "Normal",
                    "jump": "Normal",
                    "stand_one_foot": "Normal",
                    "hop_one_foot": "Normal",
                    "fine_motor": "Dificultades leves con escritura"
                },
                "lateral_dominance": "Diestro establecido"
            },
            "speech_history": {
                "speech_development": {
                    "babble_age": "6 meses",
                    "first_words": "11 meses",
                    "first_words_which": "Mamá, papá, agua",
                    "first_sentences": "24 meses",
                    "understanding_way": "Comprensión adecuada para la edad",
                    "speech_frequency": "Habla con frecuencia normal",
                    "pronunciation_difficulties": "Dificultades leves con 'rr' hasta los 6 años"
                },
                "oral_movements": {
                    "bottle_use": "Hasta los 18 meses",
                    "pacifier_use": "Hasta los 2 años",
                    "food_consumption": "Dieta variada y balanceada",
                    "eats_well": "Sí, buen apetito",
                    "preferred_foods": "Frutas, pasta, pollo",
                    "rejected_foods": "Verduras verdes, pescado"
                }
            },
            "habits_formation": {
                "feeding": {
                    "breastfeeding_type": "Lactancia materna exclusiva",
                    "breastfeeding_duration": "6 meses exclusiva, mixta hasta 12 meses",
                    "first_teeth_age": "6 meses",
                    "solid_foods_age": "6 meses",
                    "eating_independence": "Independiente desde los 3 años"
                },
                "hygiene": {
                    "urine_control_age": "2 años y 6 meses",
                    "daytime_control": "Control completo diurno",
                    "nighttime_control": "Control nocturno desde los 3 años",
                    "hygiene_independence": "Independiente en higiene personal"
                },
                "sleep": {
                    "duration": "9-10 horas por noche",
                    "bedtime": "21:30 horas",
                    "wake_time": "7:00 horas",
                    "medication_use": "No requiere medicación",
                    "nocturnal_fears": "Ocasionales, relacionadas con películas",
                    "sleep_behaviors": {
                        "talks": False,
                        "screams": False,
                        "moves": True,
                        "sweats": False,
                        "walks": False,
                        "resists_bedtime": True,
                        "nightmares": "Ocasionales"
                    }
                },
                "personal_independence": {
                    "does_errands": "Sí, mandados simples en el barrio",
                    "home_errands": "Ayuda con tareas domésticas básicas",
                    "helps_at_home": "Colabora con orden de su cuarto y mesa",
                    "money_management": "Maneja dinero para compras pequeñas"
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
                    "drops_things_easily": True,
                    "fidgeting": True,
                    "difficulty_sitting_still": True
                },
                "other_problems": "Dificultad para mantener atención en tareas largas, tendencia a postergar deberes, olvida materiales escolares frecuentemente",
                "child_character": "Niño sociable, cariñoso, activo, algo impulsivo pero con buen corazón. Le gusta ayudar a otros y es empático."
            },
            "play": {
                "play_preferences": {
                    "plays_alone": "A veces, especialmente con videojuegos",
                    "why_alone": "Cuando está muy concentrado en algo que le interesa mucho",
                    "preferred_games": "Videojuegos de estrategia, fútbol, juegos de construcción",
                    "favorite_toys": "Legos, consola de videojuegos, pelota de fútbol",
                    "imaginative_play": "Le gusta crear historias con sus juguetes"
                },
                "social_play": {
                    "plays_with_others": "Sí, disfruta jugar con amigos",
                    "leadership": "A veces toma liderazgo en juegos grupales",
                    "cooperation": "Coopera bien en juegos de equipo",
                    "conflict_resolution": "Necesita ayuda para resolver conflictos"
                }
            },
            "educational_history": {
                "initial_education": {
                    "age": "3 años",
                    "institution": "Jardín infantil privado",
                    "adaptation": "Adaptación buena después de 2 semanas",
                    "difficulties": "Llanto inicial los primeros días, luego normal"
                },
                "primary_secondary": {
                    "primary_age": "6 años",
                    "primary_performance": "Rendimiento bueno hasta 5to grado",
                    "secondary_age": "12 años",
                    "secondary_performance": "Rendimiento irregular, especialmente en matemáticas",
                    "current_difficulties": "Matemáticas, ciencias, organización de tareas"
                },
                "learning_difficulties": {
                    "observed": "Sí",
                    "since_when": "Inicio de secundaria (hace 2 años)",
                    "subjects_affected": "Principalmente matemáticas y ciencias",
                    "actions_taken": "Refuerzo académico, cambio de metodología de estudio"
                },
                "special_services": {
                    "received": "Sí",
                    "logopedia": "No",
                    "reinforcement": "Sí, clases particulares de matemáticas",
                    "psychological_support": "Primera vez (consulta actual)"
                }
            },
            "psychosexuality": {
                "sexual_questions_age": "7-8 años",
                "information_provided": "Información básica apropiada para la edad sobre diferencias corporales y reproducción",
                "opposite_sex_friends": True,
                "romantic_interests": "Interés leve en compañeras de clase",
                "genital_behaviors": {
                    "present": "No",
                    "frequency": "",
                    "circumstances": ""
                }
            },
            "parental_attitudes": {
                "parental_reactions": [
                    "Preocupación por el rendimiento académico",
                    "Apoyo y búsqueda de soluciones",
                    "Algo de ansiedad por el futuro académico"
                ],
                "beliefs_guilt": "Los padres se sienten algo culpables por los problemas maritales temporales y creen que pudo haber afectado al niño",
                "behavioral_changes": "Han implementado más estructura en casa, horarios más claros, mayor supervisión de tareas",
                "punishment_use": {
                    "method": "Pérdida de privilegios (videojuegos, salidas)",
                    "frequency": "Ocasional, cuando no cumple responsabilidades",
                    "child_reaction": "Acepta las consecuencias, a veces con resistencia inicial"
                },
                "child_behavior": {
                    "with_parents": "Cariñoso, obediente la mayoría del tiempo, ocasionalmente desafiante",
                    "with_siblings": "Protector con hermana menor, juegan bien juntos",
                    "with_friends": "Sociable, popular, buen compañero",
                    "with_teachers": "Respetuoso pero distraído, necesita recordatorios constantes"
                }
            },
            "family_history": {
                "psychiatric_diseases": False,
                "speech_problems": False,
                "learning_difficulties": True,
                "epilepsy_convulsions": False,
                "mental_retardation": False,
                "adhd_attention_problems": True,
                "other_conditions": [
                    "Tío paterno con diagnóstico de TDAH en la adultez",
                    "Abuela materna con ansiedad"
                ],
                "parents_character": "Padres responsables, trabajadores, algo ansiosos por el rendimiento académico del hijo",
                "couple_relationship": "Relación estable actualmente, pasaron por período de dificultades hace 6 meses pero están en proceso de mejora"
            },
            "interview_observations": "Durante la entrevista, el adolescente se mostró colaborativo y dispuesto a conversar. Se observa inquietud motora leve (mueve las piernas, juega con las manos). Mantiene contacto visual adecuado. Presenta signos leves de ansiedad al hablar sobre el rendimiento escolar. Los padres muestran buena disposición para el tratamiento y seguimiento. Se evidencia dinámicas familiares funcionales con apoyo mutuo. El adolescente expresa motivación para mejorar su rendimiento académico."
        }

        url = f"{self.api_url}/patients/{patient_id}/anamnesis"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, json=anamnesis_data, headers=headers, timeout=15)
            if response.status_code == 200:
                result = response.json()
                print("✅ Anamnesis created successfully!")
                print(f"   History Number: {result.get('anamnesis', {}).get('history_number', 'N/A')}")
                return True, result
            else:
                print(f"❌ Failed to create anamnesis: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Error text: {response.text}")
                return False, {}
        except Exception as e:
            print(f"❌ Error creating anamnesis: {str(e)}")
            return False, {}

    def verify_anamnesis_saved(self, patient_id):
        """Verify that anamnesis was saved correctly in the patient"""
        print(f"\n🔍 Verifying anamnesis was saved for patient {patient_id}...")
        
        # Get the patient data to verify anamnesis is included
        url = f"{self.api_url}/patients/{patient_id}"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                patient_data = response.json()
                anamnesis = patient_data.get('anamnesis')
                
                if anamnesis:
                    print("✅ Anamnesis found in patient data!")
                    print(f"   Creation date: {anamnesis.get('creation_date', 'N/A')}")
                    print(f"   History number: {anamnesis.get('history_number', 'N/A')}")
                    print(f"   Patient name in anamnesis: {anamnesis.get('general_data', {}).get('patient_name', 'N/A')}")
                    return True
                else:
                    print("❌ Anamnesis not found in patient data!")
                    return False
            else:
                print(f"❌ Failed to get patient data: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error verifying anamnesis: {str(e)}")
            return False

    def get_anamnesis_directly(self, patient_id):
        """Get anamnesis directly using the anamnesis endpoint"""
        print(f"\n📋 Getting anamnesis directly for patient {patient_id}...")
        
        url = f"{self.api_url}/patients/{patient_id}/anamnesis"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                result = response.json()
                anamnesis = result.get('anamnesis', {})
                print("✅ Anamnesis retrieved successfully!")
                print(f"   Consultation motive: {anamnesis.get('consultation_motive', {}).get('difficulty_presentation', 'N/A')[:100]}...")
                print(f"   Interview observations: {anamnesis.get('interview_observations', 'N/A')[:100]}...")
                return True, anamnesis
            else:
                print(f"❌ Failed to get anamnesis: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Error text: {response.text}")
                return False, {}
        except Exception as e:
            print(f"❌ Error getting anamnesis: {str(e)}")
            return False, {}

    def update_anamnesis(self, patient_id):
        """Test updating the anamnesis"""
        print(f"\n✏️ Testing anamnesis update for patient {patient_id}...")
        
        # Updated anamnesis data
        updated_data = {
            "general_data": {
                "patient_name": "Juan Pérez González",
                "birth_date": "2010-03-15",
                "birth_place": "Lima, Perú",
                "age_years": 14,
                "age_months": 6,  # Updated age
                "education_level": "Secundaria - 2do año",
                "informants": ["Madre - María González", "Padre - Carlos Pérez", "Profesora - Ana Martínez"],  # Added informant
                "father_data": {
                    "name": "Carlos Pérez",
                    "age": "45",
                    "education": "Universitaria completa",
                    "occupation": "Ingeniero de sistemas"
                },
                "mother_data": {
                    "name": "María González",
                    "age": "42",
                    "education": "Universitaria completa",
                    "occupation": "Profesora de primaria"
                },
                "siblings_data": []
            },
            "consultation_motive": {
                "difficulty_presentation": "ACTUALIZADO: Dificultades de concentración y atención que han mejorado parcialmente con las intervenciones implementadas",
                "when_where_who": "Las dificultades persisten principalmente en matemáticas, pero ha mejorado en otras materias",
                "evolution": "Evolución positiva en las últimas semanas con las estrategias implementadas",
                "solutions_attempted": "Refuerzo escolar, técnicas de estudio, rutinas estructuradas - mostrando resultados positivos",
                "perceived_cause": "Combinación de factores: posible déficit de atención leve y factores ambientales",
                "treatments_received": "Iniciando tratamiento psicológico",
                "current_illness": {
                    "syndrome_time_years": "0",
                    "syndrome_time_months": "9",  # Updated
                    "syndrome_time_days": "0",
                    "onset_type": "Insidioso",
                    "main_symptoms": "Mejora en concentración, persisten olvidos ocasionales",
                    "important_stressors": "Situación familiar estabilizada",
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
                    "birth_time": "39 semanas",
                    "attended_by": "Obstetra",
                    "delivery_type": "Parto normal",
                    "anesthesia": "Epidural",
                    "instruments": "No",
                    "weight_height": "3.1kg, 49cm",
                    "cry_coloration": "Normal",
                    "reanimation": "No",
                    "parents_age": {"father": "31", "mother": "28"}
                },
                "postnatal": {
                    "malformations": "No",
                    "breastfeeding": "6 meses",
                    "sucking_difficulties": "No",
                    "postpartum_difficulties": "No"
                }
            },
            "medical_history": {
                "current_health": "Buena",
                "main_diseases": "Varicela a los 5 años",
                "medications": "Ninguna",
                "accidents": "Caída menor a los 8 años",
                "operations": {"performed": "No", "which": "", "why": ""},
                "exams": {"performed": "Sí", "results": "Normales"}
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
                    "understanding_way": "Buena",
                    "speech_frequency": "Normal",
                    "pronunciation_difficulties": "Ninguna actual"
                },
                "oral_movements": {
                    "bottle_use": "18 meses",
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
                    "duration": "9 horas",
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
                    "home_errands": "Ayuda básica",
                    "helps_at_home": "Sí"
                }
            },
            "conduct": {
                "maladaptive_behaviors": {
                    "bites_nails": True,
                    "sucks_fingers": False,
                    "bites_lip": False,
                    "sweaty_hands": False,  # Improved
                    "trembling_hands_legs": False,
                    "unprovoked_aggression": False,
                    "drops_things_easily": False  # Improved
                },
                "other_problems": "Mejora significativa en concentración",
                "child_character": "Sociable, activo, más organizado, cariñoso"
            },
            "play": {
                "play_preferences": {
                    "plays_alone": "A veces",
                    "why_alone": "Concentración en actividades específicas",
                    "preferred_games": "Videojuegos educativos, fútbol, construcción",
                    "favorite_toys": "Legos, pelota, tablet educativa"
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
                    "performance": "Mejorando gradualmente",
                    "difficulties": "Matemáticas - en proceso de mejora"
                },
                "learning_difficulties": {
                    "observed": "Sí, pero mejorando",
                    "since_when": "Inicio secundaria",
                    "actions_taken": "Refuerzo + apoyo psicológico"
                },
                "special_services": {
                    "received": "Sí",
                    "logopedia": "No",
                    "reinforcement": "Sí"
                }
            },
            "psychosexuality": {
                "sexual_questions_age": "8 años",
                "information_provided": "Información apropiada para edad",
                "opposite_sex_friends": True,
                "genital_behaviors": {
                    "present": "No",
                    "frequency": "",
                    "circumstances": ""
                }
            },
            "parental_attitudes": {
                "parental_reactions": ["Apoyo", "Seguimiento del tratamiento", "Optimismo"],
                "beliefs_guilt": "Reducción de sentimientos de culpa",
                "behavioral_changes": "Mayor estructura y apoyo emocional",
                "punishment_use": {
                    "method": "Consecuencias lógicas",
                    "frequency": "Reducida",
                    "child_reaction": "Mejor aceptación"
                },
                "child_behavior": {
                    "with_parents": "Más colaborativo",
                    "with_siblings": "Relación positiva",
                    "with_friends": "Sociable",
                    "with_others": "Respetuoso"
                }
            },
            "family_history": {
                "psychiatric_diseases": False,
                "speech_problems": False,
                "learning_difficulties": True,
                "other_conditions": ["Tío paterno con TDAH"],
                "parents_character": "Padres comprometidos con el tratamiento",
                "couple_relationship": "Relación estable y mejorada"
            },
            "interview_observations": "ACTUALIZADO: El adolescente muestra mejora notable en su capacidad de atención durante la sesión. Se observa mayor tranquilidad y confianza. Los padres reportan avances significativos en el hogar y colegio. Continúa el plan de tratamiento con expectativas positivas."
        }

        url = f"{self.api_url}/patients/{patient_id}/anamnesis"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.put(url, json=updated_data, headers=headers, timeout=15)
            if response.status_code == 200:
                result = response.json()
                print("✅ Anamnesis updated successfully!")
                return True, result
            else:
                print(f"❌ Failed to update anamnesis: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Error text: {response.text}")
                return False, {}
        except Exception as e:
            print(f"❌ Error updating anamnesis: {str(e)}")
            return False, {}

    def run_comprehensive_anamnesis_test(self):
        """Run the complete anamnesis test as requested"""
        print("🧠 COMPREHENSIVE ANAMNESIS FUNCTIONALITY TEST")
        print("=" * 60)
        print("Testing as requested by user:")
        print("1. Login with admin@psychologyportal.com / admin123")
        print("2. Get list of existing patients")
        print("3. Create comprehensive anamnesis for existing patient")
        print("4. Verify anamnesis is saved correctly")
        print("5. Test anamnesis update functionality")
        print("=" * 60)

        # Step 1: Login
        if not self.login():
            print("❌ CRITICAL: Login failed - cannot continue tests")
            return False

        # Step 2: Get existing patients
        if not self.get_existing_patients():
            print("❌ CRITICAL: Could not get patient list - cannot continue tests")
            return False

        if not self.existing_patients:
            print("❌ CRITICAL: No existing patients found - cannot test anamnesis")
            return False

        # Step 3: Select first patient for testing
        test_patient = self.existing_patients[0]
        patient_id = test_patient.get('id')
        patient_name = f"{test_patient.get('first_name', '')} {test_patient.get('last_name', '')}"
        
        print(f"\n🎯 Selected patient for testing: {patient_name} (ID: {patient_id})")

        # Step 4: Create comprehensive anamnesis
        success, anamnesis_data = self.create_comprehensive_anamnesis(patient_id, patient_name)
        if not success:
            print("❌ CRITICAL: Failed to create anamnesis")
            return False

        # Step 5: Verify anamnesis was saved in patient
        if not self.verify_anamnesis_saved(patient_id):
            print("❌ CRITICAL: Anamnesis was not saved correctly in patient")
            return False

        # Step 6: Get anamnesis directly
        success, anamnesis = self.get_anamnesis_directly(patient_id)
        if not success:
            print("❌ CRITICAL: Could not retrieve anamnesis directly")
            return False

        # Step 7: Test anamnesis update
        success, updated_data = self.update_anamnesis(patient_id)
        if not success:
            print("❌ CRITICAL: Failed to update anamnesis")
            return False

        # Step 8: Verify update was applied
        success, updated_anamnesis = self.get_anamnesis_directly(patient_id)
        if success:
            if "ACTUALIZADO" in updated_anamnesis.get('interview_observations', ''):
                print("✅ Anamnesis update verification successful!")
            else:
                print("❌ Anamnesis update was not applied correctly")
                return False

        print("\n" + "=" * 60)
        print("🎉 ALL ANAMNESIS TESTS COMPLETED SUCCESSFULLY!")
        print("✅ Login: Working")
        print("✅ Patient List: Working")
        print("✅ Create Anamnesis: Working")
        print("✅ Save Anamnesis: Working")
        print("✅ Get Anamnesis: Working")
        print("✅ Update Anamnesis: Working")
        print("✅ Verify Updates: Working")
        print("=" * 60)
        print("\n📋 ANAMNESIS FUNCTIONALITY IS FULLY OPERATIONAL")
        print("The user-reported issue may be resolved or was a temporary problem.")
        return True

def main():
    tester = AnamnesisSpecificTester()
    success = tester.run_comprehensive_anamnesis_test()
    
    if success:
        print("\n🏆 FINAL RESULT: ANAMNESIS SYSTEM IS WORKING CORRECTLY")
        return 0
    else:
        print("\n⚠️ FINAL RESULT: ANAMNESIS SYSTEM HAS ISSUES")
        return 1

if __name__ == "__main__":
    exit(main())