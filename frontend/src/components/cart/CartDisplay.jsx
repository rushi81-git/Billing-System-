import React from 'react';
import { useCart } from '../../context/CartContext';

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => (
  <div style={styles.cartItem}>
    <div style={styles.itemInfo}>
      <div style={styles.itemName}>{item.product_name}</div>
      {item.sku && (
        <div style={styles.itemSku}>SKU: {item.sku}</div>
      )}
    </div>
    <div style={styles.itemControls}>
      <button style={styles.qtyBtn} onClick={onDecrease}>−</button>
      <span style={styles.qty}>{item.quantity}</span>
      <button style={styles.qtyBtn} onClick={onIncrease}>+</button>
    </div>
    <div style={styles.itemPrice}>
      ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
    </div>
    <button style={styles.removeBtn} onClick={onRemove} title="Remove">✕</button>
  </div>
);

const CartDisplay = ({ discountPercent, setDiscountPercent }) => {
  const { items, subtotal, itemCount, increaseQty, decreaseQty, removeItem, clearCart } =
    useCart();

  const discountAmt = (subtotal * (parseFloat(discountPercent) || 0)) / 100;
  const finalAmount = subtotal - discountAmt;

  if (items.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>🛒</div>
        <p style={styles.emptyText}>Cart is empty</p>
        <p style={styles.emptySubtext}>Scan a barcode to add products</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>
          Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
        <button style={styles.clearBtn} onClick={clearCart}>
          🗑 Clear All
        </button>
      </div>

      {/* Items */}
      <div style={styles.itemsList}>
        {items.map((item) => (
          <CartItem
            key={item.sku || item.product_name}
            item={item}
            onIncrease={() => increaseQty(item.sku || item.product_name)}
            onDecrease={() => decreaseQty(item.sku || item.product_name)}
            onRemove={() => removeItem(item.sku || item.product_name)}
          />
        ))}
      </div>

      {/* Totals */}
      <div style={styles.totals}>
        <div style={styles.totalRow}>
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        <div style={styles.discountRow}>
          <label style={styles.discountLabel}>Discount %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            style={styles.discountInput}
            placeholder="0"
          />
        </div>

        {discountAmt > 0 && (
          <div style={{ ...styles.totalRow, color: '#22c55e' }}>
            <span>Discount ({discountPercent}%)</span>
            <span>−₹{discountAmt.toFixed(2)}</span>
          </div>
        )}

        <div style={styles.divider} />
        <div style={styles.finalRow}>
          <span>Total</span>
          <span>₹{finalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', height: '100%' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0 12px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: 8,
  },
  headerTitle: { fontWeight: 700, fontSize: 15, color: '#1a1a2e' },
  clearBtn: {
    background: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  itemsList: { flex: 1, overflowY: 'auto', paddingRight: 4 },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1f2937',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemSku: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  itemControls: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 26,
    height: 26,
    background: '#f0f2f5',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: 'center' },
  itemPrice: { fontSize: 13, fontWeight: 700, color: '#1a1a2e', minWidth: 70, textAlign: 'right' },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: 12,
    padding: '4px 6px',
    borderRadius: 4,
  },
  totals: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '2px solid #e5e7eb',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    padding: '4px 0',
    color: '#374151',
  },
  discountRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
    gap: 8,
  },
  discountLabel: { fontSize: 13, color: '#6b7280' },
  discountInput: {
    width: 70,
    padding: '4px 8px',
    border: '2px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
    textAlign: 'right',
    outline: 'none',
    fontFamily: 'inherit',
  },
  divider: { height: 1, background: '#e5e7eb', margin: '8px 0' },
  finalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontWeight: 700, fontSize: 15, color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9ca3af' },
};

export default CartDisplay;
