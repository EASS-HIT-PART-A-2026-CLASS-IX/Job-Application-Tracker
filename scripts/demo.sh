#!/usr/bin/env bash
# Demo script — walks through the full Job Application Tracker flow
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

step() { echo -e "\n${BLUE}${BOLD}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✓ $1${RESET}"; }

step "Starting all services with Docker Compose"
docker compose up -d --build
echo "Waiting for API to be healthy..."
until curl -sf http://localhost:8000/health > /dev/null; do sleep 1; done
ok "API is up at http://localhost:8000"

step "Seeding the database with demo data"
docker compose exec api python -m scripts.seed
ok "Seeded — login with demo / demo1234"

step "Verifying API health endpoint"
curl -s http://localhost:8000/health | python3 -m json.tool
ok "Health check passed"

step "Registering a test user via API"
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"grader","password":"grader123"}' | python3 -m json.tool

step "Logging in and capturing JWT token"
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=grader&password=grader123" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
ok "Got token: ${TOKEN:0:40}..."

step "Creating a job application"
curl -s -X POST http://localhost:8000/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Demo Corp",
    "position": "Software Engineer",
    "status": "applied",
    "location": "Tel Aviv",
    "applied_date": "2026-05-01",
    "source": "LinkedIn",
    "notes": "Demo application",
    "favorite": false
  }' | python3 -m json.tool

step "Listing applications (only grader's own data)"
curl -s http://localhost:8000/applications \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

step "Running the async refresh worker"
docker compose run --rm worker || true
ok "Refresh worker complete — check Redis keys with: docker compose exec redis redis-cli KEYS 'refresh:*'"

step "Checking AI service health"
curl -s http://localhost:8001/health | python3 -m json.tool

step "Running the full test suite"
uv run pytest tests/ -v --tb=short

echo -e "\n${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}Demo complete. Open the frontend:${RESET}"
echo -e "  Frontend:  ${BLUE}http://localhost:5173${RESET}  (run: cd frontend && npm run dev)"
echo -e "  API docs:  ${BLUE}http://localhost:8000/docs${RESET}"
echo -e "  AI service: ${BLUE}http://localhost:8001/docs${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
