import React, { useState } from 'react';
import BarcodeScanner from './components/BarcodeScanner';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import BillSuccess from './components/BillSuccess';
import Toast from './components/Toast';
import { productService, billService } from './services/api';
import config from './config';
import './App.css';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const closeToast = () => setToast(null);

  // Scanner-first approach: immediate feedback via callbacks
  const handleBarcodeScan = async (sku, { onSuccess, onError }) => {
    try {
      const response = await productService.getProductBySKU(sku);
      
      if (!response.success) {
        onError?.(response.message || 'Product not found');
        showToast(response.message || 'Product not found', 'error');
        return;
      }

      const product = response.data;
      const existingIndex = cartItems.findIndex(item => item.productId === product.productId);

      if (existingIndex !== -1) {
        const updated = [...cartItems];
        updated[existingIndex].qty += 1;
        setCartItems(updated);
      } else {
        setCartItems([...cartItems, {
          productId: product.productId,
          name: product.name,
          price: product.price,
          qty: 1
        }]);
      }

      onSuccess?.();
      showToast(`${product.name} added`, 'success');

    } catch (error) {
      onError?.(error.message || 'Failed to fetch product');
      showToast(error.message || 'Failed to fetch product', 'error');
    }
  };

  const handleScanError = (error) => {
    showToast(error, 'error');
  };

  const handleUpdateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const updated = [...cartItems];
    updated[index].qty = newQty;
    setCartItems(updated);
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
    showToast('Item removed', 'info');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Cart is empty', 'warning');
      return;
    }
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = async (totals) => {
    try {
      const response = await billService.createBill({
        items: cartItems,
        discountPercent: totals.discountPercent
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create bill');
      }

      setGeneratedBill(response.data);
      setCartItems([]);
      setShowCheckout(false);
      showToast('Bill created successfully', 'success');

    } catch (error) {
      showToast(error.message || 'Failed to generate bill', 'error');
      throw error;
    }
  };

  const handleNewBill = () => {
    setGeneratedBill(null);
    setCartItems([]);
  };

  if (generatedBill) {
    return (
      <div className="app">
        <BillSuccess bill={generatedBill} onNewBill={handleNewBill} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🏪</span>
            {config.STORE_NAME}
          </h1>
          <p className="app-subtitle">Smart Billing System</p>
        </div>
      </header>

      <main className="app-main">
        <section className="scanner-section">
          <BarcodeScanner onScan={handleBarcodeScan} onError={handleScanError} />
        </section>

        <section className="cart-section">
          <Cart 
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
          />
        </section>
      </main>

      {showCheckout && (
        <Checkout 
          items={cartItems}
          onConfirm={handleCheckoutConfirm}
          onCancel={() => setShowCheckout(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <footer className="app-footer">
        <p>Powered by Smart Billing System v1.0</p>
      </footer>
    </div>
  );
}

export default App;