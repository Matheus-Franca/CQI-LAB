/**
 * CQI-LAB — Rotas de Pacientes
 */

const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizar } = require('../controllers/pacientesController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Requer autenticação; secretária e admin têm acesso
router.use(autenticar);

router.get('/', autorizar('admin', 'secretaria', 'coletador', 'tecnico', 'responsavel_tecnico'), listar);
router.get('/:id', autorizar('admin', 'secretaria', 'coletador', 'tecnico', 'responsavel_tecnico'), buscarPorId);
router.post('/', autorizar('admin', 'secretaria'), criar);
router.put('/:id', autorizar('admin', 'secretaria'), atualizar);

module.exports = router;