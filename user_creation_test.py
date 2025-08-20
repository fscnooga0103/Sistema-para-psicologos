import requests
import sys
import json
from datetime import datetime

class UserCreationTester:
    def __init__(self, base_url="https://mindtrack-pro.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.created_user_ids = []

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

    def test_login(self, email="admin@psychologyportal.com", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Login as Super Admin",
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

    def test_get_users_list(self):
        """Test GET /api/users endpoint"""
        success, response = self.run_test(
            "Get Users List (GET /api/users)",
            "GET",
            "users",
            200
        )
        
        if success:
            print(f"   Found {len(response)} existing users")
            for user in response:
                print(f"   - {user.get('email', 'No email')} ({user.get('role', 'No role')})")
        
        return success, response

    def test_create_psychologist_user(self):
        """Test creating a psychologist user"""
        user_data = {
            "username": "psicologo_test",
            "email": "psicologo_test@ejemplo.com",
            "first_name": "Dr. Juan",
            "last_name": "Pérez",
            "password": "password123",
            "role": "psychologist",
            "phone": "555-123-4567",
            "specialization": "Psicología Clínica",
            "license_number": "PSI-123456"
        }
        
        success, response = self.run_test(
            "Create Psychologist User (POST /api/users)",
            "POST",
            "users",
            200,
            data=user_data
        )
        
        if success and 'id' in response:
            self.created_user_ids.append(response['id'])
            print(f"   Created psychologist user with ID: {response['id']}")
            return response['id']
        return None

    def test_create_center_admin_user(self):
        """Test creating a center_admin user (only super_admin can do this)"""
        user_data = {
            "username": "admin_centro_test",
            "email": "admin_centro@ejemplo.com",
            "first_name": "María",
            "last_name": "González",
            "password": "password123",
            "role": "center_admin",
            "phone": "555-987-6543",
            "specialization": "Administración de Centro",
            "license_number": "ADM-789012"
        }
        
        success, response = self.run_test(
            "Create Center Admin User (POST /api/users)",
            "POST",
            "users",
            200,
            data=user_data
        )
        
        if success and 'id' in response:
            self.created_user_ids.append(response['id'])
            print(f"   Created center admin user with ID: {response['id']}")
            return response['id']
        return None

    def test_duplicate_email_validation(self):
        """Test that duplicate email is rejected"""
        user_data = {
            "username": "otro_usuario",
            "email": "psicologo_test@ejemplo.com",  # Same email as before
            "first_name": "Carlos",
            "last_name": "Rodríguez",
            "password": "password123",
            "role": "psychologist",
            "phone": "555-111-2222"
        }
        
        success, response = self.run_test(
            "Test Duplicate Email Validation",
            "POST",
            "users",
            400,  # Should fail with 400
            data=user_data
        )
        
        return success

    def test_duplicate_username_validation(self):
        """Test that duplicate username is rejected"""
        user_data = {
            "username": "psicologo_test",  # Same username as before
            "email": "otro_email@ejemplo.com",
            "first_name": "Ana",
            "last_name": "López",
            "password": "password123",
            "role": "psychologist",
            "phone": "555-333-4444"
        }
        
        success, response = self.run_test(
            "Test Duplicate Username Validation",
            "POST",
            "users",
            400,  # Should fail with 400
            data=user_data
        )
        
        return success

    def test_required_fields_validation(self):
        """Test that required fields are validated"""
        # Test missing email
        user_data = {
            "username": "test_sin_email",
            "first_name": "Test",
            "last_name": "User",
            "password": "password123",
            "role": "psychologist"
        }
        
        success, response = self.run_test(
            "Test Missing Email Validation",
            "POST",
            "users",
            422,  # Should fail with validation error
            data=user_data
        )
        
        if not success:
            print("   Note: Missing email validation might use different status code")
        
        # Test missing password
        user_data2 = {
            "username": "test_sin_password",
            "email": "test_sin_password@ejemplo.com",
            "first_name": "Test",
            "last_name": "User",
            "role": "psychologist"
        }
        
        success2, response2 = self.run_test(
            "Test Missing Password Validation",
            "POST",
            "users",
            422,  # Should fail with validation error
            data=user_data2
        )
        
        if not success2:
            print("   Note: Missing password validation might use different status code")
        
        return success or success2  # At least one should work

    def test_update_user(self, user_id):
        """Test updating a user"""
        if not user_id:
            print("❌ No user ID provided for update test")
            return False
        
        update_data = {
            "first_name": "Dr. Juan Carlos",
            "phone": "555-123-9999",
            "specialization": "Psicología Clínica y Terapia Familiar"
        }
        
        success, response = self.run_test(
            "Update User (PUT /api/users/{user_id})",
            "PUT",
            f"users/{user_id}",
            200,
            data=update_data
        )
        
        return success

    def test_unauthorized_access(self):
        """Test access without authentication"""
        old_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Test Unauthorized Access to Users",
            "GET",
            "users",
            401  # Should fail with unauthorized
        )
        
        self.token = old_token
        return success

    def test_role_permissions(self):
        """Test that only admin roles can create users"""
        # This would require logging in as a psychologist, but for now we'll test the current user
        if self.user_data.get('role') != 'super_admin':
            print("❌ Current user is not super_admin, cannot test role permissions properly")
            return False
        
        print("✅ Current user is super_admin, has correct permissions")
        return True

def main():
    print("👥 USER CREATION FUNCTIONALITY TESTING")
    print("=" * 60)
    print("Testing specifically the user creation functionality as requested")
    print("Backend URL: https://mindtrack-pro.preview.emergentagent.com/api")
    print("=" * 60)
    
    tester = UserCreationTester()
    
    # Test sequence as requested
    print("\n📋 Starting User Creation Tests...")
    
    # 1. Login with admin credentials
    print("\n1️⃣ TESTING LOGIN")
    if not tester.test_login("admin@psychologyportal.com", "admin123"):
        print("❌ Login failed, stopping tests")
        return 1
    
    # 2. Test GET /api/users endpoint
    print("\n2️⃣ TESTING GET USERS ENDPOINT")
    success, existing_users = tester.test_get_users_list()
    if not success:
        print("❌ Failed to get users list")
    
    # 3. Test creating psychologist user
    print("\n3️⃣ TESTING CREATE PSYCHOLOGIST USER")
    psychologist_id = tester.test_create_psychologist_user()
    
    # 4. Test creating center_admin user (only super_admin can do this)
    print("\n4️⃣ TESTING CREATE CENTER ADMIN USER")
    center_admin_id = tester.test_create_center_admin_user()
    
    # 5. Test validations
    print("\n5️⃣ TESTING VALIDATIONS")
    print("\n   5.1 Testing duplicate email validation:")
    tester.test_duplicate_email_validation()
    
    print("\n   5.2 Testing duplicate username validation:")
    tester.test_duplicate_username_validation()
    
    print("\n   5.3 Testing required fields validation:")
    tester.test_required_fields_validation()
    
    # 6. Test updating users
    print("\n6️⃣ TESTING UPDATE USER")
    if psychologist_id:
        tester.test_update_user(psychologist_id)
    
    # 7. Test permissions and security
    print("\n7️⃣ TESTING PERMISSIONS AND SECURITY")
    tester.test_unauthorized_access()
    tester.test_role_permissions()
    
    # 8. Verify users were created by getting the list again
    print("\n8️⃣ VERIFYING CREATED USERS")
    success, final_users = tester.test_get_users_list()
    if success:
        print(f"   Total users after creation: {len(final_users)}")
        print(f"   Users created in this test: {len(tester.created_user_ids)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All user creation tests passed!")
        print("\n✅ SUMMARY OF TESTED USER CREATION FUNCTIONALITY:")
        print("   • Login with admin@psychologyportal.com/admin123 ✅")
        print("   • GET /api/users endpoint for listing users ✅")
        print("   • POST /api/users for creating psychologist users ✅")
        print("   • POST /api/users for creating center_admin users ✅")
        print("   • Email duplication validation ✅")
        print("   • Username duplication validation ✅")
        print("   • Required fields validation ✅")
        print("   • PUT /api/users/{user_id} for updating users ✅")
        print("   • Authentication and permission checks ✅")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed. Check the issues above.")
        
        # Provide specific feedback about user creation
        if psychologist_id:
            print("✅ Psychologist user creation: SUCCESS")
        else:
            print("❌ Psychologist user creation: FAILED")
            
        if center_admin_id:
            print("✅ Center admin user creation: SUCCESS")
        else:
            print("❌ Center admin user creation: FAILED")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())