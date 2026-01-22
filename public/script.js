// Sanitization using DOMPurify
function sanitize(str) {
  return DOMPurify.sanitize(str);
}

// Calculate nutrient scores based on FSSAI limits
function calculateNutrientScores(nutriments) {
  const scores = {};
  const totalKcal = nutriments['energy-kcal_100g'] || 0;
  const isZeroCalorie = totalKcal === 0; // Flag for zero-calorie products like water

  // Sugars (% energy)
  const sugarsG = nutriments.sugars_100g;
  const sugarsNAFlag = sugarsG === undefined || sugarsG === null;
  const sugarsValue = sugarsNAFlag ? 0 : sugarsG;
  const sugarsKcal = sugarsValue * 4; // 1g sugar = 4 kcal
  const sugarsPercentEnergy = totalKcal > 0 ? (sugarsKcal / totalKcal) * 100 : 0;
  if (sugarsNAFlag) {
    scores.sugars = 0; // Score 0 for N/A
  } else if (sugarsPercentEnergy <= 5) {
    scores.sugars = 25;
  } else if (sugarsPercentEnergy <= 20) {
    scores.sugars = 25 - (sugarsPercentEnergy - 5) * (25 / 15); // Linear decrease to 0 at 20%
  } else {
    scores.sugars = 0; // Beyond 20%, min score
  }
  scores.sugars = Math.min(Math.max(scores.sugars, 0), 25).toFixed(1);
  scores.sugarsPercentEnergy = sugarsNAFlag ? 'N/A' : sugarsPercentEnergy.toFixed(1);

  // Saturated Fat (% energy)
  const satFatG = nutriments['saturated-fat_100g'];
  const satFatNAFlag = satFatG === undefined || satFatG === null;
  const satFatValue = satFatNAFlag ? 0 : satFatG;
  const satFatKcal = satFatValue * 9; // 1g fat = 9 kcal
  const satFatPercentEnergy = totalKcal > 0 ? (satFatKcal / totalKcal) * 100 : 0;
  if (satFatNAFlag) {
    scores.satFat = 0; // Score 0 for N/A
  } else if (satFatPercentEnergy <= 5) {
    scores.satFat = 25;
  } else if (satFatPercentEnergy <= 20) {
    scores.satFat = 25 - (satFatPercentEnergy - 5) * (5 / 3);
  } else {
    scores.satFat = 0; // Beyond 20%, min score
  }
  scores.satFat = Math.min(Math.max(scores.satFat, 0), 25).toFixed(1);
  scores.satFatPercentEnergy = satFatNAFlag ? 'N/A' : satFatPercentEnergy.toFixed(1);

  // Trans Fat (% energy)
  const transFatG = nutriments['trans-fat_100g'];
  const transFatNAFlag = transFatG === undefined || transFatG === null;
  const transFatValue = transFatNAFlag ? 0 : transFatG;
  const transFatKcal = transFatValue * 9; // 1g fat = 9 kcal
  const transFatPercentEnergy = totalKcal > 0 ? (transFatKcal / totalKcal) * 100 : 0;
  if (transFatNAFlag) {
    scores.transFat = 0; // Score 0 for N/A
  } else if (transFatPercentEnergy === 0) {
    scores.transFat = 25;
  } else if (transFatPercentEnergy <= 5) {
    scores.transFat = 25 - transFatPercentEnergy * 5;
  } else {
    scores.transFat = 0; // Beyond 5%, min score
  }
  scores.transFat = Math.min(Math.max(scores.transFat, 0), 25).toFixed(1);
  scores.transFatPercentEnergy = transFatNAFlag ? 'N/A' : transFatPercentEnergy.toFixed(1);

  // Sodium (mg/kcal)
  const sodiumG = nutriments.sodium_100g;
  const sodiumNAFlag = sodiumG === undefined || sodiumG === null;
  const sodiumValue = sodiumNAFlag ? 0 : sodiumG;
  const sodiumMg = sodiumValue * 1000; // Convert g to mg
  const sodiumMgPerKcal = totalKcal > 0 ? sodiumMg / totalKcal : 0; // Handle zero energy
  if (sodiumNAFlag) {
    scores.sodium = 0; // Score 0 for N/A
  } else if (sodiumMgPerKcal <= 0.5) {
    scores.sodium = 25;
  } else if (sodiumMgPerKcal <= 2) {
    scores.sodium = 25 - (sodiumMgPerKcal - 0.5) * (50 / 3);
  } else {
    scores.sodium = 0; // Beyond 2, min score
  }
  scores.sodium = Math.min(Math.max(scores.sodium, 0), 25).toFixed(1);
  scores.sodiumMgPerKcal = sodiumNAFlag ? 'N/A' : sodiumMgPerKcal.toFixed(2);

  // Fiber (g/100g)
  const fiberG = nutriments.fiber_100g;
  const fiberNAFlag = fiberG === undefined || fiberG === null;
  const fiberValue = fiberNAFlag ? 0 : fiberG;
  if (fiberNAFlag) {
    scores.fiber = 0; // Score 0 for N/A
  } else if (isZeroCalorie) {
    scores.fiber = 25; // No penalty for zero-calorie products
  } else if (fiberValue >= 3) {
    scores.fiber = 25;
  } else {
    scores.fiber = 25 - (3 - fiberValue) * (25 / 3);
  }
  scores.fiber = Math.min(Math.max(scores.fiber, 0), 25).toFixed(1);

  // Proteins (% energy)
  const proteinsG = nutriments.proteins_100g;
  const proteinsNAFlag = proteinsG === undefined || proteinsG === null;
  const proteinsValue = proteinsNAFlag ? 0 : proteinsG;
  const proteinsKcal = proteinsValue * 4; // 1g protein = 4 kcal
  const proteinsPercentEnergy = totalKcal > 0 ? (proteinsKcal / totalKcal) * 100 : 0;
  if (proteinsNAFlag) {
    scores.proteins = 0; // Score 0 for N/A
  } else if (isZeroCalorie) {
    scores.proteins = 25; // No penalty for zero-calorie products
  } else if (proteinsPercentEnergy >= 10) {
    scores.proteins = 25;
  } else {
    scores.proteins = 25 - (10 - proteinsPercentEnergy) * (5 / 2);
  }
  scores.proteins = Math.min(Math.max(scores.proteins, 0), 25).toFixed(1);
  scores.proteinsPercentEnergy = proteinsNAFlag ? 'N/A' : proteinsPercentEnergy.toFixed(1);

  // Count N/A nutrients
  const naCount = [sugarsNAFlag, satFatNAFlag, transFatNAFlag, sodiumNAFlag, fiberNAFlag, proteinsNAFlag].filter(Boolean).length;

  // Calculate average score and scale to 0-100
  const scoreValues = [scores.sugars, scores.satFat, scores.transFat, scores.sodium, scores.fiber, scores.proteins]
    .map(parseFloat);
  
  const averageScore = scoreValues.reduce((a, b) => a + b, 0) / 6;
  let totalScore = averageScore * 4;

  // Apply penalty for extremely high sugars
  if (!sugarsNAFlag && sugarsPercentEnergy > 20) {
    const sugarPenalty = (sugarsPercentEnergy - 20) * 0.5; // Reduce total score by 0.5 per % over 20%
    totalScore -= sugarPenalty;
  }

  totalScore = Math.min(Math.max(totalScore, 0), 100).toFixed(1);

  return { scores, totalScore, totalKcal, naCount };
}

