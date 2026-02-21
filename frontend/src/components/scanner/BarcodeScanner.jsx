import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ID  = 'pos-barcode-scanner';
const DEBOUNCE_MS = 600; // 600ms — fast enough for back-to-back clothing items

const BarcodeScanner = ({ onScan, onError }) => {
  const [scanning,   setScanning]   = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualSku,  setManualSku]  = useState('');
  const [lastScanned, setLastScanned] = useState('');

  const scannerRef     = useRef(null);
  const lastScannedRef = useRef({ code: null, time: 0 });
  const mountedRef     = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; stopScanner(); };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
  };

  const handleScanSuccess = useCallback((decodedText) => {
    const now  = Date.now();
    const last = lastScannedRef.current;
    if (decodedText === last.code && now - last.time < DEBOUNCE_MS) return;
    lastScannedRef.current = { code: decodedText, time: now };
    setLastScanned(decodedText.trim());
    onScan(decodedText.trim());
  }, [onScan]);

  const startScanner = async () => {
    setCameraError(null);
    setInitiating(true);
    await stopScanner();

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) throw new Error('No camera found.');

      // Prefer rear/environment camera (better for barcodes)
      const camera = cameras.find((c) => {
        const l = c.label.toLowerCase();
        return l.includes('back') || l.includes('rear') || l.includes('environment');
      }) || cameras[cameras.length - 1];

      // Show scanner div FIRST, then init (div needs real px dimensions)
      if (mountedRef.current) setScanning(true);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      scannerRef.current = new Html5Qrcode(SCANNER_ID, { verbose: false });

      await scannerRef.current.start(
        camera.id,
        {
          // ── SPEED OPTIMIZATIONS ─────────────────────────
          fps: 30,                           // max frames per second
          qrbox: { width: 320, height: 100 }, // very wide & short = ideal for EAN-13/CODE-128
          aspectRatio: 3.2,                  // wide landscape = clothing barcode shape
          disableFlip: true,                 // no mirror flip = less CPU
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true, // native Chrome BarcodeDetector API (2-3x faster)
          },
          // Only retail barcode formats — skip QR/Aztec/DataMatrix etc.
          formatsToSupport: [
            4,  // CODE_128  ← most common on clothing tags
            5,  // CODE_39
            8,  // EAN_13   ← standard product barcode
            9,  // EAN_8
            13, // UPC_A
            14, // UPC_E
            11, // ITF
          ],
        },
        handleScanSuccess,
        () => {} // silence per-frame decode errors
      );

      if (mountedRef.current) setInitiating(false);
    } catch (err) {
      const msg = err?.message || 'Camera error. Check permissions.';
      setCameraError(msg);
      if (onError) onError(msg);
      if (mountedRef.current) { setScanning(false); setInitiating(false); }
    }
  };

  const handleStop = async () => {
    await stopScanner();
    if (mountedRef.current) { setScanning(false); setLastScanned(''); }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualSku.trim()) { onScan(manualSku.trim()); setManualSku(''); }
  };

  return (
    <div style={styles.wrapper}>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>📷 Barcode Scanner</span>
        <div style={styles.controls}>
          {!scanning && !initiating && (
            <button style={styles.startBtn} onClick={startScanner} type="button">
              ▶ Start Scanning
            </button>
          )}
          {initiating && (
            <button style={styles.initBtn} disabled type="button">
              <span style={styles.miniSpinner} /> Starting…
            </button>
          )}
          {scanning && !initiating && (
            <button style={styles.stopBtn} onClick={handleStop} type="button">
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      {/* ── Scanner div — ALWAYS in DOM, fixed height, visibility toggle ── */}
      <div
        id={SCANNER_ID}
        style={{
          width: '100%',
          height: 240,
          borderRadius: 8,
          overflow: 'visible',
          visibility: scanning ? 'visible' : 'hidden',
          position:   scanning ? 'relative' : 'absolute',
          pointerEvents: scanning ? 'auto' : 'none',
        }}
      />

      {/* Placeholder */}
      {!scanning && !initiating && (
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>🏷️</div>
          <p style={styles.placeholderText}>Click "Start Scanning" to activate camera</p>
          <p style={styles.placeholderSub}>Supports EAN-13, CODE-128, UPC barcodes</p>
        </div>
      )}

      {/* Initiating */}
      {initiating && (
        <div style={styles.initiatingBox}>
          <span style={styles.spinner} />
          <span style={{ color: '#6b7280', fontSize: 13 }}>Requesting camera…</span>
        </div>
      )}

      {/* Active status + last scanned */}
      {scanning && !initiating && (
        <div style={styles.activeBar}>
          <div style={styles.scanningIndicator}>
            <span style={styles.pulseDot} />
            Camera active — point at barcode
          </div>
          {lastScanned && (
            <div style={styles.lastScannedBadge}>
              ✓ {lastScanned}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {cameraError && (
        <div style={styles.error}>
          ⚠️ {cameraError}
          <br /><small>Allow camera access in browser settings.</small>
        </div>
      )}

      {/* Divider */}
      <div style={styles.dividerRow}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerLabel}>or enter barcode manually</span>
        <div style={styles.dividerLine} />
      </div>

      {/* Manual */}
      <form onSubmit={handleManualSubmit} style={styles.manualForm}>
        <input
          type="text"
          value={manualSku}
          onChange={(e) => setManualSku(e.target.value)}
          placeholder="Type barcode / SKU..."
          style={styles.manualInput}
          autoComplete="off"
        />
        <button type="submit" style={styles.addBtn} disabled={!manualSku.trim()}>
          Add
        </button>
      </form>
    </div>
  );
};

const styles = {
  wrapper: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', position: 'relative' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontWeight: 700, fontSize: 15, color: '#1a1a2e' },
  controls: { display: 'flex', gap: 8 },
  startBtn: { background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  stopBtn:  { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  initBtn:  { display: 'flex', alignItems: 'center', gap: 6, background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'not-allowed' },
  miniSpinner: { display: 'inline-block', width: 12, height: 12, border: '2px solid #d1d5db', borderTopColor: '#6b7280', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  placeholder: { height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8, border: '2px dashed #e5e7eb', marginBottom: 4, gap: 4 },
  placeholderIcon: { fontSize: 32 },
  placeholderText: { color: '#6b7280', fontSize: 13, fontWeight: 600 },
  placeholderSub:  { color: '#9ca3af', fontSize: 11 },
  initiatingBox: { height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8, border: '2px dashed #e5e7eb', gap: 12, marginBottom: 4 },
  spinner: { display: 'inline-block', width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#1a1a2e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  activeBar: { marginTop: 4, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 6 },
  scanningIndicator: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 },
  pulseDot: { display: 'inline-block', width: 8, height: 8, background: '#22c55e', borderRadius: '50%', animation: 'pulse 1.4s ease-in-out infinite' },
  lastScannedBadge: { background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, fontFamily: 'monospace' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 8, lineHeight: 1.5 },
  dividerRow: { display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' },
  dividerLine: { flex: 1, height: 1, background: '#e5e7eb' },
  dividerLabel: { fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' },
  manualForm: { display: 'flex', gap: 8 },
  manualInput: { flex: 1, padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  addBtn: { background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

export default BarcodeScanner;
