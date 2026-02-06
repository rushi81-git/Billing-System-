import React, { useState } from 'react';
import { pdfService } from '../services/api';
import config from '../config';
import './BillSuccess.css';

/**
 * Bill Success Component
 * Displays bill details and provides PDF download
 */
const BillSuccess = ({ bill, onNewBill }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return `${config.CURRENCY_SYMBOL}${amount.toFixed(2)}`;
  };

  /**
   * Format date and time
   */
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  /**
   * Handle PDF download
   */
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      setError('');
      await pdfService.downloadPDF(bill.billId);
    } catch (err) {
      console.error('PDF download error:', err);
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const { date, time } = formatDateTime(bill.createdAt);

  return (
    <div className="bill-success">
      <div className="success-animation">
        <div className="checkmark-circle">
          <div className="checkmark"></div>
        </div>
      </div>

      <h2 className="success-title">Bill Generated Successfully!</h2>
      <p className="success-subtitle">Your transaction has been completed</p>

      <div className="bill-details-card">
        <div className="bill-id-section">
          <span className="bill-id-label">Bill ID</span>
          <span className="bill-id-value">{bill.billId}</span>
        </div>

        <div className="bill-meta">
          <div className="meta-item">
            <span className="meta-label">Date</span>
            <span className="meta-value">{date}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Time</span>
            <span className="meta-value">{time}</span>
          </div>
        </div>

        <div className="bill-divider"></div>

        <div className="bill-items-section">
          <h4>Items ({bill.items.length})</h4>
          <div className="bill-items-list">
            {bill.items.map((item, index) => (
              <div key={index} className="bill-item">
                <div className="bill-item-info">
                  <span className="bill-item-name">{item.name}</span>
                  <span className="bill-item-qty">× {item.qty}</span>
                </div>
                <span className="bill-item-price">
                  {formatCurrency(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bill-divider"></div>

        <div className="bill-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(bill.subtotal)}</span>
          </div>

          {bill.discountPercent > 0 && (
            <div className="summary-row discount">
              <span>Discount ({bill.discountPercent}%):</span>
              <span className="discount-amount">
                − {formatCurrency(bill.discountAmount)}
              </span>
            </div>
          )}

          <div className="bill-divider final-divider"></div>

          <div className="summary-row total">
            <span>Total Paid:</span>
            <span className="total-amount">
              {formatCurrency(bill.finalAmount)}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="action-buttons">
        <button
          onClick={handleDownloadPDF}
          className="btn btn-primary btn-large btn-download"
          disabled={downloading}
        >
          {downloading ? (
            <>
              <span className="btn-spinner"></span>
              Downloading...
            </>
          ) : (
            <>
              📄 Download PDF Bill
            </>
          )}
        </button>

        <button
          onClick={onNewBill}
          className="btn btn-secondary btn-large"
        >
          ➕ Create New Bill
        </button>
      </div>

      <div className="success-footer">
        <p>Thank you for your business! 🎉</p>
      </div>
    </div>
  );
};

export default BillSuccess;
