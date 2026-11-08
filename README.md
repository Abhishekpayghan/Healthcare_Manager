# Healthcare Management App

Staff log in, manage patients, upload PDF medical documents, and get an AI-made summary
and extracted test results that a human must review.

Stack: Django + Django REST Framework, React (Vite), PostgreSQL, Gemini API.

## Setup (Windows)

### 1. Database
Create an empty PostgreSQL database called `healthcare` (pgAdmin, or `createdb healthcare`).

### 2. Backend
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      (then open .env and fill in your values)
python manage.py migrate
python manage.py createsuperuser     (this account becomes the Admin)
python manage.py runserver
```
Get a free Gemini key at https://aistudio.google.com and put it in `.env` as `GEMINI_API_KEY`.

### 3. Frontend (second terminal)
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### Tests
```
cd backend
python manage.py test
```

## Folder structure
```
backend/
  config/      settings and main urls
  accounts/    User model (with role), register, login
  patients/    Patient model, CRUD api, access rules (access.py)
  documents/   Document model, upload api, services.py (PDF + AI)
  audit/       AuditLog model and log_action()
  agent/       Bonus AI agent: tools.py (the tools), services.py (the loop), views.py
  common/      error handler, dashboard numbers
frontend/src/
  pages/       Login, Register, Dashboard, PatientList, PatientForm, PatientDetail, Users, UserDetail
  agent/       Assistant.jsx (AI chat page) and its css
  components/  DocumentUpload, DocumentCard
  api.js       helper for calling the backend
```
Each backend app follows the same pattern: models -> serializers -> views -> urls.

## How it works (for explaining)
1. **Login**: the API returns a token. React stores it and sends it in every request header.
2. **Roles**: Admin sees all patients and is the only one who can delete. Doctor sees patients
   assigned to them or created by them. Staff sees only patients they created.
   This rule lives in one function, `visible_patients()` in `patients/access.py`,
   and patients, documents and the dashboard all use it.
3. **Upload**: the serializer checks the file (.pdf, max 5 MB, starts with `%PDF-`),
   saves it with status `pending`, writes an audit log and starts a background thread.
4. **Processing** (`documents/services.py`): status `processing` -> pypdf reads the text ->
   Gemini returns JSON -> `validate_ai_response()` checks it -> status `completed`.
   If anything goes wrong the status becomes `failed` with a short message.
5. **Frontend** checks the document list every 3 seconds while something is pending/processing,
   then shows the summary and a table of test results with a "please review" warning.

## API
| Method | URL | Who |
|---|---|---|
| POST | /api/auth/register/ | anyone (Doctor or Staff only) |
| POST | /api/auth/login/ | anyone |
| GET | /api/auth/me/, /api/auth/doctors/ | logged in |
| GET, POST | /api/patients/ (?search= &gender= &assigned_doctor=) | logged in |
| GET, PUT, PATCH | /api/patients/{id}/ | logged in, own scope |
| DELETE | /api/patients/{id}/ | Admin only |
| GET, POST | /api/documents/ (?patient= &status=) | logged in, own scope |
| GET | /api/documents/{id}/ | logged in, own scope |
| GET | /api/dashboard/ | logged in |
| GET | /api/auth/users/ (?search= &role=) | Admin only |
| GET | /api/auth/users/{id}/ | Admin only |
| POST | /api/agent/chat/ | logged in |

Audit logs can be read by the Admin at http://localhost:8000/admin/ .

## Admin: users and activity
Admins get a **Users** page in the sidebar. It lists every user (role, email, patients added,
documents uploaded, last activity). Clicking a user shows their details, the patients they added
and their latest 50 actions from the audit log. Staff and Doctors get 403 from these endpoints,
and the sidebar link is hidden for them.

## Bonus: Healthcare AI Agent
Page: **AI Assistant** in the sidebar. Endpoint: `POST /api/agent/chat/` with `{"message": "...", "history": [...]}`.

How it works:
1. The AI gets 3 tools: `search_patients`, `get_patient`, `get_document_details` (code in `backend/agent/tools.py`).
2. The AI never touches the database. It can only ask for a tool; Django runs it (`agent/services.py`, `run_agent`).
3. Each tool receives the **logged-in user from Django** and filters with `visible_patients()`, so the agent
   can never see more than the user can. Unauthorized records return the same "not found" error.
4. The loop repeats (max 5 rounds) until the AI answers. Tool use is written to the audit log.
5. The AI is told not to guess, diagnose or recommend treatment, and to treat record text as data.

## Security notes
- Secrets are in `.env` (not committed). Logs only contain ids and error types.
- Passwords are hashed and checked by Django's validators. Login is limited to 10 tries/minute.
- Uploaded files get random names and have no public URL.
- The AI prompt forbids inventing data, diagnoses and treatment advice, and every AI answer is
  validated before saving. Missing values are shown as "not found".
- Simple choices to know about: the token is kept in localStorage, and the background thread
  is used instead of a task queue to keep things simple.

## Suggested git commits
```
git init
git add backend/config backend/manage.py backend/requirements.txt backend/.env.example .gitignore
git commit -m "Set up Django project and settings"
git add backend/accounts backend/audit
git commit -m "Add user roles, registration, login and audit log"
git add backend/patients backend/common
git commit -m "Add patient CRUD with role based access and error handler"
git add backend/documents
git commit -m "Add PDF upload and background AI processing"
git add frontend
git commit -m "Add React frontend"
git add README.md
git commit -m "Add README"
```