// Get health rating based on total score (higher score = healthier, adjusted ranges)
function getHealthRating(totalScore) {
  const score = parseFloat(totalScore);
  if (score >= 85) {
    return { rating: 'Very Healthy', color: 'green' };
  } else if (score >= 70) {
    return { rating: 'Healthy', color: 'lightgreen' };
  } else if (score >= 55) {
    return { rating: 'Moderate', color: 'yellow' };
  } else if (score >= 40) {
    return { rating: 'Unhealthy', color: 'orange' };
  } else {
    return { rating: 'Very Unhealthy', color: 'red' };
  }
}

// Display error or product information
function displayProductInfo(productInfo, product = null, error = null) {
  if (!productInfo) return;
  if (error) {
    if (error.includes('Product not found')) {
      productInfo.innerHTML = `<p style="color: red;" role="alert">Product not found in the database. Please try another barcode.</p>`;
    } else {
      productInfo.innerHTML = `<p style="color: red;" role="alert">Error: ${sanitize(error)}</p>`;
    }
    return;
  }

  const { nutriments, nutrition_grades, product_name } = product;
  const { scores, totalScore, totalKcal, naCount } = calculateNutrientScores(nutriments || {});

  // Check if more than 3 nutrients are N/A
  if (naCount > 3) {
    productInfo.innerHTML = `
      <h3>${sanitize(product_name || 'Unknown Product')}</h3>
      <p style="color: red; font-weight: bold;" role="alert">Product not available - Insufficient nutrient information (${naCount} nutrients missing)</p>
    `;
    productInfo.setAttribute('role', 'region');
    productInfo.setAttribute('aria-live', 'polite');
    return;
  }

  const { rating, color } = getHealthRating(totalScore);

  productInfo.innerHTML = `
    <h3>${sanitize(product_name || 'Unknown Product')}</h3>
    <p><strong>Energy:</strong> ${sanitize(totalKcal || 'N/A')} kcal/100g</p>
    <p><strong>Nutri-Score:</strong> ${sanitize(nutrition_grades?.toUpperCase() || 'N/A')}</p>
    <p class="nutrient">
      <strong>Sugars:</strong> ${sanitize(nutriments?.sugars_100g || 'N/A')} g/100g (${scores.sugarsPercentEnergy}% energy)
      <span class="score">Score: ${scores.sugars}/25</span>
      <div class="progress-bar">
        <div class="progress" style="width: ${(scores.sugars / 25) * 100}%; background-color: ${scores.sugars < 5 ? 'red' : scores.sugars < 15 ? 'orange' : 'green'};"></div>
      </div>
    </p>
    <p class="nutrient">
      <strong>Saturated Fat:</strong> ${sanitize(nutriments?.['saturated-fat_100g'] || 'N/A')} g/100g (${scores.satFatPercentEnergy}% energy)
      <span class="score">Score: ${scores.satFat}/25</span>
      <div class="progress-bar">
        <div class="progress" style="width: ${(scores.satFat / 25) * 100}%; background-color: ${scores.satFat < 5 ? 'red' : scores.satFat < 15 ? 'orange' : 'green'};"></div>
      </div>
    </p>
    <p class="nutrient">
      <strong>Trans Fat:</strong> ${sanitize(nutriments?.['trans-fat_100g'] || 'N/A')} g/100g (${scores.transFatPercentEnergy}% energy)
      <span class="score">Score: ${scores.transFat}/25</span>
      <div class="progress-bar">
        <div class="progress" style="width: ${(scores.transFat / 25) * 100}%; background-color: ${scores.transFat < 5 ? 'red' : scores.transFat < 15 ? 'orange' : 'green'};"></div>
      </div>
    </p>
    <p class="nutrient">
      <strong>Sodium:</strong> ${sanitize((nutriments?.sodium_100g || 0) * 1000)} mg/100g (${scores.sodiumMgPerKcal} mg/kcal)
      <span class="score">Score: ${scores.sodium}/25</span>
      <div class="progress-bar">
        <div class="progress" style="width: ${(scores.sodium / 25) * 100}%; background-color: ${scores.sodium < 5 ? 'red' : scores.sodium < 15 ? 'orange' : 'green'};"></div>
      </div>
    </p>
    <p class="nutrient">
      <strong>Fiber:</strong> ${sanitize(nutriments?.fiber_100g || 'N/A')} g/100g
      <span class="score">Score: ${scores.fiber}/25</span>
      <div class="progress-bar">
        <div class="progress" style="width: ${(scores.fiber / 25) * 100}%; background-color: ${scores.fiber < 5 ? 'red' : scores.fiber < 15 ? 'orange' : 'green'};"></div>
      </div>
    </p>
    <p class="nutrient">
      <strong>Proteins:</strong> ${sanitize(nutriments?.proteins_100g || 'N/A')} g/100g (${scores.proteinsPercentEnergy}% energy)
      <span class="score">Score: ${scores.proteins}/25</span>
      <div class="progress-bar">
        <div class="progress" style="width: ${(scores.proteins / 25) * 100}%; background-color: ${scores.proteins < 5 ? 'red' : scores.proteins < 15 ? 'orange' : 'green'};"></div>
      </div>
    </p>
    <p><strong>Total Score:</strong> ${totalScore}/100</p>
    <p><strong>Health Rating:</strong> <span class="health-rating" style="color: ${color}; background-color: ${color === 'yellow' ? '#333' : 'transparent'}; padding: 2px 5px; border-radius: 3px;">${rating}</span></p>
  `;
  productInfo.setAttribute('role', 'region');
  productInfo.setAttribute('aria-live', 'polite');
  productInfo.setAttribute('aria-live', 'polite');
}

