const express = require('express');
const { body } = require('express-validator');
const { createProduct, listProducts, getProduct, updateProduct, deleteProduct, scanProduct } = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authMiddleware);

router.post('/scan', [body('sku').trim().notEmpty()], validate, scanProduct);
router.get('/',         listProducts);
router.post('/',        [body('name').trim().notEmpty(), body('price').isFloat({ min: 0 })], validate, createProduct);
router.get('/:id',      getProduct);
router.put('/:id',      updateProduct);
router.delete('/:id',   deleteProduct);

module.exports = router;
