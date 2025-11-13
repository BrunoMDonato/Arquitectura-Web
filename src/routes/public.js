const express = require('express');

module.exports = function makePublicRouter({ services, config, loadAppointments, saveAppointments }) {
  const router = express.Router();

  // health
  router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // servicios
  router.get('/services', (req, res) => {
    res.json(services);
  });

  // disponibilidad
  router.get('/availability/day', (req, res) => {
    const { date, serviceId } = req.query;

    const sid = Number(serviceId);
    if (!date || !sid) {
      return res.status(400).json({ error: 'date y serviceId son obligatorios' });
    }

    const service = services.find((s) => s.id === sid);
    if (!service) {
      return res.status(400).json({ error: 'serviceId inválido' });
    }

    const open = hhmmToMinutes(config.openingTime);
    const close = hhmmToMinutes(config.closingTime);
    const dur = service.durationMinutes;

    const all = loadAppointments();
    const occupiedTimes = new Set(
      all
        .filter((a) => a.serviceId === sid && a.date === date && a.status !== 'canceled')
        .map((a) => a.time)
    );

    const slots = [];
    for (let start = open; start + dur <= close; start += 15) {
      const hhmm = minutesToHhmm(start);
      if (!occupiedTimes.has(hhmm)) slots.push(hhmm);
    }

    return res.json({
      date,
      serviceId: sid,
      durationMinutes: dur,
      openingTime: config.openingTime,
      closingTime: config.closingTime,
      available: slots
    });
  });

  // listar turnos
  router.get('/appointments', (req, res) => {
    const appointments = loadAppointments();
    res.json(appointments);
  });

  // crear turno
  router.post('/appointments', (req, res) => {
    const { serviceId, date, time, studentName } = req.body;

    if (!serviceId || !date || !time || !studentName) {
      return res.status(400).json({ error: 'serviceId, date, time y studentName son obligatorios' });
    }

    const service = services.find((s) => s.id === serviceId);
    if (!service) {
      return res.status(400).json({ error: 'serviceId inválido' });
    }

    const appointments = loadAppointments();

    // no pisar turnos
    const alreadyExists = appointments.some(
      (appt) => appt.serviceId === serviceId && appt.date === date && appt.time === time
        && appt.status !== 'canceled'
    );
    if (alreadyExists) {
      return res.status(409).json({ error: 'Ya existe un turno reservado para ese servicio en esa fecha y hora' });
    }

    const newId = appointments.length > 0 ? appointments[appointments.length - 1].id + 1 : 1;

    const newAppointment = {
      id: newId,
      serviceId,
      date,
      time,
      studentName,
      status: 'confirmed'
    };

    appointments.push(newAppointment);
    saveAppointments(appointments);

    return res.status(201).json(newAppointment);
  });

  // cancelar y reprogramar
  router.patch('/appointments/:id', (req, res) => {
    const id = Number(req.params.id);
    const { action, date, time } = req.body;

    if (!id || !action) {
      return res.status(400).json({ error: 'id y action son obligatorios' });
    }

    const appointments = loadAppointments();
    const idx = appointments.findIndex((a) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const appt = appointments[idx];

    if (action === 'cancel') {
      if (appt.status === 'canceled') {
        return res.status(409).json({ error: 'El turno ya estaba cancelado' });
      }
      appt.status = 'canceled';
      appointments[idx] = appt;
      saveAppointments(appointments);
      return res.json(appt);
    }

    if (action === 'reschedule') {
      if (!date || !time) {
        return res.status(400).json({ error: 'Para reprogramar se requiere date y time' });
      }

      const conflict = appointments.some((other) =>
        other.id !== id &&
        other.serviceId === appt.serviceId &&
        other.date === date &&
        other.time === time &&
        other.status !== 'canceled'
      );
      if (conflict) {
        return res.status(409).json({ error: 'Ya existe un turno en esa fecha y hora' });
      }

      appt.date = date;
      appt.time = time;
      appt.status = 'confirmed';
      appointments[idx] = appt;
      saveAppointments(appointments);
      return res.json(appt);
    }

    return res.status(400).json({ error: 'action inválida. Use "cancel" o "reschedule"' });
  });

  
  function hhmmToMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }
  function minutesToHhmm(total) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  return router;
};
