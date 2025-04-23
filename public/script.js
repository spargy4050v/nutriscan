let localStream;
const video = document.querySelector('.camera');
const scanButton = document.getElementById('scanButton');
const barcodeText = document.getElementById('barcode');
const productInfo = document.getElementById('productInfo');
const manualInput = document.createElement('input');
let html5QrScanner;

// Configure manual input styles
manualInput.type = 'text';
manualInput.placeholder = 'Enter barcode manually (8-13 digits)';
manualInput.style.margin = '10px 0';
manualInput.style.padding = '8px';
manualInput.style.width = '100%';
manualInput.style.boxSizing = 'border-box';
manualInput.style.border = '1px solid #ccc';
manualInput.style.borderRadius = '4px';

// Initialize scanner
function initScanner() {
  if (!window.Html5Qrcode) {
    barcodeText.textContent = 'Barcode scanning library not loaded. Use manual input.';
    showManualInput();
    return false;
  }
  return true;
}

async function startCamera() {
  if (!initScanner()) return;

  barcodeText.textContent = 'Initializing camera...';
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    if (videoDevices.length === 0) {
      barcodeText.textContent = 'No camera found. Use manual input.';
      showManualInput();
      return;
    }

    html5QrScanner = new Html5Qrcode('camera');
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    });
    await html5QrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (barcode) => handleScanSuccess(barcode),
      (error) => console.log('Scan error:', error)
    );
    video.style.display = 'block';
    manualInput.style.display = 'none';
    barcodeText.textContent = 'Ready to scan barcode';
  } catch (err) {
    console.error('Camera error:', err);
    barcodeText.textContent = `Camera error: ${err.message}. Use manual input.`;
    showManualInput();
  }
}

function handleScanSuccess(barcodeValue) {
  stopCamera();
  barcodeText.textContent = `Detected: ${barcodeValue}`;
  fetchProductInfo(barcodeValue);
}

async function fetchProductInfo(barcodeValue) {
  scanButton.disabled = true;
  productInfo.innerHTML = '<p>Loading product details...</p>';

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: barcodeValue }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch product data: ${response.status} ${errorText.substring(0, 100)}...`);
    }

    const data = await response.json();
    displayProductInfo(data);
  } catch (err) {
    console.error('Fetch error:', err);
    productInfo.innerHTML = `<p style="color: red;">Error: Failed to fetch product details. Please try again.</p>`;
  } finally {
    scanButton.disabled = false;
  }
}

function displayProductInfo(data) {
  if (data.error || !data.product) {
    productInfo.innerHTML = `<p style="color: red;">${data.error || 'No product data available'}</p>`;
    return;
  }

  productInfo.innerHTML = `
    <h3>${data.product.product_name || 'Unknown Product'}</h3>
    <p><strong>Nutri-Score:</strong> ${data.product.nutrition_grades?.toUpperCase() || 'N/A'}</p>
    <p><strong>Barcode:</strong> ${data.code || 'N/A'}</p>
    <p><strong>Calories:</strong> ${data.product.nutriments?.['energy-kcal_100g'] || 'N/A'} kcal/100g</p>
    <p><strong>Sugars:</strong> ${data.product.nutriments?.sugars_100g || 'N/A'} g/100g</p>
    <p><strong>Fat:</strong> ${data.product.nutriments?.fat_100g || 'N/A'} g/100g</p>
  `;
}

function showManualInput() {
  stopCamera();
  video.style.display = 'none';
  scanButton.textContent = 'Submit Barcode';
  if (!manualInput.parentNode) {
    productInfo.parentNode.insertBefore(manualInput, productInfo);
  }
  manualInput.style.display = 'block';
  barcodeText.textContent = 'Enter a barcode manually';
}

function stopCamera() {
  if (html5QrScanner) {
    html5QrScanner.stop().catch(err => console.error('Stop camera error:', err));
    html5QrScanner = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
}

// Dynamic script loading
if (!window.Html5Qrcode) {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js';
  script.async = true;
  script.onload = () => {
    console.log('html5-qrcode loaded');
    startCamera();
  };
  script.onerror = () => {
    barcodeText.textContent = 'Failed to load barcode scanner library. Use manual input.';
    showManualInput();
  };
  document.head.appendChild(script);
}

scanButton.addEventListener('click', async () => {
  if (manualInput.style.display === 'block') {
    const barcode = manualInput.value.trim();
    if (!/^\d{8,13}$/.test(barcode)) {
      barcodeText.textContent = 'Invalid barcode (8-13 digits required)';
      return;
    }
    handleScanSuccess(barcode);
  } else {
    await startCamera();
  }
});

window.addEventListener('load', () => {
  if (window.Html5Qrcode) startCamera();
});
window.addEventListener('unload', stopCamera);
