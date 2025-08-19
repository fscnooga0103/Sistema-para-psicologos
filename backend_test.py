import requests
import sys
import json
from datetime import datetime

class PsychologyPortalAPITester:
    def __init__(self, base_url="https://therapist-portal-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None

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
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890",
            "date_of_birth": "1990-01-15",
            "gender": "male",
            "address": "123 Main St, City, State 12345"
        }
        
        success, response = self.run_test(
            "Create Patient",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        
        if success and 'id' in response:
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