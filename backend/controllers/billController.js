const path = require('path');
const { sequelize } = require('../config/database');
const { Bill, BillItem, Customer, Product } = require('../models');
const { generateBillId, generatePublicToken } = require('../utils/generators');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const {
  sendSMS,
  sendWhatsApp,
  buildInvoiceMessage,
} = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/bills/checkout
 * Atomic: customer → totals → stock check → bill → bill_items → stock deduct → commit
 */
const checkout = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {
      customer_name,
      customer_phone,
      items,
      discount_percent,
      payment_status,
      amount_paid,
      due_date,
    } = req.body;

    // ── 1. Customer ───────────────────────────────────────
    const [customer] = await Customer.findOrCreate({
      where:    { phone: customer_phone },
      defaults: { name: customer_name, phone: customer_phone },
      transaction: t,
    });

    // ── 2. Stock validation + lock rows for update ────────
    // We lock each product row with FOR UPDATE inside the transaction
    // so two simultaneous checkouts can't oversell the same item.
    const stockUpdates = []; // { product, qty } pairs to deduct after bill created

    for (const item of items) {
      if (!item.sku || !item.sku.trim()) continue; // skip items without SKU (manual entries)

      const product = await Product.findOne({
        where: { sku: item.sku.trim(), active: true },
        lock:  t.LOCK.UPDATE,   // row-level lock
        transaction: t,
      });

      if (!product) {
        await t.rollback();
        return sendError(
          res,
          `Product with SKU "${item.sku}" not found in inventory. Add it in the Products page first.`,
          null, 404
        );
      }

      const qtyRequested = parseInt(item.quantity, 10);

      if (product.stock < qtyRequested) {
        await t.rollback();
        return sendError(
          res,
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${qtyRequested}.`,
          { product_name: product.name, available: product.stock, requested: qtyRequested },
          422
        );
      }

      stockUpdates.push({ product, qty: qtyRequested });
    }

    // ── 3. Calculate Totals ───────────────────────────────
    let subtotal = 0;
    const processedItems = items.map((item) => {
      const lineTotal = parseFloat(item.price) * parseInt(item.quantity, 10);
      subtotal += lineTotal;
      return { ...item, line_total: lineTotal };
    });

    const discountPct = parseFloat(discount_percent) || 0;
    const discountAmt = (subtotal * discountPct) / 100;
    const finalAmount = subtotal - discountAmt;

    // ── 4. Partial Payment Logic ──────────────────────────
    let paidNow        = 0;
    let amountDue      = 0;
    let resolvedStatus = payment_status || 'PAID';

    if (resolvedStatus === 'PAID') {
      paidNow   = finalAmount;
      amountDue = 0;
    } else {
      paidNow   = Math.min(parseFloat(amount_paid) || 0, finalAmount);
      amountDue = finalAmount - paidNow;
      if (amountDue <= 0) { amountDue = 0; resolvedStatus = 'PAID'; }
    }

    // ── 5. Create Bill ────────────────────────────────────
    const bill = await Bill.create(
      {
        bill_id:          generateBillId(),
        customer_id:      customer.id,
        subtotal:         subtotal.toFixed(2),
        discount_percent: discountPct.toFixed(2),
        discount_amount:  discountAmt.toFixed(2),
        final_amount:     finalAmount.toFixed(2),
        amount_paid:      paidNow.toFixed(2),
        amount_due:       amountDue.toFixed(2),
        payment_status:   resolvedStatus,
        due_date:         resolvedStatus === 'PENDING' ? (due_date || null) : null,
        public_token:     generatePublicToken(),
      },
      { transaction: t }
    );

    // ── 6. Bill Items ─────────────────────────────────────
    const billItems = processedItems.map((item) => ({
      bill_id:      bill.id,
      product_name: item.product_name,
      sku:          item.sku || null,
      price:        parseFloat(item.price).toFixed(2),
      quantity:     parseInt(item.quantity, 10),
      line_total:   item.line_total.toFixed(2),
    }));
    await BillItem.bulkCreate(billItems, { transaction: t });

    // ── 7. Deduct Stock ───────────────────────────────────
    // Uses Sequelize decrement (atomic SQL: stock = stock - N)
    // This runs inside the same transaction — rolls back if anything fails
    for (const { product, qty } of stockUpdates) {
      await product.decrement('stock', { by: qty, transaction: t });
      console.log(
        `[Stock] "${product.name}" (SKU: ${product.sku}) ` +
        `${product.stock} → ${product.stock - qty}  (sold: ${qty})`
      );
    }

    // ── 8. Commit ─────────────────────────────────────────
    await t.commit();

    // ── 9. PDF (non-blocking, outside transaction) ────────
    let pdfUrl = null;
    try {
      const billForPdf = { ...bill.toJSON(), amount_paid: paidNow, amount_due: amountDue };
      const { filename } = await generateInvoicePDF(billForPdf, customer, processedItems);
      pdfUrl = `${process.env.API_BASE_URL}/public/invoices/${filename}`;
    } catch (pdfErr) {
      console.error('[PDF] Generation failed:', pdfErr.message);
    }

    // ── 10. Notifications (non-blocking) ─────────────────
    const invoiceUrl = `${process.env.APP_BASE_URL}/invoice/${bill.public_token}`;
    const message    = buildInvoiceMessage(bill, customer, invoiceUrl, paidNow, amountDue);
    setImmediate(async () => {
      await sendSMS(bill, customer, message);
      await sendWhatsApp(bill, customer, message);
    });

    // ── 11. Build stock summary for response ──────────────
    const stockSummary = stockUpdates.map(({ product, qty }) => ({
      product_name:  product.name,
      sku:           product.sku,
      sold:          qty,
      stock_before:  product.stock,                  // value before decrement
      stock_after:   product.stock - qty,            // value after decrement
    }));

    return sendSuccess(res, 'Checkout successful.', {
      bill_id:        bill.bill_id,
      invoice_url:    invoiceUrl,
      pdf_url:        pdfUrl,
      final_amount:   bill.final_amount,
      amount_paid:    paidNow.toFixed(2),
      amount_due:     amountDue.toFixed(2),
      payment_status: resolvedStatus,
      customer:       { name: customer.name, phone: customer.phone },
      stock_updated:  stockSummary,   // useful for frontend toast
    }, 201);

  } catch (err) {
    await t.rollback();
    next(err);
  }
};

/**
 * GET /api/bills
 */
const listBills = async (req, res, next) => {
  try {
    const bills = await Bill.findAll({
      include: [{ model: Customer, as: 'customer' }],
      order:   [['created_at', 'DESC']],
    });
    return sendSuccess(res, 'Bills fetched.', bills);
  } catch (err) { next(err); }
};

/**
 * GET /api/bills/:id
 */
const getBill = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({
      where:   { bill_id: req.params.id },
      include: [
        { model: Customer, as: 'customer' },
        { model: BillItem, as: 'items' },
      ],
    });
    if (!bill) return sendError(res, 'Bill not found.', null, 404);
    return sendSuccess(res, 'Bill fetched.', bill);
  } catch (err) { next(err); }
};

/**
 * PATCH /api/bills/:id/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { payment_status, additional_payment } = req.body;
    const bill = await Bill.findOne({
      where: { bill_id: req.params.id },
      include: [
        { model: Customer, as: 'customer' },
        { model: BillItem, as: 'items' },
      ],
    });
    if (!bill) return sendError(res, 'Bill not found.', null, 404);

    // Update payment status
    if (additional_payment && parseFloat(additional_payment) > 0) {
      const extraPaid  = parseFloat(additional_payment);
      const newPaid    = parseFloat(bill.amount_paid) + extraPaid;
      const newDue     = Math.max(0, parseFloat(bill.amount_due) - extraPaid);
      bill.amount_paid = newPaid.toFixed(2);
      bill.amount_due  = newDue.toFixed(2);
      if (newDue <= 0) bill.payment_status = 'PAID';
    } else {
      bill.payment_status = payment_status;
      if (payment_status === 'PAID') {
        bill.amount_paid = bill.final_amount;
        bill.amount_due  = '0.00';
      }
    }

    await bill.save();

    // ── Regenerate PDF with updated payment status ───────
    try {
      const billForPdf = bill.toJSON();
      const customer   = bill.customer;
      const items      = bill.items.map((i) => i.toJSON());
      
      await generateInvoicePDF(billForPdf, customer, items);
      console.log(`[PDF] Regenerated for ${bill.bill_id} with status ${bill.payment_status}`);
    } catch (pdfErr) {
      console.error('[PDF] Regeneration failed:', pdfErr.message);
      // Don't fail the entire request if PDF fails
    }

    return sendSuccess(res, 'Bill updated. PDF regenerated.', bill);
  } catch (err) { next(err); }
};

/**
 * GET /api/bills/invoice/:token  (public, no auth)
 */
const getPublicInvoice = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({
      where:   { public_token: req.params.token },
      include: [
        { model: Customer, as: 'customer' },
        { model: BillItem, as: 'items' },
      ],
    });
    if (!bill) return sendError(res, 'Invoice not found.', null, 404);

    const pdfFilename = `invoice_${bill.bill_id}.pdf`;
    const pdfUrl = `${process.env.API_BASE_URL}/public/invoices/${pdfFilename}`;

    return sendSuccess(res, 'Invoice fetched.', {
      bill,
      pdf_url: pdfUrl,
      shop: {
        name:    process.env.SHOP_NAME,
        address: process.env.SHOP_ADDRESS,
        phone:   process.env.SHOP_PHONE,
        email:   process.env.SHOP_EMAIL,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { checkout, listBills, getBill, updateStatus, getPublicInvoice };
