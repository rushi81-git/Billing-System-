import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from 'quagga';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle');
  const scannerRef = useRef(null);
  const lastDetectionRef = useRef({ code: null, timestamp: 0 });
  const statusTimeoutRef = useRef(null);
  const quaggaInitialized = useRef(false);
  
  const SCAN_COOLDOWN = 2000;
  const STATUS_DISPLAY_TIME = 2000;

  const resetStatus = useCallback(() => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    statusTimeoutRef.current = setTimeout(() => {
      setScanStatus('idle');
    }, STATUS_DISPLAY_TIME);
  }, []);

  const handleDetected = useCallback((result) => {
    if (!result || !result.codeResult || !result.codeResult.code) return;

    const code = String(result.codeResult.code).trim().toUpperCase();
    const now = Date.now();
    const last = lastDetectionRef.current;

    if (code === last.code && (now - last.timestamp) < SCAN_COOLDOWN) {
      return;
    }

    console.log('Barcode detected:', code);
    lastDetectionRef.current = { code, timestamp: now };
    setScanStatus('scanning');

    if (onScan) {
      onScan(code, {
        onSuccess: () => {
          setScanStatus('success');
          resetStatus();
        },
        onError: (error) => {
          setScanStatus('error');
          resetStatus();
          if (onError) onError(error);
        }
      });
    }
  }, [onScan, onError, resetStatus]);

  const startScanner = useCallback(() => {
    if (!scannerRef.current) {
      console.error('Scanner viewport not ready');
      return;
    }

    const config = {
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: scannerRef.current,
        constraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: 'environment',
          aspectRatio: { ideal: 16/9 }
        }
      },
      decoder: {
        readers: [
          'code_128_reader',
          'ean_reader',
          'ean_8_reader',
          'code_39_reader',
          'upc_reader',
          'upc_e_reader'
        ],
        debug: {
          showCanvas: true,
          showPatches: true,
          showFoundPatches: true,
          showSkeleton: true,
          showLabels: true,
          showPatchLabels: true,
          showRemainingPatchLabels: true,
          boxFromPatches: {
            showTransformed: true,
            showTransformedBox: true,
            showBB: true
          }
        }
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: 4,
      frequency: 10,
      locate: true
    };

    Quagga.init(config, (err) => {
      if (err) {
        console.error('Quagga initialization error:', err);
        if (onError) onError('Failed to initialize camera: ' + err.message);
        setIsScanning(false);
        return;
      }

      console.log('Quagga initialized successfully');
      Quagga.start();
      quaggaInitialized.current = true;
      setIsScanning(true);
    });

    Quagga.onDetected(handleDetected);
  }, [handleDetected, onError]);

  const stopScanner = useCallback(() => {
    if (quaggaInitialized.current) {
      Quagga.stop();
      Quagga.offDetected(handleDetected);
      quaggaInitialized.current = false;
      console.log('Quagga stopped');
    }
    setIsScanning(false);
    setScanStatus('idle');
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
  }, [handleDetected]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleToggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  return (
    <div className="barcode-scanner">
      <div className="scanner-header">
        <h3>Barcode Scanner</h3>
        <div className={`scan-status scan-status-${scanStatus}`}>
          {scanStatus === 'success' && '✓ Scanned'}
          {scanStatus === 'error' && '✗ Failed'}
          {scanStatus === 'scanning' && '⟳ Processing...'}
          {scanStatus === 'idle' && isScanning && '👁 Watching...'}
        </div>
      </div>

      <div className={`scanner-viewport ${scanStatus}`} ref={scannerRef}>
        {!isScanning && (
          <div className="scanner-overlay">
            <p>Click Start to begin scanning</p>
          </div>
        )}
      </div>

      <button 
        onClick={handleToggleScanner} 
        className={`btn btn-large ${isScanning ? 'btn-secondary' : 'btn-primary'}`}
      >
        {isScanning ? '⏸ Stop Scanner' : '📷 Start Scanner'}
      </button>

      <div className="scanner-instructions">
        <p>💡 Hold barcode 6-8 inches from camera</p>
        <p>🔆 Ensure good lighting</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;