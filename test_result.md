#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Soy un psicólogo que quisiera un sistema autogestionable al que pueda acceder siempre ya sea desde mi computadora o desde mi celular. En el sistema quiero poder ver mis pacientes y su historia clínica (Con Datos personales; Estructura familiar; Motivo de la consulta; Hábitos de alimentación, higiene, sueño, independencia; Conducta; HIstoria Educativa; Relaciones Familiares; Antecedentes Familiares; Obseervaciones), así como su evaluación y su avance en el proceso que he planteado para ellos en relación a semanas y logros. Además quisiera ver mi agenda, en la cual debo poder revisar tanto el día como la hora de la cita que previamente se debe haber ingresado. Finalmente, cuando ingrese a la cita del paciente, poder ver qué está propuesto para la sesión, que logros se han alcanzado y proponer también acciones que se deben realizar en la próxima semana. Quisiera que al seleccionar a cada paciente tenga la historia clínica y el avance, teniendo una barra lateral retractitl que me permita siempre acceder a la evaluación, el diagnóstico presuntivo, y hacer anotaciones acerca del paciente. Finalmente, quisiera que mi sistema pudiera integrar los cobros que realizo y cuál es mi ganancia, día a día, semana a semana, mes a mes. El dashboard debe ser interactivo llevando a cada modulo. Debe estar listo para utilizar en un sitio web.

backend:
  - task: "User Authentication & Role Management"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "JWT-based authentication with role-based access control (super_admin, center_admin, psychologist) is fully implemented"

  - task: "Patient Management System"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Complete CRUD operations for patients with comprehensive data models"

  - task: "Clinical History & Anamnesis System"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Comprehensive anamnesis form with all required fields: personal data, family structure, consultation motive, habits, conduct, educational history, family relationships, family background, observations"

  - task: "Evaluations & Diagnosis System"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Models and endpoints for evaluations, diagnosis, and progress notes are implemented"

  - task: "Appointment/Agenda System"
    implemented: false
    working: "NA"
    file: "NOT_CREATED"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Appointment scheduling system needs to be implemented with day/time management"

  - task: "Session Management & Weekly Progress"
    implemented: false
    working: "NA"
    file: "NOT_CREATED"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Session planning with weekly goals and achievements tracking needs implementation"

  - task: "Payment & Earnings System"
    implemented: false
    working: "NA"
    file: "NOT_CREATED"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Payment tracking and earnings analysis (daily, weekly, monthly) needs implementation"

frontend:
  - task: "Authentication UI"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Login system with multi-language support (EN/ES) implemented"

  - task: "Dashboard with Basic Stats"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Basic dashboard showing patient statistics, needs enhancement for interactivity"

  - task: "Patient Management UI"
    implemented: true
    working: true
    file: "/app/frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Patient list, add patient modal, and anamnesis form integration working"

  - task: "Retractable Sidebar for Patient Details"
    implemented: false
    working: "NA"
    file: "NOT_CREATED"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Patient detail view with retractable sidebar for evaluations, diagnosis, and notes needs implementation"

  - task: "Appointment/Agenda UI"
    implemented: false
    working: "NA"
    file: "NOT_CREATED"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Schedule interface showing upcoming appointments needs implementation"

  - task: "Session Management UI"
    implemented: false
    working: "NA"
    file: "NOT_CREATED"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Session interface with weekly goals and achievements tracking needs implementation"

  - task: "Payment & Earnings UI"
    implemented: false
    working: "NA"
    file: "NOT_CREATED"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "main"
        comment: "Financial dashboard showing daily/weekly/monthly earnings needs implementation"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Appointment/Agenda System"
    - "Session Management & Weekly Progress"
    - "Payment & Earnings System"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Analyzed existing psychology practice management system. Core patient management and clinical history (anamnesis) are fully implemented. Missing: appointments, session management, payments, and enhanced UI features."