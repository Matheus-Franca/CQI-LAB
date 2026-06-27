/**
 * CQI-LAB — Rotas de Contato
 */

const express = require('express');
const router = express.Router();
const { enviarMensagem, listarMensagens, marcarLida } = require('../controllers/contatoController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Público — qualquer visitante pode enviar
router.post('/', enviarMensagem);

// Restrito ao Admin
router.get('/', autenticar, autorizar('admin'), listarMensagens);
router.patch('/:id/lida', autenticar, autorizar('admin'), marcarLida);

module.exports = router;