import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

/* ── JsBarcode is loaded via CDN script tag injected once ── */
const loadJsBarcode = () => {
  if (window.JsBarcode) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
};

const CATEGORIES = ['Shirt', 'T-Shirt', 'Jeans', 'Trousers', 'Kurti', 'Saree', 'Dress', 'Jacket', 'Shorts', 'Other'];
const SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size', '28', '30', '32', '34', '36', '38', '40'];

const EMPTY_FORM = { name: '', price: '', category: '', size: '', color: '', stock: '', sku: '' };

// ── Barcode Modal ─────────────────────────────────────────────
const BarcodeModal = ({ product, onClose }) => {
  const svgRef  = useRef(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product || !svgRef.current) return;
    loadJsBarcode().then(() => {
      try {
        window.JsBarcode(svgRef.current, product.sku, {
          format:      'CODE128',
          width:       2.4,
          height:      80,
          displayValue: true,          // show SKU number below barcode
          fontSize:    16,
          fontOptions: 'bold',
          margin:      12,
          background:  '#ffffff',
          lineColor:   '#000000',
          text:        product.sku,    // SKU number as main text
          textMargin:  8,
        });
        setError('');
      } catch (e) { setError('Barcode generation failed: ' + e.message); }
    }).catch(() => setError('Failed to load barcode library. Check internet connection.'));
  }, [product]);

  const handlePrint = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
    const url     = URL.createObjectURL(svgBlob);

    // Build a print page with N copies of the barcode
    const copies = Array(parseInt(qty) || 1).fill(
      `<img src="${url}" style="width:200px;display:inline-block;margin:6px;border:1px solid #eee;padding:4px;" />`
    ).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>Barcode: ${product.name}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h3 { margin-bottom: 12px; }
          .grid { display: flex; flex-wrap: wrap; gap: 4px; }
          @media print { body { padding: 5px; } h3 { display:none; } }
        </style>
      </head><body>
        <h3>${product.name} — SKU: ${product.sku}</h3>
        <div class="grid">${copies}</div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleDownload = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `barcode_${product.sku}.svg`;
    a.click();
  };

  return (
    <div style={ms.overlay} onClick={onClose}>
      <div style={ms.modal} onClick={(e) => e.stopPropagation()}>
        <div style={ms.header}>
          <div>
            <div style={ms.title}>🏷️ Barcode — {product.name}</div>
            <div style={ms.sub}>SKU: {product.sku}</div>
          </div>
          <button style={ms.close} onClick={onClose}>✕</button>
        </div>

        <div style={ms.barcodeWrap}>
          {error ? (
            <div style={ms.error}>{error}</div>
          ) : (
            <>
              <div style={ms.barcodeLabel}>
                <div style={ms.barcodeProdName}>{product.name}</div>
                <div style={ms.barcodePrice}>₹{parseFloat(product.price).toFixed(2)}</div>
              </div>
              <svg ref={svgRef} style={{ maxWidth: '100%', display: 'block' }} />
            </>
          )}
        </div>

        <div style={ms.details}>
          <div style={ms.detailItem}><span>Product</span><strong>{product.name}</strong></div>
          <div style={ms.detailItem}><span>SKU</span><strong style={{ fontFamily: 'monospace' }}>{product.sku}</strong></div>
          <div style={ms.detailItem}><span>Price</span><strong>₹{parseFloat(product.price).toFixed(2)}</strong></div>
          {product.size  && <div style={ms.detailItem}><span>Size</span><strong>{product.size}</strong></div>}
          {product.color && <div style={ms.detailItem}><span>Color</span><strong>{product.color}</strong></div>}
        </div>

        <div style={ms.printRow}>
          <label style={ms.printLabel}>Print Copies:</label>
          <input
            type="number" min={1} max={100} value={qty}
            onChange={(e) => setQty(e.target.value)}
            style={ms.qtyInput}
          />
          <button style={ms.downloadBtn} onClick={handleDownload}>⬇ Download SVG</button>
          <button style={ms.printBtn}    onClick={handlePrint}>🖨 Print {qty} {qty == 1 ? 'Label' : 'Labels'}</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Products Page ────────────────────────────────────────
const ProductsPage = () => {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [barcodeProd, setBarcodeProd] = useState(null);
  const searchTimer = useRef(null);

  const fetchProducts = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const res = await productAPI.list(q);
      setProducts(res.data.data || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(val), 400);
  };

  const handleFormChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return toast.error('Name and price are required');
    setSaving(true);
    try {
      if (editId) {
        await productAPI.update(editId, form);
        toast.success('Product updated!');
      } else {
        await productAPI.create(form);
        toast.success('Product created! Barcode auto-generated ✓');
      }
      setShowForm(false); setForm(EMPTY_FORM); setEditId(null);
      fetchProducts(search);
    } catch (err) {
      console.error('[ProductsPage] Submit error:', err);
      console.error('[ProductsPage] Response data:', err.response?.data);
      const errMsg = err.response?.data?.message || err.message || 'Save failed';
      toast.error(errMsg, { duration: 5000 });
    } finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, price: p.price, category: p.category || '', size: p.size || '', color: p.color || '', stock: p.stock, sku: p.sku });
    setEditId(p.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await productAPI.delete(p.id);
      toast.success('Product deleted');
      fetchProducts(search);
    } catch { toast.error('Delete failed'); }
  };

  const cancelForm = () => { setShowForm(false); setForm(EMPTY_FORM); setEditId(null); };

  return (
    <div style={s.page}>

      {/* Barcode Modal */}
      {barcodeProd && <BarcodeModal product={barcodeProd} onClose={() => setBarcodeProd(null)} />}

      {/* ── Header ── */}
      <div style={s.topRow}>
        <div>
          <h2 style={s.pageTitle}>🏷️ Products & Barcodes</h2>
          <p style={s.pageSub}>Add products — barcodes are auto-generated for scanning at POS</p>
        </div>
        <button style={s.addBtn} onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
          + Add Product
        </button>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <span style={s.formTitle}>{editId ? '✏️ Edit Product' : '➕ New Product'}</span>
            {!editId && <span style={s.formHint}>💡 Leave "Custom Barcode" blank to auto-generate EAN-13</span>}
          </div>
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Product Name *</label>
                <input name="name" value={form.name} onChange={handleFormChange}
                  placeholder="e.g. Men's Cotton Shirt" style={s.input} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Price (₹) *</label>
                <input name="price" type="number" min="0" step="0.01" value={form.price}
                  onChange={handleFormChange} placeholder="599.00" style={s.input} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <select name="category" value={form.category} onChange={handleFormChange} style={s.input}>
                  <option value="">— Select —</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Size</label>
                <select name="size" value={form.size} onChange={handleFormChange} style={s.input}>
                  <option value="">— Select —</option>
                  {SIZES.map((sz) => <option key={sz}>{sz}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Color</label>
                <input name="color" value={form.color} onChange={handleFormChange}
                  placeholder="e.g. Navy Blue" style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Stock Qty</label>
                <input name="stock" type="number" min="0" value={form.stock}
                  onChange={handleFormChange} placeholder="0" style={s.input} />
              </div>
              {!editId && (
                <div style={{ ...s.field, gridColumn: '1/-1' }}>
                  <label style={s.label}>Custom Barcode / SKU <span style={s.optional}>(leave blank to auto-generate)</span></label>
                  <input name="sku" value={form.sku} onChange={handleFormChange}
                    placeholder="Auto-generated EAN-13 if left blank" style={s.input} />
                </div>
              )}
            </div>
            <div style={s.formActions}>
              <button type="button" onClick={cancelForm} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.saveBtn} disabled={saving}>
                {saving ? 'Saving…' : editId ? '💾 Save Changes' : '✅ Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search ── */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          style={s.searchInput}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, barcode, or category..."
        />
        {search && <button style={s.clearBtn} onClick={() => handleSearch('')}>✕</button>}
      </div>

      {/* ── Products Table ── */}
      <div style={s.tableCard}>
        {loading ? (
          <div style={s.empty}><span style={s.spinner} /> Loading...</div>
        ) : products.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
            <div style={{ fontWeight: 600, color: '#374151' }}>No products yet</div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>Click "+ Add Product" to get started</div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>#</th>
                <th style={s.th}>Product</th>
                <th style={s.th}>Barcode / SKU</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Size</th>
                <th style={s.th}>Price</th>
                <th style={s.th}>Stock</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={s.td}>{i + 1}</td>
                  <td style={s.td}>
                    <div style={s.productName}>{p.name}</div>
                    {p.color && <div style={s.productMeta}>{p.color}</div>}
                  </td>
                  <td style={s.td}>
                    <span style={s.skuBadge}>{p.sku}</span>
                  </td>
                  <td style={s.td}>{p.category || '—'}</td>
                  <td style={s.td}>{p.size || '—'}</td>
                  <td style={s.td}><strong>₹{parseFloat(p.price).toFixed(2)}</strong></td>
                  <td style={s.td}>
                    <span style={{
                      ...s.stockBadge,
                      background: p.stock === 0 ? '#fee2e2' : p.stock <= 3 ? '#fef3c7' : '#d1fae5',
                      color:      p.stock === 0 ? '#991b1b' : p.stock <= 3 ? '#92400e' : '#065f46',
                    }}>
                      {p.stock === 0 ? '❌ Out of Stock' : p.stock <= 3 ? `⚠️ Low: ${p.stock}` : p.stock}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button style={s.barcodeBtn} onClick={() => setBarcodeProd(p)} title="View & Print Barcode">
                        🏷️ Barcode
                      </button>
                      <button style={s.editBtn} onClick={() => handleEdit(p)} title="Edit">✏️</button>
                      <button style={s.deleteBtn} onClick={() => handleDelete(p)} title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────
const s = {
  page:      { display: 'flex', flexDirection: 'column', gap: 16 },
  topRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  pageSub:   { fontSize: 13, color: '#6b7280', marginTop: 4 },
  addBtn:    { background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  formCard:    { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  formHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  formTitle:   { fontSize: 15, fontWeight: 700, color: '#1a1a2e' },
  formHint:    { fontSize: 12, color: '#6b7280', background: '#f0f9ff', padding: '4px 10px', borderRadius: 6 },
  form:        {},
  formGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 },
  field:       { display: 'flex', flexDirection: 'column', gap: 5 },
  label:       { fontSize: 12, fontWeight: 600, color: '#374151' },
  optional:    { fontWeight: 400, color: '#9ca3af' },
  input:       { padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  formActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn:   { padding: '9px 20px', border: '2px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' },
  saveBtn:     { padding: '9px 24px', border: 'none', borderRadius: 8, background: '#1a1a2e', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  searchWrap:  { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '2px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', background: 'transparent' },
  clearBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 },

  tableCard:   { background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: '#f8fafc' },
  th:          { padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' },
  tr:          { borderBottom: '1px solid #f3f4f6' },
  td:          { padding: '12px 14px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  productName: { fontWeight: 600, color: '#1a1a2e' },
  productMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  skuBadge:    { background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontFamily: 'monospace', fontWeight: 600 },
  stockBadge:  { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  actions:     { display: 'flex', gap: 6 },
  barcodeBtn:  { background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  editBtn:     { background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' },
  deleteBtn:   { background: '#fff1f2', color: '#e11d48', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' },
  empty:       { padding: 60, textAlign: 'center', color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  spinner:     { display: 'inline-block', width: 20, height: 20, border: '3px solid #e5e7eb', borderTopColor: '#1a1a2e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 },
};

const ms = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:      { background: '#fff', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:      { fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  sub:        { fontSize: 12, color: '#6b7280', fontFamily: 'monospace', marginTop: 3 },
  close:      { background: '#f3f4f6', border: 'none', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#6b7280' },
  barcodeWrap:{ background: '#f9fafb', borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 16, border: '2px solid #e5e7eb' },
  barcodeLabel: { marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e5e7eb' },
  barcodeProdName: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 },
  barcodePrice: { fontSize: 18, fontWeight: 800, color: '#16a34a' },
  details:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 },
  detailItem: { display: 'flex', flexDirection: 'column', gap: 2, background: '#f8fafc', borderRadius: 6, padding: '8px 12px' },
  printRow:   { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  printLabel: { fontSize: 13, fontWeight: 600, color: '#374151' },
  qtyInput:   { width: 60, padding: '7px 10px', border: '2px solid #e5e7eb', borderRadius: 7, fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none' },
  downloadBtn:{ flex: 1, padding: '9px 12px', background: '#f0f9ff', color: '#0369a1', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  printBtn:   { flex: 1, padding: '9px 12px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  error:      { color: '#dc2626', fontSize: 13, padding: 20 },
};

export default ProductsPage;
