# Gestión de Turnos – Laboratorio (API)

API mínima para gestionar turnos del laboratorio (solo backend).  
Persistencia en archivos JSON. Sin base de datos ni frontend.

## Stack
- Node.js + Express
- Archivos JSON en `src/data/`

## Correr
```bash
npm install
npm run dev
# http://localhost:3000
```

## Endpoints

### Público
- `GET /api/v1/health` → `{ "status": "ok" }`
- `GET /api/v1/services` → catálogo de servicios
- `GET /api/v1/availability/day?date=YYYY-MM-DD&serviceId=ID` → horarios disponibles
- `GET /api/v1/appointments` → lista de turnos
- `POST /api/v1/appointments`
```json
{ "serviceId": 2, "date": "2025-11-11", "time": "10:00", "studentName": "Nombre" }
```
- `PATCH /api/v1/appointments/:id`
  - cancelar: `{"action":"cancel"}`
  - reprogramar: `{"action":"reschedule","date":"YYYY-MM-DD","time":"HH:MM"}`
 

### Admin (mock)
- `POST /api/v1/auth/login`→ body `{"username":"admin","password":"admin"}`
  - devuelve `{ "token": "lab-admin" }`
- `GET /api/v1/admin/appointments?date=...&serviceId=...&status=...`
  - header: `Authorization: Bearer lab-admin`

## Ejemplos rápidos

### PowerShell
```powershell
$base = "http://localhost:3000/api/v1"
Invoke-RestMethod -Uri "$base/health" -Method Get

$body = @{ serviceId=2; date="2025-11-11"; time="16:00"; studentName="Tester" } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/appointments" -Method Post -Body $body -ContentType "application/json"
```

### CURL
```bash
curl -s http://localhost:3000/api/v1/services

curl -s -X POST http://localhost:3000/api/v1/appointments \
 -H "Content-Type: application/json" \
 -d '{"serviceId":2,"date":"2025-11-11","time":"16:00","studentName":"Tester"}'
```

## Datos
- `src/data/services.json` – servicios y duración en minutos
- `src/data/config.json` – horario (ej.: `{"openingTime":"09:00","closingTime":"18:00"}`)
- `src/data/appointments.json` – se actualiza al crear/cancelar/reprogramar

## Estructura
```txt
src/
  app.js
  server.js
  routes/
    public.js
    admin.js
  data/
    services.json
    appointments.json
    config.json
```

## Notas
- Validaciones básicas y códigos HTTP (`400/401/404/409`).
- Auth de admin simulada (token fijo) para fines de TP.





