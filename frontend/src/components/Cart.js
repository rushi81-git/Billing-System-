import React from 'react';
import config from '../config';
import './Cart.css';

/**
 * Cart Component
 * Displays items added to cart with quantities and prices
 * Shows subtotal (discount is NOT applied here - only at checkout)
 */
const Cart = ({ items, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  /**
   * Calculate subtotal (before discount)
   */
  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return `${config.CURRENCY_SYMBOL}${amount.toFixed(2)}`;
  };

  if (items.length === 0) {
    return (
      <div className="cart cart-empty">
        <div className="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Scan a barcode to add items</p>
      </div>
    );
  }

  const subtotal = calculateSubtotal();

  return (
    <div className="cart">
      <div className="cart-header">
        <h3>Cart ({items.length} {items.length === 1 ? 'item' : 'items'})</h3>
      </div>

      <div className="cart-items">
        {items.map((item, index) => (
          <div key={index} className="cart-item">
            <div className="cart-item-info">
              <h4 className="cart-item-name">{item.name}</h4>
              <p className="cart-item-sku">SKU: {item.productId}</p>
              <p className="cart-item-price">{formatCurrency(item.price)} each</p>
            </div>

            <div className="cart-item-controls">
              <div className="quantity-control">
                <button 
                  onClick={() => onUpdateQuantity(index, item.qty - 1)}
                  className="qty-btn"
                  disabled={item.qty <= 1}
                >
                  −
                </button>
                <span className="qty-display">{item.qty}</span>
                <button 
                  onClick={() => onUpdateQuantity(index, item.qty + 1)}
                  className="qty-btn"
                >
                  +
                </button>
              </div>

              <div className="cart-item-total">
                {formatCurrency(item.price * item.qty)}
              </div>

              <button 
                onClick={() => onRemoveItem(index)}
                className="remove-btn"
                title="Remove item"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-subtotal">
          <span className="subtotal-label">Subtotal:</span>
          <span className="subtotal-amount">{formatCurrency(subtotal)}</span>
        </div>

        <p className="discount-note">
          💡 Discount will be applied at checkout
        </p>

        <button 
          onClick={onCheckout}
          className="btn btn-primary btn-large btn-checkout"
        >
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
};

export default Cart;
