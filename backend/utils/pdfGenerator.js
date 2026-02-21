const PDFDocument = require('pdfkit');
const path = require('path');
const fs   = require('fs');

const ensurePdfDir = () => {
  const dir = path.join(__dirname, '..', 'public', 'invoices');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const generateInvoicePDF = (bill, customer, items) => {
  return new Promise((resolve, reject) => {
    try {
      const dir      = ensurePdfDir();
      const filename = `invoice_${bill.bill_id}.pdf`;
      const filePath = path.join(dir, filename);

      const doc    = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const shopName    = process.env.SHOP_NAME    || 'My Store';
      const shopAddress = process.env.SHOP_ADDRESS || '';
      const shopPhone   = process.env.SHOP_PHONE   || '';
      const shopEmail   = process.env.SHOP_EMAIL   || '';

      const finalAmt = parseFloat(bill.final_amount);
      const paidAmt  = parseFloat(bill.amount_paid  ?? finalAmt);
      const dueAmt   = parseFloat(bill.amount_due   ?? 0);
      const isPending = dueAmt > 0;

      // ── HEADER ──────────────────────────────────────────
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a2e')
        .text(shopName, { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#666')
        .text(shopAddress, { align: 'center' })
        .text(`📞 ${shopPhone}   ✉  ${shopEmail}`, { align: 'center' });

      doc.moveDown(0.4);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a1a2e').lineWidth(2).stroke();
      doc.moveDown(0.5);

      // ── STATUS BANNER for PENDING ────────────────────────
      if (isPending) {
        const bannerY = doc.y;
        doc.rect(50, bannerY, 495, 20).fill('#fff3cd');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#856404')
          .text(`⚠  PARTIAL PAYMENT  —  Balance Due: ₹${dueAmt.toFixed(2)}`,
            55, bannerY + 5, { width: 485, align: 'center' });
        doc.moveDown(1.4);
      }

      // ── INVOICE INFO + CUSTOMER ──────────────────────────
      const infoY = doc.y;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a2e').text('INVOICE', 50, infoY);

      const dateStr = (() => {
        const d = new Date(bill.createdAt || bill.created_at || Date.now());
        return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      })();

      doc.fontSize(9).font('Helvetica').fillColor('#444')
        .text(`Invoice #: ${bill.bill_id}`,     50, infoY + 18)
        .text(`Date: ${dateStr}`,                50, infoY + 31)
        .text(`Status: ${bill.payment_status}`,  50, infoY + 44);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a2e').text('Bill To:', 350, infoY);
      doc.fontSize(9).font('Helvetica').fillColor('#444')
        .text(customer.name,           350, infoY + 18)
        .text(`📞 ${customer.phone}`,  350, infoY + 31);

      doc.moveDown(3.8);

      // ── ITEMS TABLE ─────────────────────────────────────
      const tableTop = doc.y + 8;
      const col = { no: 50, name: 80, size: 300, qty: 365, price: 420, total: 490 };

      doc.rect(50, tableTop - 5, 495, 22).fill('#1a1a2e');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff')
        .text('#',       col.no,    tableTop)
        .text('Product', col.name,  tableTop, { width: 210 })
        .text('Size',    col.size,  tableTop)
        .text('Qty',     col.qty,   tableTop)
        .text('Price',   col.price, tableTop)
        .text('Total',   col.total, tableTop);

      let rowY = tableTop + 22;
      items.forEach((item, i) => {
        doc.rect(50, rowY - 3, 495, 19).fill(i % 2 === 0 ? '#f8f9fa' : '#fff');
        const lineTotal = parseFloat(item.price) * parseInt(item.quantity);
        doc.fontSize(9).font('Helvetica').fillColor('#222')
          .text(i + 1,                             col.no,    rowY)
          .text(item.product_name,                 col.name,  rowY, { width: 210 })
          .text(item.size  || item.color || '—',   col.size,  rowY)
          .text(item.quantity,                     col.qty,   rowY)
          .text(`₹${parseFloat(item.price).toFixed(2)}`, col.price, rowY)
          .text(`₹${lineTotal.toFixed(2)}`,        col.total, rowY);
        rowY += 20;
      });

      doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor('#ddd').lineWidth(1).stroke();
      rowY += 14;

      // ── TOTALS BLOCK ─────────────────────────────────────
      const tX     = 360;
      const valOpts = { width: 75, align: 'right' };

      const row = (label, value, opts = {}) => {
        doc.fontSize(opts.big ? 11 : 10)
          .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(opts.color || '#444')
          .text(label, tX, rowY)
          .text(value, 470, rowY, valOpts);
        rowY += opts.big ? 22 : 17;
      };

      row('Subtotal:', `₹${parseFloat(bill.subtotal).toFixed(2)}`);

      if (parseFloat(bill.discount_amount) > 0) {
        row(`Discount (${bill.discount_percent}%):`, `-₹${parseFloat(bill.discount_amount).toFixed(2)}`,
          { color: '#16a34a' });
      }

      // Grand total (dark bg)
      doc.rect(350, rowY - 2, 195, 22).fill('#1a1a2e');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#fff')
        .text('TOTAL:', tX, rowY)
        .text(`₹${finalAmt.toFixed(2)}`, 470, rowY, valOpts);
      rowY += 26;

      // Paid now
      doc.rect(350, rowY - 2, 195, 20).fill('#d1fae5');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#065f46')
        .text('Paid Now:', tX, rowY)
        .text(`₹${paidAmt.toFixed(2)}`, 470, rowY, valOpts);
      rowY += 24;

      // Balance due (only if pending)
      if (isPending) {
        doc.rect(350, rowY - 2, 195, 22).fill('#fee2e2');
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#991b1b')
          .text('BALANCE DUE:', tX, rowY)
          .text(`₹${dueAmt.toFixed(2)}`, 470, rowY, valOpts);
        rowY += 26;

        if (bill.due_date) {
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#dc2626')
            .text(`Payment Due Date: ${bill.due_date}`, 350, rowY);
          rowY += 18;
        }
      }

      rowY += 10;

      // ── STATUS BADGE ────────────────────────────────────
      const badgeColor = isPending ? '#dc2626' : '#16a34a';
      const badgeText  = isPending
        ? `PENDING  —  Balance ₹${dueAmt.toFixed(2)}`
        : 'PAID IN FULL ✓';
      doc.rect(50, rowY, 220, 24).fill(badgeColor);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff')
        .text(badgeText, 56, rowY + 7);

      // ── FOOTER ──────────────────────────────────────────
      doc.fontSize(8).font('Helvetica').fillColor('#aaa')
        .text('Thank you for shopping with us!', 50, 760, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', () => resolve({ filePath, filename }));
      stream.on('error', reject);
    } catch (err) { reject(err); }
  });
};

module.exports = { generateInvoicePDF };
