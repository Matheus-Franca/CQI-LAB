/**
 * CQI-LAB — Rotas de Autenticação
 */

const express = require('express');
const router = express.Router();
const { login, me, alertas } = require('../controllers/authController');
const { autenticar } = require('../middlewares/auth');

// POST /api/auth/login — Login do usuário
router.post('/login', login);

// GET /api/auth/me — Dados do usuário logado (requer autenticação)
router.get('/me', autenticar, me);

// GET /api/auth/alertas — Contagem de alertas (requer autenticação)
router.get('/alertas', autenticar, alertas);

module.exports = router;