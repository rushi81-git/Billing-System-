const express = require('express');
const { sendSMS, sendWhatsApp, buildInvoiceMessage } = require('../services/notificationService');
const { authMiddleware } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();
router.use(authMiddleware);

/**
 * POST /api/test/whatsapp
 * Body: { phone, name }
 * Tests WhatsApp send and returns real response/error
 */
router.post('/whatsapp', async (req, res, next) => {
  try {
    const { phone, name } = req.body;
    if (!phone) return sendError(res, 'phone is required');

    // Fake bill & customer for test
    const fakeBill = {
      id: 0,
      bill_id: 'TEST-BILL-001',
      final_amount: 99.00,
      payment_status: 'PAID',
    };
    const fakeCustomer = { name: name || 'Test Customer', phone };
    const fakeUrl = `${process.env.APP_BASE_URL}/invoice/test-token`;

    const message = buildInvoiceMessage(fakeBill, fakeCustomer, fakeUrl);
    console.log('\n[TEST] Triggering WhatsApp send...');
    console.log('[TEST] To:', phone, '| Message:', message);

    await sendWhatsApp(fakeBill, fakeCustomer, message);

    return sendSuccess(res, 'Test triggered. Check backend terminal for result.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/test/sms
 * Body: { phone, name }
 */
router.post('/sms', async (req, res, next) => {
  try {
    const { phone, name } = req.body;
    if (!phone) return sendError(res, 'phone is required');

    const fakeBill = { id: 0, bill_id: 'TEST-BILL-001', final_amount: 99.00, payment_status: 'PAID' };
    const fakeCustomer = { name: name || 'Test Customer', phone };

    const message = `Test SMS from ${process.env.SHOP_NAME || 'Smart POS'}. Bill: TEST-BILL-001. Amount: Rs.99.00`;
    console.log('\n[TEST] Triggering SMS send...');

    await sendSMS(fakeBill, fakeCustomer, message);

    return sendSuccess(res, 'Test triggered. Check backend terminal for result.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
