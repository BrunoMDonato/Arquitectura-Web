const express = require('express');
const fs = require('fs');
const path = require('path');


const services = require('./data/services.json');
const config = require('./data/config.json');

const appointmentsFilePath = path.join(__dirname, 'data', 'appointments.json');

function loadAppointments() {
  try {
    const raw = fs.readFileSync(appointmentsFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo appointments.json:', err);
    return [];
  }
}

function saveAppointments(appointments) {
  fs.writeFileSync(appointmentsFilePath, JSON.stringify(appointments, null, 2));
}

const app = express();
app.use(express.json());

const makePublic = require('./routes/public');
const makeAdmin = require('./routes/admin');

const ADMIN_TOKEN = 'lab-admin';

const publicRouter = makePublic({
  services,
  config,
  loadAppointments,
  saveAppointments
});

const { loginRouter, adminRouter, requireAdmin } = makeAdmin({
  ADMIN_TOKEN,
  loadAppointments
});

app.use('/api/v1', publicRouter);
app.use('/api/v1', loginRouter);
app.use('/api/v1/admin', requireAdmin, adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
