/**
 * CQI-LAB — Rotas de Relatórios (Admin)
 */

const express = require('express');
const router = express.Router();
const { dadosGerencial, gerarPDF } = require('../controllers/relatoriosController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar, autorizar('admin'));

router.get('/gerencial', dadosGerencial);        // Dados JSON do relatório
router.get('/gerencial/pdf', gerarPDF);          // Download do PDF

module.exports = router;