function displayAIInfo(productInfo, aiReport) {
  const container = document.getElementById('ai-report-container');
  if (!aiReport || !container) {
    if (container) container.style.display = 'none';
    return;
  }

  const { summary, banned_ingredients, risks, daily_limits, alternatives } = aiReport;

  // Render Summary
  const summaryEl = document.getElementById('ai-summary');
  if (summaryEl) summaryEl.textContent = summary || 'No summary available.';

  // Helper to render lists and toggle visibility
  const renderList = (id, items, sectionId) => {
    const el = document.getElementById(id);
    const section = document.getElementById(sectionId);

    if (!el || !section) return;

    el.innerHTML = ''; // Clear previous content

    if (Array.isArray(items) && items.length > 0) {
      items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = sanitize(String(item));
        el.appendChild(li);
      });
      section.style.display = 'block'; // Show section if there is data
    } else {
      section.style.display = 'none'; // Hide section if empty
    }
  };

  renderList('ai-banned', banned_ingredients, 'section-banned');
  renderList('ai-risks', risks, 'section-risks');
  renderList('ai-limits', daily_limits, 'section-limits');
  renderList('ai-alternatives', alternatives, 'section-alternatives');

  // Show the container
  container.style.display = 'block';
}

// Display status messages
function displayStatus(barcodeText, message, isError = false) {
  if (!barcodeText) return;
  barcodeText.textContent = message;
  barcodeText.style.color = isError ? 'red' : 'black';
  barcodeText.setAttribute('role', isError ? 'alert' : 'status');
}

