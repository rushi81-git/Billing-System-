const cron = require('node-cron');
const { Op } = require('sequelize');
const { Bill, Customer } = require('../models');
const {
  sendSMS,
  sendWhatsApp,
  buildReminderMessage,
  logNotification,
} = require('../services/notificationService');

let cronJob = null;

const startPaymentReminderCron = () => {
  // Run every day at 9:00 AM
  cronJob = cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running payment reminder job...');

    try {
      const today = new Date().toISOString().slice(0, 10);

      const overdueBills = await Bill.findAll({
        where: {
          payment_status: 'PENDING',
          due_date: { [Op.lt]: today },
        },
        include: [{ model: Customer, as: 'customer' }],
      });

      if (overdueBills.length === 0) {
        console.log('[CRON] No overdue pending bills found.');
        return;
      }

      console.log(`[CRON] Found ${overdueBills.length} overdue bills. Sending reminders...`);

      for (const bill of overdueBills) {
        const customer = bill.customer;
        if (!customer) continue;

        const message = buildReminderMessage(bill, customer);

        // Send SMS reminder
        await sendSMS(bill, customer, message);

        // Send WhatsApp reminder
        await sendWhatsApp(bill, customer, message);

        // Log REMINDER type
        await logNotification(bill.id, 'REMINDER', 'SENT', message);

        console.log(`[CRON] Reminder sent for Bill ${bill.bill_id} → ${customer.name}`);
      }
    } catch (err) {
      console.error('[CRON] Error in payment reminder job:', err.message);
    }
  });

  console.log('✅ Payment reminder cron scheduled (daily at 9:00 AM)');
};

const stopPaymentReminderCron = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('[CRON] Payment reminder cron stopped.');
  }
};

module.exports = { startPaymentReminderCron, stopPaymentReminderCron };
