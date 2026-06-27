/**
 * CQI-LAB — Rotas de Catálogo (Tipos de Material e Exame)
 */

const express = require('express');
const router = express.Router();
const cat = require('../controllers/catalogoController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

// Materiais — leitura para todos, escrita apenas para admin
router.get('/materiais', cat.listarMateriais);
router.post('/materiais', autorizar('admin'), cat.criarMaterial);
router.put('/materiais/:id', autorizar('admin'), cat.atualizarMaterial);
router.delete('/materiais/:id', autorizar('admin'), cat.removerMaterial);

// Exames — leitura para todos, escrita apenas para admin
router.get('/exames', cat.listarExames);
router.post('/exames', autorizar('admin'), cat.criarExame);
router.put('/exames/:id', autorizar('admin'), cat.atualizarExame);
router.delete('/exames/:id', autorizar('admin'), cat.removerExame);

module.exports = router;