// Toggle loading indicator
function toggleLoading(loading, show) {
  if (loading) {
    loading.style.display = show ? 'block' : 'none';
  }
}

// Initialize camera stream
async function startCamera(videoElement) {
  if (!videoElement) {
    console.error('Video element not found');
    return null;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    videoElement.srcObject = stream;
    videoElement.play().catch(playErr => console.error('Video play error:', playErr));
    videoElement.style.width = '100%';
    videoElement.style.height = 'auto';
    return stream;
  } catch (err) {
    console.error('Camera error:', err);
    return null;
  }
}

// Stop camera stream
function stopCamera(stream, videoElement) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (videoElement) {
    videoElement.srcObject = null;
  }
}

// Fetch product information with robust handling
async function fetchProduct(barcodeValue, apiEndpoint = '/api/scan') {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: barcodeValue }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('API Response (raw):', text);
      throw new Error(`Server error: ${response.status} ${response.statusText} - ${text.substring(0, 50)}...`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Invalid response: Expected JSON, got HTML or text');
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// Scan barcode and fetch product info
async function scanBarcode(video, barcodeText, productInfo, scanButton, loading, apiEndpoint = '/api/scan') {
  if (!video || !barcodeText || !productInfo || !scanButton || !loading) {
    console.error('Missing DOM elements');
    displayStatus(barcodeText, 'Error: UI elements not found', true);
    return;
  }

  if (!window.BarcodeDetector) {
    displayStatus(barcodeText, 'Barcode Detection API not supported in this browser. Use Chrome/Edge or upload a file.', true);
    return;
  }

  const barcodeDetector = new BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'],
  });

  try {
    toggleLoading(loading, true);
    scanButton.disabled = true;
    scanButton.setAttribute('aria-busy', 'true');
    const barcodes = await barcodeDetector.detect(video);
    if (barcodes.length === 0) {
      displayStatus(barcodeText, 'No barcode detected. Try again.');
      return;
    }

    const barcodeValue = barcodes[0].rawValue;
    displayStatus(barcodeText, `Detected Barcode: ${sanitize(barcodeValue)}`);

    const data = await fetchProduct(barcodeValue, apiEndpoint);
    displayProductInfo(productInfo, data.product);
    if (data.ai) {
      displayAIInfo(productInfo, data.ai);
    }
  } catch (err) {
    console.error('Scan error:', err);
    displayStatus(barcodeText, 'Scan failed. Try again.', true);
    displayProductInfo(productInfo, null, err.message || 'Failed to fetch product data');
  } finally {
    scanButton.disabled = false;
    scanButton.setAttribute('aria-busy', 'false');
    toggleLoading(loading, false);
  }
}

