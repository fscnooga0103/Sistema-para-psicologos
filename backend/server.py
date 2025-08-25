from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import json
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Psychology Practice Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"        # Administrador General
    CENTER_ADMIN = "center_admin"      # Administrador de Centro  
    PSYCHOLOGIST = "psychologist"      # Psicólogo

class PatientType(str, Enum):
    INDIVIDUAL = "individual"          # Paciente individual
    SHARED = "shared"                  # Paciente compartido en centro

# Center Model - Nuevo modelo para centros
class Center(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    admin_id: Optional[str] = None  # Administrador del centro
    psychologists: List[str] = []   # IDs de psicólogos asignados
    database_name: str              # Base de datos específica del centro
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CenterCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    admin_id: Optional[str] = None

class CenterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    admin_id: Optional[str] = None
    is_active: Optional[bool] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    role: str
    center_id: Optional[str] = None      # ID del centro asignado
    phone: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    database_name: Optional[str] = None  # Base de datos privada (solo psicólogos)
    email_verified: bool = False         # Validación de email
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    
    @property
    def display_name(self) -> str:
        """Get display name from either full_name or first_name + last_name"""
        if self.full_name:
            return self.full_name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.username:
            return self.username
        else:
            return self.email

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    center_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Center(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    phone: str
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CenterCreate(BaseModel):
    name: str
    address: str
    phone: str
    email: EmailStr

class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[Dict[str, str]] = None
    psychologist_id: str                         # Psicólogo principal
    center_id: Optional[str] = None             # Centro asignado (si aplica)
    patient_type: PatientType = PatientType.INDIVIDUAL  # Tipo: individual o compartido
    shared_with: List[str] = []                 # IDs de psicólogos con acceso compartido
    database_context: str                       # Contexto de BD: centro_id o psychologist_id
    clinical_history: Optional[Dict[str, Any]] = None
    evaluations: List[Dict[str, Any]] = []
    diagnosis: Optional[Dict[str, Any]] = None
    progress_notes: List[Dict[str, Any]] = []
    anamnesis: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[Dict[str, str]] = None

# Modelos para la Ficha de Anamnesis
class GeneralData(BaseModel):
    patient_name: str
    birth_date: str
    birth_place: str
    age_years: int
    age_months: int
    education_level: str
    informants: List[str]
    father_data: Dict[str, str] = {}
    mother_data: Dict[str, str] = {}
    siblings_data: List[Dict[str, str]] = []

class ConsultationMotive(BaseModel):
    difficulty_presentation: str
    when_where_who: str
    evolution: str
    solutions_attempted: str
    perceived_cause: str
    treatments_received: str
    current_illness: Dict[str, Any] = {}

class EvolutionaryHistory(BaseModel):
    prenatal: Dict[str, Any] = {}
    perinatal: Dict[str, Any] = {}
    postnatal: Dict[str, Any] = {}

class MedicalHistory(BaseModel):
    current_health: str
    main_diseases: str
    medications: str
    accidents: str
    operations: Dict[str, str] = {}
    exams: Dict[str, str] = {}

class NeuromuscularDevelopment(BaseModel):
    motor_milestones: Dict[str, str] = {}
    difficulties: Dict[str, bool] = {}
    automatic_movements: Dict[str, str] = {}
    motor_skills: Dict[str, str] = {}
    lateral_dominance: str

class SpeechHistory(BaseModel):
    speech_development: Dict[str, Any] = {}
    oral_movements: Dict[str, Any] = {}

class HabitsFormation(BaseModel):
    feeding: Dict[str, Any] = {}
    hygiene: Dict[str, Any] = {}
    sleep: Dict[str, Any] = {}
    personal_independence: Dict[str, Any] = {}

class Conduct(BaseModel):
    maladaptive_behaviors: Dict[str, bool] = {}
    other_problems: str
    child_character: str

class Play(BaseModel):
    play_preferences: Dict[str, str] = {}
    social_play: Dict[str, str] = {}

class EducationalHistory(BaseModel):
    initial_education: Dict[str, str] = {}
    primary_secondary: Dict[str, str] = {}
    learning_difficulties: Dict[str, str] = {}
    special_services: Dict[str, str] = {}

class Psychosexuality(BaseModel):
    sexual_questions_age: str
    information_provided: str
    opposite_sex_friends: bool
    genital_behaviors: Dict[str, str] = {}

class ParentalAttitudes(BaseModel):
    parental_reactions: List[str] = []
    beliefs_guilt: str
    behavioral_changes: str
    punishment_use: Dict[str, str] = {}
    child_behavior: Dict[str, str] = {}

class FamilyHistory(BaseModel):
    psychiatric_diseases: bool
    speech_problems: bool
    learning_difficulties: bool
    other_conditions: List[str] = []
    parents_character: str
    couple_relationship: str

class Anamnesis(BaseModel):
    patient_id: str
    history_number: str
    creation_date: str
    general_data: GeneralData
    consultation_motive: ConsultationMotive
    evolutionary_history: EvolutionaryHistory
    medical_history: MedicalHistory
    neuromuscular_development: NeuromuscularDevelopment
    speech_history: SpeechHistory
    habits_formation: HabitsFormation
    conduct: Conduct
    play: Play
    educational_history: EducationalHistory
    psychosexuality: Psychosexuality
    parental_attitudes: ParentalAttitudes
    family_history: FamilyHistory
    interview_observations: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnamnesisCreate(BaseModel):
    general_data: Dict[str, Any]
    consultation_motive: Dict[str, Any]
    evolutionary_history: Dict[str, Any]
    medical_history: Dict[str, Any]
    neuromuscular_development: Dict[str, Any]
    speech_history: Dict[str, Any]
    habits_formation: Dict[str, Any]
    conduct: Dict[str, Any]
    play: Dict[str, Any]
    educational_history: Dict[str, Any]
    psychosexuality: Dict[str, Any]
    parental_attitudes: Dict[str, Any]
    family_history: Dict[str, Any]
    interview_observations: str

class ClinicalHistory(BaseModel):
    patient_id: str
    chief_complaint: str
    history_of_present_illness: str
    past_medical_history: str
    family_history: str
    social_history: str
    mental_status_exam: Optional[Dict[str, Any]] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Evaluation(BaseModel):
    patient_id: str
    evaluation_type: str
    evaluation_date: str
    results: Dict[str, Any]
    notes: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Diagnosis(BaseModel):
    patient_id: str
    primary_diagnosis: str
    secondary_diagnosis: Optional[str] = None
    dsm5_codes: List[str] = []
    severity: str
    notes: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProgressNote(BaseModel):
    patient_id: str
    session_date: str
    session_type: str
    duration_minutes: int
    objectives: List[str]
    interventions: List[str]
    progress: str
    homework_assigned: Optional[str] = None
    next_session_plan: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Appointment Models
class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    psychologist_id: str
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # HH:MM
    duration_minutes: int = 60
    appointment_type: str = "consultation"  # consultation, therapy, evaluation
    status: str = "scheduled"  # scheduled, completed, cancelled, no_show
    notes: Optional[str] = None
    session_objectives: List[str] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    patient_id: str
    appointment_date: str
    appointment_time: str
    duration_minutes: int = 60
    appointment_type: str = "consultation"
    notes: Optional[str] = None
    session_objectives: List[str] = []

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    appointment_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    session_objectives: List[str] = []

# Session Objectives Models
class SessionObjective(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    appointment_id: Optional[str] = None
    week_start_date: str  # YYYY-MM-DD (Monday of the week)
    objective_title: str
    objective_description: str
    status: str = "pending"  # pending, in_progress, completed, cancelled
    priority: str = "medium"  # low, medium, high
    target_date: Optional[str] = None
    completion_notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionObjectiveCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    week_start_date: str
    objective_title: str
    objective_description: str
    priority: str = "medium"
    target_date: Optional[str] = None

class SessionObjectiveUpdate(BaseModel):
    objective_title: Optional[str] = None
    objective_description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    target_date: Optional[str] = None
    completion_notes: Optional[str] = None

# Payment Models
class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    appointment_id: Optional[str] = None
    psychologist_id: str
    amount: float
    payment_date: str  # YYYY-MM-DD
    session_date: str  # YYYY-MM-DD
    payment_method: Optional[str] = None  # cash, card, transfer, etc.
    status: str = "completed"  # pending, completed, cancelled
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    amount: float
    payment_date: str
    session_date: str
    payment_method: Optional[str] = None
    notes: Optional[str] = None

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

def require_role(required_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Auth endpoints - Legacy register endpoint removed, use POST /users instead

@api_router.post("/auth/login", response_model=Token)
async def login_user(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Center endpoints
@api_router.post("/centers", response_model=Center)
async def create_center(center: CenterCreate, current_user: User = Depends(require_role([UserRole.SUPER_ADMIN]))):
    center_obj = Center(**center.dict())
    await db.centers.insert_one(center_obj.dict())
    return center_obj

@api_router.get("/centers", response_model=List[Center])
async def get_centers(current_user: User = Depends(require_role([UserRole.SUPER_ADMIN]))):
    centers = await db.centers.find().to_list(1000)
    return [Center(**center) for center in centers]

# Patient endpoints
@api_router.post("/patients", response_model=Patient)
async def create_patient(patient: PatientCreate, current_user: User = Depends(get_current_user)):
    patient_dict = patient.dict()
    patient_dict["psychologist_id"] = current_user.id
    
    # Handle center_id for different user roles
    if current_user.role == UserRole.SUPER_ADMIN:
        # For super admin, use a default center or create one if needed
        if not current_user.center_id:
            # Get the first available center or create a default one
            existing_center = await db.centers.find_one()
            if existing_center:
                patient_dict["center_id"] = existing_center["id"]
            else:
                # Create a default center for super admin
                default_center = {
                    "id": str(uuid.uuid4()),
                    "name": "Default Psychology Center",
                    "address": "Main Office",
                    "phone": "+1000000000",
                    "email": "admin@psychologyportal.com",
                    "created_at": datetime.now(timezone.utc)
                }
                await db.centers.insert_one(default_center)
                patient_dict["center_id"] = default_center["id"]
        else:
            patient_dict["center_id"] = current_user.center_id
    else:
        patient_dict["center_id"] = current_user.center_id
    
    patient_obj = Patient(**patient_dict)
    await db.patients.insert_one(patient_obj.dict())
    return patient_obj

@api_router.get("/patients", response_model=List[Patient])
async def get_patients(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.SUPER_ADMIN:
        patients = await db.patients.find({"is_active": True}).to_list(1000)
    elif current_user.role == UserRole.CENTER_ADMIN:
        patients = await db.patients.find({"center_id": current_user.center_id, "is_active": True}).to_list(1000)
    else:  # Psychologist
        patients = await db.patients.find({"psychologist_id": current_user.id, "is_active": True}).to_list(1000)
    
    return [Patient(**patient) for patient in patients]

@api_router.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Patient(**patient)

@api_router.put("/patients/{patient_id}", response_model=Patient)
async def update_patient(patient_id: str, update_data: dict, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update patient data
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.patients.update_one(
        {"id": patient_id},
        {"$set": update_data}
    )
    
    updated_patient = await db.patients.find_one({"id": patient_id})
    return Patient(**updated_patient)

# Anamnesis endpoints
@api_router.post("/patients/{patient_id}/anamnesis")
async def create_anamnesis(patient_id: str, anamnesis_data: AnamnesisCreate, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    anamnesis_dict = anamnesis_data.dict()
    anamnesis_dict["patient_id"] = patient_id
    anamnesis_dict["history_number"] = f"HCL-{patient_id[-8:]}"
    anamnesis_dict["creation_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    anamnesis_dict["created_by"] = current_user.id
    anamnesis_dict["created_at"] = datetime.now(timezone.utc)
    anamnesis_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.patients.update_one(
        {"id": patient_id},
        {"$set": {"anamnesis": anamnesis_dict, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Anamnesis created successfully", "anamnesis": anamnesis_dict}

@api_router.put("/patients/{patient_id}/anamnesis")
async def update_anamnesis(patient_id: str, anamnesis_data: AnamnesisCreate, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    anamnesis_dict = anamnesis_data.dict()
    anamnesis_dict["patient_id"] = patient_id
    anamnesis_dict["updated_at"] = datetime.now(timezone.utc)
    
    # Keep original creation data if exists
    if patient.get("anamnesis"):
        anamnesis_dict["history_number"] = patient["anamnesis"].get("history_number", f"HCL-{patient_id[-8:]}")
        anamnesis_dict["creation_date"] = patient["anamnesis"].get("creation_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        anamnesis_dict["created_by"] = patient["anamnesis"].get("created_by", current_user.id)
        anamnesis_dict["created_at"] = patient["anamnesis"].get("created_at", datetime.now(timezone.utc))
    else:
        anamnesis_dict["history_number"] = f"HCL-{patient_id[-8:]}"
        anamnesis_dict["creation_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        anamnesis_dict["created_by"] = current_user.id
        anamnesis_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.patients.update_one(
        {"id": patient_id},
        {"$set": {"anamnesis": anamnesis_dict, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Anamnesis updated successfully", "anamnesis": anamnesis_dict}

@api_router.get("/patients/{patient_id}/anamnesis")
async def get_anamnesis(patient_id: str, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    anamnesis = patient.get("anamnesis")
    if not anamnesis:
        raise HTTPException(status_code=404, detail="Anamnesis not found")
    
    return {"anamnesis": anamnesis}

@api_router.put("/patients/{patient_id}/clinical-history")
async def update_clinical_history(patient_id: str, history: ClinicalHistory, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    history_dict = history.dict()
    history_dict["created_by"] = current_user.id
    
    await db.patients.update_one(
        {"id": patient_id},
        {"$set": {"clinical_history": history_dict, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Clinical history updated successfully"}

@api_router.post("/patients/{patient_id}/evaluations")
async def add_evaluation(patient_id: str, evaluation: Evaluation, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    evaluation_dict = evaluation.dict()
    evaluation_dict["id"] = str(uuid.uuid4())
    evaluation_dict["created_by"] = current_user.id
    
    await db.patients.update_one(
        {"id": patient_id},
        {"$push": {"evaluations": evaluation_dict}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Evaluation added successfully"}

@api_router.put("/patients/{patient_id}/diagnosis")
async def update_diagnosis(patient_id: str, diagnosis: Diagnosis, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    diagnosis_dict = diagnosis.dict()
    diagnosis_dict["created_by"] = current_user.id
    
    await db.patients.update_one(
        {"id": patient_id},
        {"$set": {"diagnosis": diagnosis_dict, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Diagnosis updated successfully"}

@api_router.post("/patients/{patient_id}/progress-notes")
async def add_progress_note(patient_id: str, note: ProgressNote, current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    note_dict = note.dict()
    note_dict["id"] = str(uuid.uuid4())
    note_dict["created_by"] = current_user.id
    
    await db.patients.update_one(
        {"id": patient_id},
        {"$push": {"progress_notes": note_dict}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Progress note added successfully"}

# Appointment endpoints
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate, current_user: User = Depends(get_current_user)):
    # Verify patient exists and user has access
    patient = await db.patients.find_one({"id": appointment.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    appointment_dict = appointment.dict()
    appointment_dict["psychologist_id"] = current_user.id
    appointment_dict["created_by"] = current_user.id
    
    appointment_obj = Appointment(**appointment_dict)
    await db.appointments.insert_one(appointment_obj.dict())
    return appointment_obj

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    patient_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.PSYCHOLOGIST:
        query["psychologist_id"] = current_user.id
    elif current_user.role == UserRole.CENTER_ADMIN:
        # Get all psychologists from this center
        center_psychologists = await db.users.find({"center_id": current_user.center_id, "role": UserRole.PSYCHOLOGIST}).to_list(1000)
        psychologist_ids = [p["id"] for p in center_psychologists] + [current_user.id]
        query["psychologist_id"] = {"$in": psychologist_ids}
    
    # Date filtering
    if start_date and end_date:
        query["appointment_date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["appointment_date"] = {"$gte": start_date}
    elif end_date:
        query["appointment_date"] = {"$lte": end_date}
    
    # Patient filtering
    if patient_id:
        query["patient_id"] = patient_id
    
    appointments = await db.appointments.find(query).sort("appointment_date", 1).to_list(1000)
    return [Appointment(**appointment) for appointment in appointments]

@api_router.get("/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str, current_user: User = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and appointment["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN):
        # For center admin, check if psychologist belongs to their center
        psychologist = await db.users.find_one({"id": appointment["psychologist_id"]})
        if not psychologist or psychologist["center_id"] != current_user.center_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return Appointment(**appointment)

@api_router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, update_data: AppointmentUpdate, current_user: User = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check permissions
    if current_user.role == UserRole.PSYCHOLOGIST and appointment["psychologist_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": update_dict}
    )
    
    updated_appointment = await db.appointments.find_one({"id": appointment_id})
    return Appointment(**updated_appointment)

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, current_user: User = Depends(get_current_user)):
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check permissions
    if current_user.role == UserRole.PSYCHOLOGIST and appointment["psychologist_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.appointments.delete_one({"id": appointment_id})
    return {"message": "Appointment deleted successfully"}

# Session Objectives endpoints
@api_router.post("/session-objectives", response_model=SessionObjective)
async def create_session_objective(objective: SessionObjectiveCreate, current_user: User = Depends(get_current_user)):
    # Verify patient exists and user has access
    patient = await db.patients.find_one({"id": objective.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    objective_dict = objective.dict()
    objective_dict["created_by"] = current_user.id
    
    objective_obj = SessionObjective(**objective_dict)
    await db.session_objectives.insert_one(objective_obj.dict())
    return objective_obj

@api_router.get("/session-objectives", response_model=List[SessionObjective])
async def get_session_objectives(
    patient_id: Optional[str] = None,
    week_start_date: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Patient filtering with permission check
    if patient_id:
        patient = await db.patients.find_one({"id": patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Check permissions
        if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
           (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        query["patient_id"] = patient_id
    else:
        # Get objectives for all accessible patients
        if current_user.role == UserRole.PSYCHOLOGIST:
            accessible_patients = await db.patients.find({"psychologist_id": current_user.id}).to_list(1000)
        elif current_user.role == UserRole.CENTER_ADMIN:
            accessible_patients = await db.patients.find({"center_id": current_user.center_id}).to_list(1000)
        else:  # Super admin
            accessible_patients = await db.patients.find().to_list(1000)
        
        patient_ids = [p["id"] for p in accessible_patients]
        query["patient_id"] = {"$in": patient_ids}
    
    # Additional filters
    if week_start_date:
        query["week_start_date"] = week_start_date
    if status:
        query["status"] = status
    
    objectives = await db.session_objectives.find(query).sort("created_at", -1).to_list(1000)
    return [SessionObjective(**obj) for obj in objectives]

@api_router.put("/session-objectives/{objective_id}", response_model=SessionObjective)
async def update_session_objective(objective_id: str, update_data: SessionObjectiveUpdate, current_user: User = Depends(get_current_user)):
    objective = await db.session_objectives.find_one({"id": objective_id})
    if not objective:
        raise HTTPException(status_code=404, detail="Session objective not found")
    
    # Check permissions through patient
    patient = await db.patients.find_one({"id": objective["patient_id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.session_objectives.update_one(
        {"id": objective_id},
        {"$set": update_dict}
    )
    
    updated_objective = await db.session_objectives.find_one({"id": objective_id})
    return SessionObjective(**updated_objective)

@api_router.delete("/session-objectives/{objective_id}")
async def delete_session_objective(objective_id: str, current_user: User = Depends(get_current_user)):
    objective = await db.session_objectives.find_one({"id": objective_id})
    if not objective:
        raise HTTPException(status_code=404, detail="Session objective not found")
    
    # Check permissions through patient
    patient = await db.patients.find_one({"id": objective["patient_id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.session_objectives.delete_one({"id": objective_id})
    return {"message": "Session objective deleted successfully"}

# Payment endpoints
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate, current_user: User = Depends(get_current_user)):
    # Verify patient exists and user has access
    patient = await db.patients.find_one({"id": payment.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if (current_user.role == UserRole.PSYCHOLOGIST and patient["psychologist_id"] != current_user.id) or \
       (current_user.role == UserRole.CENTER_ADMIN and patient["center_id"] != current_user.center_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    payment_dict = payment.dict()
    payment_dict["psychologist_id"] = current_user.id
    payment_dict["created_by"] = current_user.id
    
    payment_obj = Payment(**payment_dict)
    await db.payments.insert_one(payment_obj.dict())
    return payment_obj

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    patient_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.PSYCHOLOGIST:
        query["psychologist_id"] = current_user.id
    elif current_user.role == UserRole.CENTER_ADMIN:
        # Get all psychologists from this center
        center_psychologists = await db.users.find({"center_id": current_user.center_id, "role": UserRole.PSYCHOLOGIST}).to_list(1000)
        psychologist_ids = [p["id"] for p in center_psychologists] + [current_user.id]
        query["psychologist_id"] = {"$in": psychologist_ids}
    
    # Date filtering
    if start_date and end_date:
        query["payment_date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["payment_date"] = {"$gte": start_date}
    elif end_date:
        query["payment_date"] = {"$lte": end_date}
    
    # Patient filtering
    if patient_id:
        query["patient_id"] = patient_id
    
    payments = await db.payments.find(query).sort("payment_date", -1).to_list(1000)
    return [Payment(**payment) for payment in payments]

@api_router.get("/payments/stats")
async def get_payment_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime, timedelta
    import calendar
    
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.PSYCHOLOGIST:
        query["psychologist_id"] = current_user.id
    elif current_user.role == UserRole.CENTER_ADMIN:
        center_psychologists = await db.users.find({"center_id": current_user.center_id, "role": UserRole.PSYCHOLOGIST}).to_list(1000)
        psychologist_ids = [p["id"] for p in center_psychologists] + [current_user.id]
        query["psychologist_id"] = {"$in": psychologist_ids}
    
    # Get all payments
    all_payments = await db.payments.find(query).to_list(10000)
    
    # Calculate stats
    today = datetime.now().strftime("%Y-%m-%d")
    week_start = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime("%Y-%m-%d")
    month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
    
    daily_total = sum(p["amount"] for p in all_payments if p["payment_date"] == today)
    weekly_total = sum(p["amount"] for p in all_payments if p["payment_date"] >= week_start)
    monthly_total = sum(p["amount"] for p in all_payments if p["payment_date"] >= month_start)
    
    return {
        "daily_total": daily_total,
        "weekly_total": weekly_total,
        "monthly_total": monthly_total,
        "total_payments": len(all_payments),
        "average_per_session": monthly_total / len([p for p in all_payments if p["payment_date"] >= month_start]) if len([p for p in all_payments if p["payment_date"] >= month_start]) > 0 else 0
    }

@api_router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(payment_id: str, update_data: dict, current_user: User = Depends(get_current_user)):
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check permissions
    if current_user.role == UserRole.PSYCHOLOGIST and payment["psychologist_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": update_data}
    )
    
    updated_payment = await db.payments.find_one({"id": payment_id})
    return Payment(**updated_payment)

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check permissions
    if current_user.role == UserRole.PSYCHOLOGIST and payment["psychologist_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.payments.delete_one({"id": payment_id})
    return {"message": "Payment deleted successfully"}

# User Management endpoints (for admin users)
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    # Only super_admin and center_admin can view users
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CENTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    if current_user.role == UserRole.CENTER_ADMIN:
        # Center admin can only see users from their center
        query["center_id"] = current_user.center_id
    
    users = await db.users.find(query).to_list(1000)
    return [User(**user) for user in users]

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    role: UserRole
    center_id: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Only super_admin and center_admin can create users
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CENTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if username or email already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Hash password
    hashed_password = pwd_context.hash(user_data.password)
    
    # Set center_id based on current user's role
    if current_user.role == UserRole.CENTER_ADMIN:
        center_id = current_user.center_id
    else:
        center_id = user_data.center_id or current_user.center_id
    
    user_dict = user_data.dict()
    user_dict["password"] = hashed_password
    user_dict["center_id"] = center_id
    user_dict["id"] = str(uuid.uuid4())
    user_dict["is_active"] = True
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["updated_at"] = datetime.now(timezone.utc)
    
    # Remove password from dict for response
    response_dict = user_dict.copy()
    del response_dict["password"]
    
    await db.users.insert_one(user_dict)
    return User(**response_dict)

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, update_data: UserUpdate, current_user: User = Depends(get_current_user)):
    # Only super_admin and center_admin can update users, or users can update themselves (limited)
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Permission checks
    if current_user.role == UserRole.PSYCHOLOGIST and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == UserRole.CENTER_ADMIN:
        if target_user["center_id"] != current_user.center_id:
            raise HTTPException(status_code=403, detail="Access denied")
        # Center admin cannot change roles to super_admin
        if update_data.role == UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot assign super admin role")
    
    # Psychologists can only update limited fields
    if current_user.role == UserRole.PSYCHOLOGIST:
        allowed_fields = {"first_name", "last_name", "phone", "specialization", "license_number"}
        update_dict = {k: v for k, v in update_data.dict().items() if k in allowed_fields and v is not None}
    else:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.users.update_one({"id": user_id}, {"$set": update_dict})
    updated_user = await db.users.find_one({"id": user_id})
    
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    # Only super_admin and center_admin can delete users
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CENTER_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Center admin can only delete users from their center
    if current_user.role == UserRole.CENTER_ADMIN:
        if target_user["center_id"] != current_user.center_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Cannot delete yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}})
    return {"message": "User deactivated successfully"}

# Initialize Super Admin (for first setup)
@api_router.post("/init/super-admin")
async def create_initial_super_admin():
    existing_admin = await db.users.find_one({"role": UserRole.SUPER_ADMIN})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Super Admin already exists")
    
    admin_data = {
        "email": "admin@psychologyportal.com",
        "password": get_password_hash("admin123"),
        "full_name": "System Administrator",
        "role": UserRole.SUPER_ADMIN,
        "is_active": True
    }
    
    admin_user = User(**{k: v for k, v in admin_data.items() if k != "password"})
    await db.users.insert_one({**admin_user.dict(), "password": admin_data["password"]})
    
    return {"message": "Super Admin created successfully", "email": "admin@psychologyportal.com", "password": "admin123"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()