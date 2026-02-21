const { Product } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { Op } = require('sequelize');

// Generate a 13-digit EAN-style SKU
const generateSKU = () => {
  const ts   = Date.now().toString().slice(-9);           // 9 digits from timestamp
  const rand = Math.floor(Math.random() * 999).toString().padStart(3, '0'); // 3 random
  const base = `${ts}${rand}`;  // 12 digits
  // EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return `${base}${check}`;
};

// POST /api/products  — create product + auto-generate barcode SKU
const createProduct = async (req, res, next) => {
  try {
    const { name, price, category, size, color, stock, sku } = req.body;
    
    console.log('[createProduct] Request body:', req.body);
    
    if (!name || !price) {
      console.error('[createProduct] Validation failed: name or price missing');
      return sendError(res, 'name and price are required.', null, 400);
    }

    const finalSku = (sku && sku.trim()) ? sku.trim() : generateSKU();
    console.log('[createProduct] Generated SKU:', finalSku);

    // Check duplicate SKU
    const existing = await Product.findOne({ where: { sku: finalSku } });
    if (existing) {
      console.warn('[createProduct] Duplicate SKU:', finalSku);
      return sendError(res, `SKU "${finalSku}" already exists.`, null, 409);
    }

    const product = await Product.create({
      name: name.trim(),
      sku: finalSku,
      price: parseFloat(price),
      category: category?.trim() || null,
      size: size?.trim() || null,
      color: color?.trim() || null,
      stock: parseInt(stock) || 0,
    });

    console.log('[createProduct] ✅ Product created:', product.id);
    return sendSuccess(res, 'Product created.', product, 201);
  } catch (err) {
    console.error('[createProduct] ❌ Error:', err.message);
    console.error('[createProduct] Stack:', err.stack);
    next(err);
  }
};

// GET /api/products  — list all active products
const listProducts = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { active: true };
    if (search) {
      where[Op.or] = [
        { name:     { [Op.like]: `%${search}%` } },
        { sku:      { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
      ];
    }
    const products = await Product.findAll({ where, order: [['created_at', 'DESC']] });
    return sendSuccess(res, 'Products fetched.', products);
  } catch (err) { next(err); }
};

// GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product || !product.active) return sendError(res, 'Product not found.', null, 404);
    return sendSuccess(res, 'Product fetched.', product);
  } catch (err) { next(err); }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return sendError(res, 'Product not found.', null, 404);
    const { name, price, category, size, color, stock } = req.body;
    await product.update({
      name:     name?.trim()     || product.name,
      price:    price !== undefined ? parseFloat(price) : product.price,
      category: category?.trim() ?? product.category,
      size:     size?.trim()     ?? product.size,
      color:    color?.trim()    ?? product.color,
      stock:    stock !== undefined ? parseInt(stock) : product.stock,
    });
    return sendSuccess(res, 'Product updated.', product);
  } catch (err) { next(err); }
};

// DELETE /api/products/:id  — soft delete
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return sendError(res, 'Product not found.', null, 404);
    await product.update({ active: false });
    return sendSuccess(res, 'Product deleted.');
  } catch (err) { next(err); }
};

// POST /api/products/scan  — lookup by SKU (used by POS scanner)
const scanProduct = async (req, res, next) => {
  try {
    const { sku } = req.body;
    if (!sku?.trim()) return sendError(res, 'SKU is required.', null, 400);

    const product = await Product.findOne({
      where: { sku: sku.trim(), active: true },
    });
    if (!product) return sendError(res, `Product "${sku}" not found. Add it in Products page.`, null, 404);

    return sendSuccess(res, 'Product found.', {
      product_name: product.name,
      sku:          product.sku,
      price:        parseFloat(product.price),
      stock:        product.stock,
      category:     product.category,
      size:         product.size,
      color:        product.color,
    });
  } catch (err) { next(err); }
};

module.exports = { createProduct, listProducts, getProduct, updateProduct, deleteProduct, scanProduct };