// Process uploaded file and scan barcodes
async function processFile(file, barcodeText, productInfo, loading, apiEndpoint = '/api/scan') {
  if (!file || !barcodeText || !productInfo || !loading) {
    console.error('Missing DOM elements or file');
    displayStatus(barcodeText, 'Error: UI elements not found', true);
    return;
  }

  toggleLoading(loading, true);
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const filename = file.name;
      gk_fileData[filename] = e.target.result;

      if (filename.endsWith('.xlsx')) {
        gk_isXlsx = true;
        gk_xlsxFileLookup[filename] = true;
        gk_fileData[filename] = e.target.result.split(',')[1];
      }

      const csv = loadFileData(filename);
      if (!csv) {
        displayStatus(barcodeText, 'Error processing file', true);
        toggleLoading(loading, false);
        return;
      }

      const rows = csv.split('\n').map(row => row.split(','));
      const barcodes = rows.slice(1).map(row => row[0]).filter(b => b && /^\d+$/.test(b));

      if (barcodes.length === 0) {
        displayStatus(barcodeText, 'No valid barcodes found in file', true);
        toggleLoading(loading, false);
        return;
      }

      const barcodeValue = barcodes[0];
      displayStatus(barcodeText, `Processing Barcode: ${sanitize(barcodeValue)}`);

      const data = await fetchProduct(barcodeValue, apiEndpoint);
      displayProductInfo(productInfo, data.product);
      if (data.ai) {
        displayAIInfo(productInfo, data.ai);
      }
    };

    reader.onerror = () => {
      displayStatus(barcodeText, 'Error reading file', true);
      toggleLoading(loading, false);
    };

    if (filename.endsWith('.xlsx')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  } catch (err) {
    console.error('File processing error:', err);
    displayStatus(barcodeText, 'Error processing file', true);
    displayProductInfo(productInfo, null, err.message || 'Failed to process file');
    toggleLoading(loading, false);
  }
}

// Main initialization
function initBarcodeScanner() {
  const video = document.querySelector('.camera');
  const scanButton = document.getElementById('scanButton');
  const clearButton = document.getElementById('clearButton');
  const fileInput = document.getElementById('fileInput');
  const barcodeText = document.getElementById('barcode');
  const productInfo = document.getElementById('productInfo');
  const loading = document.getElementById('loading');

  if (!video || !scanButton || !clearButton || !fileInput || !barcodeText || !productInfo || !loading) {
    console.error('One or more DOM elements not found');
    return;
  }

  let localStream = null;

  window.addEventListener('load', async () => {
    localStream = await startCamera(video);
    if (!localStream) {
      displayStatus(barcodeText, `Error accessing camera. <button onclick="startCamera(video)">Retry</button>`, true);
    }
  });

  scanButton.addEventListener('click', () => {
    scanBarcode(video, barcodeText, productInfo, scanButton, loading);
  });

  clearButton.addEventListener('click', () => {
    displayStatus(barcodeText, 'Waiting for scan...');
    displayStatus(barcodeText, 'Waiting for scan...');
    displayProductInfo(productInfo);
    const aiContainer = document.getElementById('ai-report-container');
    if (aiContainer) aiContainer.style.display = 'none';
    fileInput.value = '';
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file, barcodeText, productInfo, loading);
    }
  });

  window.addEventListener('unload', () => {
    stopCamera(localStream, video);
  });
}

initBarcodeScanner();
