/**
 * CQI-LAB — Rotas de Amostras
 */

const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizarStatus } = require('../controllers/amostrasController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

// Todos os perfis autenticados podem consultar
router.get('/', listar);
router.get('/:id', buscarPorId);

// Somente secretária e admin criam solicitações
router.post('/', autorizar('admin', 'secretaria'), criar);

// Atualização de status — todos podem, com validação interna de transições por perfil
router.patch('/:id/status', autorizar('admin', 'secretaria', 'coletador', 'tecnico', 'responsavel_tecnico'), atualizarStatus);

module.exports = router;