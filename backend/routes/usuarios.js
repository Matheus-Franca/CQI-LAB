/**
 * CQI-LAB — Rotas de Usuários (Admin)
 */

const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizar } = require('../controllers/usuariosController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Todas as rotas exigem autenticação e perfil Admin
router.use(autenticar, autorizar('admin'));

router.get('/', listar);           // GET  /api/usuarios
router.get('/:id', buscarPorId);   // GET  /api/usuarios/:id
router.post('/', criar);           // POST /api/usuarios
router.put('/:id', atualizar);     // PUT  /api/usuarios/:id

module.exports = router;