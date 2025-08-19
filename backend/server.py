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
class UserRole:
    SUPER_ADMIN = "super_admin"
    CENTER_ADMIN = "center_admin"
    PSYCHOLOGIST = "psychologist"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str
    center_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    psychologist_id: str
    center_id: str
    clinical_history: Optional[Dict[str, Any]] = None
    evaluations: List[Dict[str, Any]] = []
    diagnosis: Optional[Dict[str, Any]] = None
    progress_notes: List[Dict[str, Any]] = []
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

# Auth endpoints
@api_router.post("/auth/register", response_model=User)
async def register_user(user: UserCreate, current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.CENTER_ADMIN]))):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role permissions
    if current_user.role == UserRole.CENTER_ADMIN and user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Center Admin cannot create Super Admin users"
        )
    
    if current_user.role == UserRole.CENTER_ADMIN:
        user.center_id = current_user.center_id
    
    # Create user
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    del user_dict["password"]  # Don't store password in user object
    user_obj = User(**user_dict)
    
    await db.users.insert_one({**user_obj.dict(), "password": hashed_password})
    return user_obj

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