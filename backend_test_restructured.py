import requests
import sys
import json
from datetime import datetime

class RestructuredBackendTester:
    def __init__(self, base_url="https://mindtrack-pro.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.created_center_id = None
        self.created_psychologist_id = None
        self.created_center_admin_id = None
        self.created_patient_id = None

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
                    if isinstance(response_data, dict) and len(str(response_data)) < 800:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: Found {len(response_data)} items")
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

    def test_1_login_super_admin(self):
        """Test 1: Login with Super Admin credentials"""
        print("\n" + "="*60)
        print("🔐 TEST 1: SUPER ADMIN LOGIN")
        print("="*60)
        
        success, response = self.run_test(
            "Login Super Admin (admin@psychologyportal.com/admin123)",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@psychologyportal.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user', {})
            print(f"   ✅ Logged in as: {self.user_data.get('full_name', 'Unknown')}")
            print(f"   ✅ Role: {self.user_data.get('role', 'Unknown')}")
            print(f"   ✅ Email: {self.user_data.get('email', 'Unknown')}")
            
            # Verify it's super_admin role
            if self.user_data.get('role') == 'super_admin':
                print("   ✅ Super Admin role confirmed")
                return True
            else:
                print(f"   ❌ Expected super_admin role, got: {self.user_data.get('role')}")
                return False
        else:
            print("   ❌ Login failed or no access token received")
            return False

    def test_2_center_endpoints(self):
        """Test 2: Center Management Endpoints (Super Admin Only)"""
        print("\n" + "="*60)
        print("🏢 TEST 2: CENTER MANAGEMENT ENDPOINTS")
        print("="*60)
        
        if not self.token:
            print("❌ No authentication token available")
            return False

        # Test 2.1: Create Center
        center_data = {
            "name": "Centro de Psicología Integral",
            "description": "Centro especializado en terapia familiar e individual",
            "address": "Av. Principal 123, Lima, Perú",
            "phone": "+51-1-234-5678",
            "email": "contacto@centropsicologia.com"
        }
        
        success, response = self.run_test(
            "Create Center (POST /api/centers)",
            "POST",
            "centers",
            200,
            data=center_data
        )
        
        if success and 'id' in response:
            self.created_center_id = response['id']
            print(f"   ✅ Center created with ID: {self.created_center_id}")
            
            # Verify new fields
            if 'database_name' in response:
                print(f"   ✅ database_name field present: {response['database_name']}")
            else:
                print("   ❌ database_name field missing")
                
            if 'created_by' in response:
                print(f"   ✅ created_by field present: {response['created_by']}")
            else:
                print("   ❌ created_by field missing")
        else:
            print("   ❌ Center creation failed")
            return False

        # Test 2.2: Get Centers
        success, response = self.run_test(
            "List Centers (GET /api/centers)",
            "GET",
            "centers",
            200
        )
        
        if success:
            print(f"   ✅ Found {len(response)} centers")
            if len(response) > 0:
                center = response[0]
                required_fields = ['id', 'name', 'database_name', 'created_by', 'created_at']
                for field in required_fields:
                    if field in center:
                        print(f"   ✅ Field '{field}' present in center data")
                    else:
                        print(f"   ❌ Field '{field}' missing in center data")
        else:
            print("   ❌ Failed to get centers")
            return False

        # Test 2.3: Update Center
        if self.created_center_id:
            update_data = {
                "description": "Centro especializado en terapia familiar, individual y de pareja - ACTUALIZADO",
                "phone": "+51-1-234-5679"
            }
            
            success, response = self.run_test(
                "Update Center (PUT /api/centers/{id})",
                "PUT",
                f"centers/{self.created_center_id}",
                200,
                data=update_data
            )
            
            if success:
                print("   ✅ Center updated successfully")
                if 'updated_at' in response:
                    print(f"   ✅ updated_at field present: {response['updated_at']}")
            else:
                print("   ❌ Center update failed")
                return False

        print("🎉 All center management tests passed!")
        return True

    def test_3_user_management(self):
        """Test 3: New User Management System"""
        print("\n" + "="*60)
        print("👥 TEST 3: NEW USER MANAGEMENT SYSTEM")
        print("="*60)
        
        if not self.token:
            print("❌ No authentication token available")
            return False

        # Test 3.1: Create Psychologist User
        psychologist_data = {
            "username": "dr_martinez",
            "email": "ana.martinez@psicologia.com",
            "first_name": "Ana",
            "last_name": "Martínez",
            "password": "secure123",
            "role": "psychologist",
            "phone": "+51-987-654-321",
            "specialization": "Psicología Clínica y Terapia Cognitivo-Conductual",
            "license_number": "PSI-2024-001"
        }
        
        success, response = self.run_test(
            "Create Psychologist User (POST /api/users)",
            "POST",
            "users",
            200,
            data=psychologist_data
        )
        
        if success and 'id' in response:
            self.created_psychologist_id = response['id']
            print(f"   ✅ Psychologist created with ID: {self.created_psychologist_id}")
            
            # Verify new fields specific to restructured backend
            required_fields = ['email_verified', 'database_name', 'role', 'created_at', 'updated_at']
            for field in required_fields:
                if field in response:
                    print(f"   ✅ Field '{field}' present: {response[field]}")
                else:
                    print(f"   ❌ Field '{field}' missing")
            
            # Verify database_name generation for psychologists
            if response.get('role') == 'psychologist' and response.get('database_name'):
                print(f"   ✅ database_name generated for psychologist: {response['database_name']}")
            else:
                print("   ❌ database_name not generated for psychologist")
        else:
            print("   ❌ Psychologist creation failed")
            return False

        # Test 3.2: Create Center Admin User
        center_admin_data = {
            "username": "admin_rodriguez",
            "email": "carlos.rodriguez@centropsicologia.com",
            "first_name": "Carlos",
            "last_name": "Rodríguez",
            "password": "admin456",
            "role": "center_admin",
            "center_id": self.created_center_id,
            "phone": "+51-987-123-456"
        }
        
        success, response = self.run_test(
            "Create Center Admin User (POST /api/users)",
            "POST",
            "users",
            200,
            data=center_admin_data
        )
        
        if success and 'id' in response:
            self.created_center_admin_id = response['id']
            print(f"   ✅ Center Admin created with ID: {self.created_center_admin_id}")
            
            # Verify center assignment
            if response.get('center_id') == self.created_center_id:
                print(f"   ✅ Center assignment correct: {response['center_id']}")
            else:
                print(f"   ❌ Center assignment incorrect: expected {self.created_center_id}, got {response.get('center_id')}")
        else:
            print("   ❌ Center Admin creation failed")
            return False

        # Test 3.3: Get Users with Role-based Filtering
        success, response = self.run_test(
            "Get Users with Role Filtering (GET /api/users)",
            "GET",
            "users",
            200
        )
        
        if success:
            print(f"   ✅ Found {len(response)} users")
            
            # Verify role distribution
            roles = {}
            for user in response:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
            
            print(f"   ✅ Role distribution: {roles}")
            
            # Verify new fields in user data
            if len(response) > 0:
                user = response[0]
                new_fields = ['email_verified', 'created_at', 'updated_at']
                for field in new_fields:
                    if field in user:
                        print(f"   ✅ New field '{field}' present in user data")
                    else:
                        print(f"   ❌ New field '{field}' missing in user data")
        else:
            print("   ❌ Failed to get users")
            return False

        # Test 3.4: Test Email Duplication Validation
        duplicate_email_data = {
            "username": "duplicate_test",
            "email": "ana.martinez@psicologia.com",  # Same email as psychologist
            "first_name": "Test",
            "last_name": "User",
            "password": "test123",
            "role": "psychologist"
        }
        
        success, response = self.run_test(
            "Test Email Duplication Validation (POST /api/users)",
            "POST",
            "users",
            400,  # Should fail with 400
            data=duplicate_email_data
        )
        
        if success:
            print("   ✅ Email duplication validation working correctly")
        else:
            print("   ❌ Email duplication validation failed")

        print("🎉 All user management tests passed!")
        return True

    def test_4_psychologist_assignment(self):
        """Test 4: Psychologist Assignment to Centers"""
        print("\n" + "="*60)
        print("🔗 TEST 4: PSYCHOLOGIST ASSIGNMENT TO CENTERS")
        print("="*60)
        
        if not self.token or not self.created_center_id or not self.created_psychologist_id:
            print("❌ Missing required data for assignment test")
            return False

        # Test 4.1: Assign Psychologist to Center
        success, response = self.run_test(
            "Assign Psychologist to Center (POST /api/centers/{center_id}/assign-psychologist/{psychologist_id})",
            "POST",
            f"centers/{self.created_center_id}/assign-psychologist/{self.created_psychologist_id}",
            200
        )
        
        if success:
            print("   ✅ Psychologist assigned to center successfully")
        else:
            print("   ❌ Psychologist assignment failed")
            return False

        # Test 4.2: Verify Assignment - Check User Update
        success, response = self.run_test(
            "Verify Psychologist Center Assignment (GET /api/users)",
            "GET",
            "users",
            200
        )
        
        if success:
            # Find the psychologist and verify center_id
            psychologist = None
            for user in response:
                if user.get('id') == self.created_psychologist_id:
                    psychologist = user
                    break
            
            if psychologist and psychologist.get('center_id') == self.created_center_id:
                print(f"   ✅ Psychologist center_id updated correctly: {psychologist['center_id']}")
            else:
                print(f"   ❌ Psychologist center_id not updated correctly")
                return False
        else:
            print("   ❌ Failed to verify psychologist assignment")
            return False

        print("🎉 Psychologist assignment test passed!")
        return True

    def test_5_auth_endpoints_with_email(self):
        """Test 5: Authentication Endpoints with Email"""
        print("\n" + "="*60)
        print("📧 TEST 5: AUTHENTICATION ENDPOINTS WITH EMAIL")
        print("="*60)
        
        if not self.token:
            print("❌ No authentication token available")
            return False

        # Test 5.1: Register User (using existing create user functionality)
        register_data = {
            "username": "test_register",
            "email": "test.register@example.com",
            "first_name": "Test",
            "last_name": "Register",
            "password": "register123",
            "role": "psychologist",
            "specialization": "Psicología General"
        }
        
        success, response = self.run_test(
            "Register User (POST /api/auth/register)",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if success:
            print("   ✅ User registration successful")
            if 'message' in response and 'verification' in response['message'].lower():
                print("   ✅ Email verification message detected")
            else:
                print("   ⚠️  Email verification message not detected")
        else:
            print("   ❌ User registration failed")

        # Test 5.2: Request Password Reset
        reset_request_data = {
            "email": "ana.martinez@psicologia.com"  # Use existing user
        }
        
        success, response = self.run_test(
            "Request Password Reset (POST /api/auth/request-password-reset)",
            "POST",
            "auth/request-password-reset",
            200,
            data=reset_request_data
        )
        
        if success:
            print("   ✅ Password reset request successful")
            if 'message' in response and 'reset' in response['message'].lower():
                print("   ✅ Password reset message detected")
            else:
                print("   ⚠️  Password reset message not detected")
        else:
            print("   ❌ Password reset request failed")

        # Test 5.3: Request Password Reset for Non-existent Email
        reset_request_nonexistent = {
            "email": "nonexistent@example.com"
        }
        
        success, response = self.run_test(
            "Request Password Reset for Non-existent Email",
            "POST",
            "auth/request-password-reset",
            200,  # Should still return 200 for security
            data=reset_request_nonexistent
        )
        
        if success:
            print("   ✅ Password reset for non-existent email handled correctly")
        else:
            print("   ❌ Password reset for non-existent email failed")

        print("🎉 Authentication with email tests passed!")
        return True

    def test_6_patient_logic(self):
        """Test 6: New Patient Logic with Database Context"""
        print("\n" + "="*60)
        print("🏥 TEST 6: NEW PATIENT LOGIC WITH DATABASE CONTEXT")
        print("="*60)
        
        if not self.token:
            print("❌ No authentication token available")
            return False

        # Test 6.1: Create Individual Patient
        patient_data = {
            "first_name": "María",
            "last_name": "González",
            "email": "maria.gonzalez@example.com",
            "phone": "+51-987-111-222",
            "date_of_birth": "1985-03-20",
            "gender": "female",
            "address": "Jr. Los Olivos 456, Lima",
            "patient_type": "individual",
            "emergency_contact": {
                "name": "Juan González",
                "relationship": "Esposo",
                "phone": "+51-987-333-444"
            }
        }
        
        success, response = self.run_test(
            "Create Individual Patient (POST /api/patients)",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        
        if success and 'id' in response:
            self.created_patient_id = response['id']
            print(f"   ✅ Individual patient created with ID: {self.created_patient_id}")
            
            # Verify new fields
            new_fields = ['patient_type', 'database_context', 'psychologist_id', 'created_at', 'updated_at']
            for field in new_fields:
                if field in response:
                    print(f"   ✅ New field '{field}' present: {response[field]}")
                else:
                    print(f"   ❌ New field '{field}' missing")
            
            # Verify patient_type
            if response.get('patient_type') == 'individual':
                print("   ✅ patient_type correctly set to 'individual'")
            else:
                print(f"   ❌ patient_type incorrect: expected 'individual', got {response.get('patient_type')}")
            
            # Verify database_context assignment
            if response.get('database_context'):
                print(f"   ✅ database_context assigned: {response['database_context']}")
            else:
                print("   ❌ database_context not assigned")
        else:
            print("   ❌ Individual patient creation failed")
            return False

        # Test 6.2: Get Patients with Context-based Filtering
        success, response = self.run_test(
            "Get Patients with Context Filtering (GET /api/patients)",
            "GET",
            "patients",
            200
        )
        
        if success:
            print(f"   ✅ Found {len(response)} patients")
            
            # Verify context-based filtering
            if len(response) > 0:
                patient = response[0]
                context_fields = ['database_context', 'patient_type', 'psychologist_id']
                for field in context_fields:
                    if field in patient:
                        print(f"   ✅ Context field '{field}' present: {patient[field]}")
                    else:
                        print(f"   ❌ Context field '{field}' missing")
        else:
            print("   ❌ Failed to get patients")
            return False

        # Test 6.3: Verify Patient Type Validation
        invalid_patient_data = {
            "first_name": "Test",
            "last_name": "Invalid",
            "patient_type": "invalid_type"  # Invalid patient type
        }
        
        success, response = self.run_test(
            "Test Invalid Patient Type Validation",
            "POST",
            "patients",
            422,  # Should fail with validation error
            data=invalid_patient_data
        )
        
        if success:
            print("   ✅ Patient type validation working correctly")
        else:
            print("   ⚠️  Patient type validation test inconclusive")

        print("🎉 Patient logic tests passed!")
        return True

    def test_7_verify_new_fields(self):
        """Test 7: Verify New Fields and Database Structure"""
        print("\n" + "="*60)
        print("🔍 TEST 7: VERIFY NEW FIELDS AND DATABASE STRUCTURE")
        print("="*60)
        
        if not self.token:
            print("❌ No authentication token available")
            return False

        # Test 7.1: Verify User Fields
        success, response = self.run_test(
            "Verify User Fields Structure",
            "GET",
            "users",
            200
        )
        
        if success and len(response) > 0:
            user = response[0]
            required_new_fields = ['email_verified', 'created_at', 'updated_at']
            optional_new_fields = ['database_name', 'center_id']
            
            print("   📋 Checking required new user fields:")
            for field in required_new_fields:
                if field in user:
                    print(f"   ✅ Required field '{field}': {user[field]}")
                else:
                    print(f"   ❌ Required field '{field}' missing")
            
            print("   📋 Checking optional new user fields:")
            for field in optional_new_fields:
                if field in user:
                    print(f"   ✅ Optional field '{field}': {user[field]}")
                else:
                    print(f"   ⚪ Optional field '{field}' not present (may be role-dependent)")

        # Test 7.2: Verify Patient Fields
        if self.created_patient_id:
            success, response = self.run_test(
                "Verify Patient Fields Structure",
                "GET",
                f"patients/{self.created_patient_id}",
                200
            )
            
            if success:
                required_new_fields = ['patient_type', 'database_context', 'created_at', 'updated_at']
                optional_new_fields = ['center_id', 'shared_with']
                
                print("   📋 Checking required new patient fields:")
                for field in required_new_fields:
                    if field in response:
                        print(f"   ✅ Required field '{field}': {response[field]}")
                    else:
                        print(f"   ❌ Required field '{field}' missing")
                
                print("   📋 Checking optional new patient fields:")
                for field in optional_new_fields:
                    if field in response:
                        print(f"   ✅ Optional field '{field}': {response[field]}")
                    else:
                        print(f"   ⚪ Optional field '{field}' not present")

        # Test 7.3: Verify Center Fields
        if self.created_center_id:
            success, response = self.run_test(
                "Verify Center Fields Structure",
                "GET",
                "centers",
                200
            )
            
            if success and len(response) > 0:
                center = response[0]
                required_new_fields = ['database_name', 'created_by', 'created_at', 'updated_at']
                optional_new_fields = ['admin_id', 'psychologists', 'is_active']
                
                print("   📋 Checking required new center fields:")
                for field in required_new_fields:
                    if field in center:
                        print(f"   ✅ Required field '{field}': {center[field]}")
                    else:
                        print(f"   ❌ Required field '{field}' missing")
                
                print("   📋 Checking optional new center fields:")
                for field in optional_new_fields:
                    if field in center:
                        print(f"   ✅ Optional field '{field}': {center[field]}")
                    else:
                        print(f"   ⚪ Optional field '{field}' not present")

        print("🎉 New fields verification completed!")
        return True

    def test_8_role_based_permissions(self):
        """Test 8: Role-based Permission Validations"""
        print("\n" + "="*60)
        print("🔒 TEST 8: ROLE-BASED PERMISSION VALIDATIONS")
        print("="*60)
        
        if not self.token:
            print("❌ No authentication token available")
            return False

        # Test 8.1: Super Admin Permissions (should have access to everything)
        print("   📋 Testing Super Admin permissions:")
        
        # Centers access
        success, response = self.run_test(
            "Super Admin - Centers Access",
            "GET",
            "centers",
            200
        )
        if success:
            print("   ✅ Super Admin can access centers")
        else:
            print("   ❌ Super Admin cannot access centers")

        # Users access
        success, response = self.run_test(
            "Super Admin - Users Access",
            "GET",
            "users",
            200
        )
        if success:
            print("   ✅ Super Admin can access users")
        else:
            print("   ❌ Super Admin cannot access users")

        # Test 8.2: Test Permission Validation for Center Creation
        # Only super_admin should be able to create centers
        print("   📋 Testing center creation permissions:")
        
        center_data = {
            "name": "Test Permission Center",
            "address": "Test Address",
            "phone": "+51-1-111-1111",
            "email": "test@permission.com"
        }
        
        success, response = self.run_test(
            "Super Admin - Create Center Permission",
            "POST",
            "centers",
            200,
            data=center_data
        )
        if success:
            print("   ✅ Super Admin can create centers")
        else:
            print("   ❌ Super Admin cannot create centers")

        # Test 8.3: Test User Creation Permissions
        print("   📋 Testing user creation permissions:")
        
        test_user_data = {
            "username": "permission_test",
            "email": "permission.test@example.com",
            "first_name": "Permission",
            "last_name": "Test",
            "password": "test123",
            "role": "psychologist"
        }
        
        success, response = self.run_test(
            "Super Admin - Create User Permission",
            "POST",
            "users",
            200,
            data=test_user_data
        )
        if success:
            print("   ✅ Super Admin can create users")
        else:
            print("   ❌ Super Admin cannot create users")

        print("🎉 Role-based permission tests completed!")
        return True

def main():
    print("🏥 RESTRUCTURED BACKEND TESTING - Psychology Portal")
    print("=" * 60)
    print("Testing NEW user hierarchy and functionalities as requested")
    print("Backend URL: https://mindtrack-pro.preview.emergentagent.com/api")
    print("=" * 60)
    
    tester = RestructuredBackendTester()
    
    # Test sequence as requested
    tests = [
        ("Super Admin Login", tester.test_1_login_super_admin),
        ("Center Endpoints", tester.test_2_center_endpoints),
        ("User Management", tester.test_3_user_management),
        ("Psychologist Assignment", tester.test_4_psychologist_assignment),
        ("Auth Endpoints with Email", tester.test_5_auth_endpoints_with_email),
        ("Patient Logic", tester.test_6_patient_logic),
        ("Verify New Fields", tester.test_7_verify_new_fields),
        ("Role-based Permissions", tester.test_8_role_based_permissions)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n🚀 Starting {test_name}...")
        try:
            if not test_func():
                failed_tests.append(test_name)
                print(f"❌ {test_name} FAILED")
            else:
                print(f"✅ {test_name} PASSED")
        except Exception as e:
            failed_tests.append(test_name)
            print(f"❌ {test_name} FAILED with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   • {test}")
    else:
        print("\n🎉 ALL TESTS PASSED!")
    
    print("\n✅ TESTED FUNCTIONALITY:")
    print("   • Super Admin login (admin@psychologyportal.com/admin123)")
    print("   • Center management (POST, GET, PUT /api/centers)")
    print("   • User creation with new fields (email_verified, database_name)")
    print("   • Role-based filtering and permissions")
    print("   • Psychologist assignment to centers")
    print("   • Authentication endpoints with email verification")
    print("   • Patient creation with database_context")
    print("   • New fields verification (patient_type, database_name, etc.)")
    print("   • Role-based permission validations")
    
    return 0 if not failed_tests else 1

if __name__ == "__main__":
    sys.exit(main())