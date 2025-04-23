let localStream;
const video = document.querySelector('.camera');
const scanButton = document.getElementById('scanButton');
const barcodeText = document.getElementById('barcode');
const productInfo = document.getElementById('productInfo');

async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    video.srcObject = localStream;
  } catch (err) {
    console.error('Camera error:', err);
    barcodeText.textContent = 'Error accessing camera: ' + err.message;
  }
}

async function scanBarcode() {
  if (!window.BarcodeDetector) {
    barcodeText.textContent = 'Barcode Detection API not supported in this browser.';
    return;
  }

  const barcodeDetector = new BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
  });

  try {
    const barcodes = await barcodeDetector.detect(video);
    if (barcodes.length === 0) {
      barcodeText.textContent = 'No barcode detected. Try again.';
      return;
    }

    const barcodeValue = barcodes[0].rawValue;
    barcodeText.textContent = `Detected Barcode: ${barcodeValue}`;
    scanButton.disabled = true;

    // Send barcode to backend
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: barcodeValue }),
    });

    const data = await response.json();
    if (data.error) {
      productInfo.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
    } else {
      const product = data.product;
      productInfo.innerHTML = `
        <h3>${product.product_name || 'Unknown Product'}</h3>
        <p><strong>Nutri-Score:</strong> ${product.nutrition_grades?.toUpperCase() || 'N/A'}</p>
        <p><strong>Calories:</strong> ${product.nutriments?.['energy-kcal_100g'] || 'N/A'} kcal/100g</p>
        <p><strong>Sugars:</strong> ${product.nutriments?.sugars_100g || 'N/A'} g/100g</p>
        <p><strong>Fat:</strong> ${product.nutriments?.fat_100g || 'N/A'} g/100g</p>
      `;
    }
  } catch (err) {
    console.error('Scan error:', err);
    productInfo.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  } finally {
    scanButton.disabled = false;
  }
}

function stopCamera() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
}

scanButton.addEventListener('click', scanBarcode);
window.addEventListener('load', startCamera);
window.addEventListener('unload', stopCamera);
