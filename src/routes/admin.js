const express = require('express');

module.exports = function makeAdmin({ ADMIN_TOKEN, loadAppointments }) {
  
  const loginRouter = express.Router();
  loginRouter.post('/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === 'admin' && password === 'admin') {
      return res.json({ token: ADMIN_TOKEN });
    }
    return res.status(401).json({ error: 'Credenciales inválidas' });
  });


  function requireAdmin(req, res, next) {
    const auth = req.headers['authorization'] || '';
    const parts = auth.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1] === ADMIN_TOKEN) {
      return next();
    }
    return res.status(401).json({ error: 'No autorizado' });
  }

  
  const adminRouter = express.Router();
  adminRouter.get('/appointments', (req, res) => {
    const { date, serviceId, status } = req.query;
    const sid = serviceId ? Number(serviceId) : null;

    let list = loadAppointments();

    if (date) list = list.filter(a => a.date === date);
    if (sid) list = list.filter(a => a.serviceId === sid);
    if (status) list = list.filter(a => a.status === status);

    list.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    return res.json(list);
  });

  return { loginRouter, adminRouter, requireAdmin };
};
