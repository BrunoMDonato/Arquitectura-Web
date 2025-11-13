# Gestión de Turnos – Laboratorio (API)

## Propósito
API sencilla para gestionar turnos de uso del laboratorio de la facultad.
Permite consultar servicios disponibles, ver horarios libres por día, crear/cancelar/reprogramar turnos y listar turnos para administración. Persistencia simple en JSON (sin base de datos).

## Alcance
- Sin frontend (solo API REST).
- Persistencia: archivos JSON en src/data/.
- Auth mock para endpoints de administración (token fijo).
- Enfoque MVP para TP: validaciones básicas y códigos HTTP correctos.

## Entidades principales
### Propiedades
- Servicio: recurso reservable (p. ej., “PC alta performance”, “Laboratorio general”).
  - Atributos: id, name, description, durationMinutes.
- Turno: reserva de un servicio en una fecha/hora.
  - Atributos: id, serviceId, date, time, studentName, status ("confirmed" | "canceled").

### Operaciones (CRUD mínimo)
- Servicios
  - Listar catálogo de servicios.
- Disponibilidad
  - Consultar horarios disponibles por fecha y servicio (respeta duración del servicio y horario de apertura/cierre).
- Turnos
  - Crear turno (valida campos y no solapar mismo servicio/fecha/hora).
  -  Cancelar turno (marca status="canceled").
  -  Reprogramar turno (valida conflicto).
- Administración (protegido)
  - Login mock (devuelve token fijo).
  - Listar turnos con filtros (date, serviceId, status).


 ### Estructura del proyecto




 

### Requisitos
- Node.js 18+
- Windows PowerShell (o Postman/Insomnia/curl)


### Instalación y ejecución





### Endpoints
### Health
GET /api/v1/health
200 → { "status": "ok" }


### Servicios
GET /api/v1/services
200 → [ { "id": 1, "name": "...", "durationMinutes": 60 }, ... ]

### Disponibilidad por día/servicio
GET /api/v1/availability/day?date=YYYY-MM-DD&serviceId=ID
Calcula slots entre config.openingTime y config.closingTime.
Avance de 15 minutos.
Excluye turnos confirmados (ignora cancelados).

200 ->
{
  "date": "2025-11-11",
  "serviceId": 2,
  "durationMinutes": 90,
  "openingTime": "09:00",
  "closingTime": "18:00",
  "available": ["09:00","09:15","09:30","..."]
}


 ### Turnos (público)

Listar: GET /api/v1/appointments
Crear: POST /api/v1/appointments
{
  "serviceId": 2,
  "date": "2025-11-11",
  "time": "10:00",
  "studentName": "Nombre"
}
Respuestas:
- 201 turno creado (status: "confirmed").
- 400 campos faltantes / formato inválido.
- 400 serviceId inválido.
- 409 conflicto (ya existe turno para ese servicio/fecha/hora).

### Actualizar (cancelar o reprogramar): PATCH /api/v1/appointments/:id
- Cancelar:
{ "action": "cancel" }
- Reprogramar
{ "action": "reschedule", "date": "2025-11-11", "time": "13:00" }

Respuestas:
- 200 turno actualizado.
- 400 acción inválida / faltan date o time.
- 404 turno no encontrado.
- 409 conflicto en reprogramación.

### Administración (protegido, auth mock)
- Login: POST /api/v1/auth/login
  Body: {"username":"admin","password":"admin"}
  200 → {"token":"lab-admin"}

- Listar turnos (filtros): GET /api/v1/admin/appointments?date=YYYY-MM-DD&serviceId=ID&status=confirmed
  Header: Authorization: Bearer lab-admin


### Uso rápido (PowerShell)

$base = "http://localhost:3000/api/v1"
$serviceId = 2
$date = "2025-11-11"

# Health y servicios
Invoke-RestMethod -Uri "$base/health" -Method Get
Invoke-RestMethod -Uri "$base/services" -Method Get

# Disponibilidad
Invoke-RestMethod -Uri "$base/availability/day?date=$date&serviceId=$serviceId" -Method Get

# Crear turno
$body = @{ serviceId=$serviceId; date=$date; time="16:00"; studentName="Tester" } | ConvertTo-Json
$a = Invoke-RestMethod -Uri "$base/appointments" -Method Post -Body $body -ContentType "application/json"
$id = $a.id

# Intentar duplicar (debe dar 409)
Invoke-RestMethod -Uri "$base/appointments" -Method Post -Body $body -ContentType "application/json"

# Cancelar
$cancel = @{ action="cancel" } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/appointments/$id" -Method Patch -Body $cancel -ContentType "application/json"

# Reprogramar
$res = @{ action="reschedule"; date=$date; time="16:30" } | ConvertTo-Json
Invoke-RestMethod -Uri "$base/appointments/$id" -Method Patch -Body $res -ContentType "application/json"

# Login admin y listado con filtros
$login = @{ username="admin"; password="admin" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $login -ContentType "application/json").token
$h = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "$base/admin/appointments?date=$date&serviceId=$serviceId&status=confirmed" -Method Get -Headers $h


### CURL equivalente (opcional)

# Health
curl -s http://localhost:3000/api/v1/health

# Crear turno
curl -s -X POST http://localhost:3000/api/v1/appointments \
 -H "Content-Type: application/json" \
 -d '{"serviceId":2,"date":"2025-11-11","time":"16:00","studentName":"Tester"}'

# Login admin
curl -s -X POST http://localhost:3000/api/v1/auth/login \
 -H "Content-Type: application/json" \
 -d '{"username":"admin","password":"admin"}'
# => {"token":"lab-admin"}

# Listado admin (con token)
curl -s http://localhost:3000/api/v1/admin/appointments?date=2025-11-11 \
 -H "Authorization: Bearer lab-admin"


### Datos y configuración
- src/data/services.json: catálogo de servicios y duración en minutos.
- src/data/config.json: horario de laboratorio:

{ "openingTime": "09:00", "closingTime": "18:00" }

- src/data/appointments.json: se actualiza automáticamente al crear/cancelar/reprogramar.


### Códigos de respuesta

- 200 OK
- 201 Creado
- 400 Solicitud inválida (campos faltantes/formato)
- 401 No autorizado (admin)
- 404 No encontrado
- 409 Conflicto de turno


### Notas
La autenticación de admin es mock (token fijo lab-admin) para fines de TP.
No hay base de datos: se usa persistencia en archivos JSON.








