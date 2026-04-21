# Job Application Tracker

A full-stack job application tracker built with FastAPI, SQLModel, SQLite, React, and Vite.

The project lets users view existing applications, add a new application quickly, update entries, delete entries, mark favorites, export data to CSV, and view summary information in a dashboard.

## Requirements Coverage

This project satisfies the requested requirements:

- Users can list existing entries and add a new entry in under a minute from launch.
- The app includes small extra features such as favorites, summary metrics, charts, and CSV export.
- The README explains how to run the backend API and the frontend interface side-by-side on a local machine.

## Features

### Backend

- Create a job application
- List all job applications
- Get a job application by ID
- Update a job application
- Delete a job application
- Seed the database with sample data
- Test the API with pytest

### Frontend

- Dashboard with summary cards
- Application board with search, filters, and sorting
- Add application form
- Edit application in a modal window
- Delete confirmation modal
- Mark and unmark favorite applications
- Favorites page with favorite-specific metrics and chart
- Dashboard charts and recent activity
- Export visible applications to CSV
- Light and dark mode
- Automated interface workflow test with Vitest and Testing Library

## Tech Stack

### Backend

- Python 3.11+
- FastAPI
- Pydantic
- SQLModel
- SQLite
- Uvicorn
- pytest

### Frontend

- React
- Vite
- CSS
- lucide-react
- Vitest
- Testing Library

## API Endpoints

### Applications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/applications` | Get all applications |
| GET | `/applications/{id}` | Get application by ID |
| POST | `/applications` | Create a new application |
| PUT | `/applications/{id}` | Update an application |
| DELETE | `/applications/{id}` | Delete an application |

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Check if the API is running |

## Project Structure

```text
job-application-tracker/
├── app/
│   ├── __init__.py
│   ├── db.py                    # Database configuration
│   ├── main.py                  # FastAPI entry point
│   ├── models.py                # SQLModel models
│   ├── schemas.py               # Pydantic/response schemas
│   └── routes/
│       ├── __init__.py
│       └── applications.py      # Application API routes
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React app
│   │   ├── App.css              # Main UI styles
│   │   └── index.css            # Global frontend styles
│   ├── tests/
│   │   ├── App.test.jsx         # Frontend interface workflow test
│   │   └── setupTests.js        # Frontend test setup
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   └── seed.py                  # Seed sample data
├── tests/
│   └── test_applications.py     # Backend API tests
├── requests.http                # Manual API request examples
├── pyproject.toml
├── README.md
└── .gitignore
```

## Setup

### 1. Create and activate a virtual environment

```bash
uv venv
source .venv/bin/activate
```

### 2. Install backend dependencies

```bash
uv sync --dev
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Run the Project Locally

Run the backend and frontend in two separate terminals.

### Terminal 1: Run the API

```bash
source .venv/bin/activate
uv run uvicorn app.main:app --reload
```

Backend URLs:

- API: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

### Terminal 2: Run the frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

- Interface: `http://127.0.0.1:5173`

## Running Tests

Run backend tests:

```bash
uv run pytest
```

Run frontend interface tests:

```bash
cd frontend
npm run test
```

## Seed Script

To populate the database with sample data:

```bash
uv run python scripts/seed.py
```

The seed script is useful for quickly populating the app with demo records for development and presentation.

## requests.http

The `requests.http` file contains manual API request examples. It can be used from IDE HTTP clients to test the backend endpoints without using the frontend.

## Interface Testing

The frontend includes one automated interface workflow test in `frontend/tests/App.test.jsx`.

That test verifies a basic user flow:

- open the app
- go to the Applications page
- fill in the add form
- submit a new application
- verify the new application appears in the UI

## Example Request Body

```json
{
  "company": "Example Company",
  "position": "Backend Developer",
  "status": "applied",
  "location": "Tel Aviv",
  "applied_date": "2026-03-25",
  "source": "LinkedIn",
  "notes": "Sent CV",
  "favorite": false
}
```

## Design

The backend follows a simple layered architecture:

- Routes layer: handles HTTP requests
- Schemas layer: validates request and response data
- Models layer: defines database structure with SQLModel
- Database layer: manages persistence using SQLite

The project initially started from a simpler setup and was extended into a full-stack app with persistent storage and a React interface.

## Notes

- The backend uses SQLite through SQLModel for persistence.
- The frontend is designed for quick application tracking and management.
- The current implementation uses a real database and a seed script, but migrations are not yet included.

## AI Assistance

This project was developed with support from AI tools during implementation and debugging.

### How AI was used

- Exploring project structure ideas
- Understanding FastAPI and SQLModel integration
- Debugging frontend and backend issues
- Improving UI layout and feature behavior
- Refining README and project documentation

### How outputs were verified

- Code was reviewed manually before use
- Backend behavior was tested locally
- Endpoints were checked through Swagger and manual requests
- Frontend behavior was checked locally in the browser
- Seed behavior and UI flows were tested during development
