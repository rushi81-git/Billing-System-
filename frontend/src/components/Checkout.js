import React, { useState } from 'react';
import config from '../config';
import './Checkout.css';

/**
 * Checkout Component
 * Allows user to manually enter discount percentage
 * CRITICAL: Discount is entered HERE, not in barcode
 */
const Checkout = ({ items, onConfirm, onCancel }) => {
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  /**
   * Calculate totals with discount
   */
  const calculateTotals = () => {
    const subtotal = items.reduce((total, item) => 
      total + (item.price * item.qty), 0
    );
    
    const discount = parseFloat(discountPercent) || 0;
    const discountAmount = (subtotal * discount) / 100;
    const finalAmount = subtotal - discountAmount;

    return {
      subtotal,
      discountPercent: discount,
      discountAmount,
      finalAmount
    };
  };

  /**
   * Validate discount input
   */
  const validateDiscount = (value) => {
    const discount = parseFloat(value);
    
    if (isNaN(discount)) {
      return 'Please enter a valid number';
    }
    
    if (discount < 0) {
      return 'Discount cannot be negative';
    }
    
    if (discount > config.MAX_DISCOUNT_PERCENT) {
      return `Discount cannot exceed ${config.MAX_DISCOUNT_PERCENT}%`;
    }
    
    return '';
  };

  /**
   * Handle discount input change
   */
  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setDiscountPercent(value);
    
    // Validate on change
    const validationError = validateDiscount(value);
    setError(validationError);
  };

  /**
   * Handle checkout confirmation
   */
  const handleConfirm = async () => {
    // Final validation
    const validationError = validateDiscount(discountPercent);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    
    try {
      const totals = calculateTotals();
      await onConfirm(totals);
    } catch (err) {
      setError(err.message || 'Failed to process checkout');
      setIsProcessing(false);
    }
  };

  const totals = calculateTotals();
  const formatCurrency = (amount) => `${config.CURRENCY_SYMBOL}${amount.toFixed(2)}`;

  return (
    <div className="checkout">
      <div className="checkout-header">
        <h2>Checkout</h2>
        <button onClick={onCancel} className="close-btn" disabled={isProcessing}>
          ✕
        </button>
      </div>

      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          
          <div className="summary-items">
            {items.map((item, index) => (
              <div key={index} className="summary-item">
                <div className="summary-item-info">
                  <span className="summary-item-name">{item.name}</span>
                  <span className="summary-item-qty">× {item.qty}</span>
                </div>
                <span className="summary-item-price">
                  {formatCurrency(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row subtotal-row">
            <span>Subtotal:</span>
            <span className="amount">{formatCurrency(totals.subtotal)}</span>
          </div>
        </div>

        {/* Discount Input Section */}
        <div className="discount-section">
          <h3>Apply Discount</h3>
          
          <div className="discount-input-group">
            <label htmlFor="discount">Discount Percentage</label>
            <div className="input-with-unit">
              <input
                id="discount"
                type="number"
                min="0"
                max={config.MAX_DISCOUNT_PERCENT}
                step="0.01"
                value={discountPercent}
                onChange={handleDiscountChange}
                className={error ? 'input-error' : ''}
                placeholder="0.00"
                disabled={isProcessing}
              />
              <span className="unit">%</span>
            </div>
            
            <p className="discount-limit">
              Maximum discount: {config.MAX_DISCOUNT_PERCENT}%
            </p>
            
            {error && (
              <p className="error-message">⚠️ {error}</p>
            )}
          </div>

          {/* Quick Discount Buttons */}
          <div className="quick-discount">
            <p className="quick-discount-label">Quick apply:</p>
            <div className="quick-discount-buttons">
              {[0, 5, 10, 15, 20].map(percent => (
                <button
                  key={percent}
                  onClick={() => {
                    setDiscountPercent(percent.toString());
                    setError('');
                  }}
                  className="quick-discount-btn"
                  disabled={isProcessing}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Final Amount Display */}
        <div className="final-summary">
          {totals.discountPercent > 0 && (
            <div className="summary-row discount-row">
              <span>Discount ({totals.discountPercent}%):</span>
              <span className="amount discount-amount">
                − {formatCurrency(totals.discountAmount)}
              </span>
            </div>
          )}

          <div className="summary-divider final-divider"></div>

          <div className="summary-row final-row">
            <span>Total Amount:</span>
            <span className="amount final-amount">
              {formatCurrency(totals.finalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="checkout-actions">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary btn-large"
            disabled={isProcessing || !!error}
          >
            {isProcessing ? 'Processing...' : 'Confirm & Generate Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
