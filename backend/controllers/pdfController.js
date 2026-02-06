const PDFDocument = require('pdfkit');
const Bill = require('../models/Bill');

/**
 * GET /api/pdf/:billId
 */
exports.generatePDF = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await Bill.findOne({ billId: billId.toUpperCase() });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${billId}.pdf"`
    );

    doc.pipe(res);

    generateInvoicePDF(doc, bill);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'PDF error' });
  }
};

function generateInvoicePDF(doc, bill) {
  const storeName = 'Maalak Collection';
  const storeAddress = 'Ashta ,Sangli ,Maharashtra ,416301';
  const storePhone = '+91 8857869999';
  const storeEmail = 'contact@maalakcollection.com';

  const formatCurrency = (amt) => `Rs ${amt.toFixed(2)}`;

  /* ================= HEADER ================= */

  let y = 50;

  doc.font('Helvetica-Bold').fontSize(22);
  doc.text(storeName, 50, y, { align: 'center' });

  y += 28;

  doc.font('Helvetica').fontSize(10);
  doc.text(storeAddress, 50, y, { align: 'center' });
  y += 14;
  doc.text(`Phone: ${storePhone} | Email: ${storeEmail}`, 50, y, {
    align: 'center'
  });

  y += 20;
  doc.moveTo(50, y).lineTo(545, y).stroke();

  /* ================= TITLE ================= */

  y += 20;
  doc.font('Helvetica-Bold').fontSize(16);
  doc.text('INVOICE', 50, y);

  /* ================= META DATA (NO GAPS) ================= */

  y += 25;
  doc.fontSize(10);

  doc.font('Helvetica-Bold').text('Bill ID:', 50, y, { lineBreak: false });
  doc.font('Helvetica').text(bill.billId, 120, y);

  y += 15;
  doc.font('Helvetica-Bold').text('Date:', 50, y, { lineBreak: false });
  doc.font('Helvetica').text(formatDate(bill.createdAt), 120, y);

  y += 15;
  doc.font('Helvetica-Bold').text('Time:', 50, y, { lineBreak: false });
  doc.font('Helvetica').text(formatTime(bill.createdAt), 120, y);

  /* ================= TABLE ================= */

  y += 30;

  const col = {
    item: 50,
    qty: 320,
    price: 390,
    total: 470
  };

  const colWidth = {
    item: 260,
    qty: 40,
    price: 70,
    total: 75
  };

  // Header background
  doc.rect(50, y - 5, 495, 22).fill('#f0f0f0');
  doc.fillColor('#000000');

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Item', col.item, y, { width: colWidth.item, lineBreak: false });
  doc.text('Qty', col.qty, y, {
    width: colWidth.qty,
    align: 'right',
    lineBreak: false
  });
  doc.text('Price', col.price, y, {
    width: colWidth.price,
    align: 'right',
    lineBreak: false
  });
  doc.text('Total', col.total, y, {
    width: colWidth.total,
    align: 'right',
    lineBreak: false
  });

  y += 25;

  /* ================= ITEMS ================= */

  doc.font('Helvetica').fontSize(10);

  bill.items.forEach((item, i) => {
    const itemTotal = item.price * item.qty;

    if (i % 2 === 0) {
      doc.rect(50, y - 4, 495, 22).fill('#fafafa');
      doc.fillColor('#000000');
    }

    doc.text(item.name, col.item, y, {
      width: colWidth.item,
      lineBreak: false
    });

    doc.text(item.qty.toString(), col.qty, y, {
      width: colWidth.qty,
      align: 'right',
      lineBreak: false
    });

    doc.text(formatCurrency(item.price), col.price, y, {
      width: colWidth.price,
      align: 'right',
      lineBreak: false
    });

    doc.text(formatCurrency(itemTotal), col.total, y, {
      width: colWidth.total,
      align: 'right',
      lineBreak: false
    });

    y += 22;
  });

  /* ================= TOTALS ================= */

  y += 10;
  doc.moveTo(300, y).lineTo(545, y).stroke();

  y += 10;
  doc.font('Helvetica');
  doc.text('Subtotal:', 350, y);
  doc.text(formatCurrency(bill.subtotal), col.total, y, {
    width: colWidth.total,
    align: 'right'
  });

  y += 18;
  if (bill.discountPercent > 0) {
    doc.font('Helvetica-Bold').fillColor('#d32f2f');
    doc.text(`Discount (${bill.discountPercent}%):`, 350, y);
    doc.text(`- ${formatCurrency(bill.discountAmount)}`, col.total, y, {
      width: colWidth.total,
      align: 'right'
    });
    doc.fillColor('#000000');
    y += 18;
  }

  doc.moveTo(300, y).lineTo(545, y).lineWidth(2).stroke();

  y += 12;
  doc.font('Helvetica-Bold').fontSize(14);
  doc.text('Total Amount:', 350, y);
  doc.text(formatCurrency(bill.finalAmount), col.total, y, {
    width: colWidth.total,
    align: 'right'
  });

  /* ================= FOOTER ================= */

  const footerY = 750;
  doc.moveTo(50, footerY - 10).lineTo(545, footerY - 10).stroke();

  doc.font('Helvetica')
    .fontSize(9)
    .fillColor('#666666')
    .text('Thank you for shopping with us!', 50, footerY, {
      align: 'center'
    });
}

/* ================= HELPERS ================= */

function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatTime(date) {
  const d = new Date(date);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

module.exports = exports;