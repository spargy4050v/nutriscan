const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request at ${req.path} with body:`, req.body);
  next();
});

// Ensure all responses are JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.post('/api/scan', async (req, res) => {
  const { barcode } = req.body;

  // Validate barcode
  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required' });
  }
  if (!/^\d{8,13}$/.test(barcode)) {
    return res.status(400).json({ error: 'Invalid barcode format. Must be 8-13 digits' });
  }

  try {
    console.log(`Fetching product for barcode: ${barcode}`);
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,nutriscore_data,nutriments,nutrition_grades,proteins_100g`,
      {
        headers: {
          'User-Agent': 'NutriScan/1.0 (contact@nutriscan.example.com)',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Open Food Facts API error for barcode ${barcode}: Status ${response.status}, Response: ${errorText}`);
      return res.status(response.status).json({ error: `Open Food Facts API failed: ${response.status}`, details: errorText });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Non-JSON response for barcode ${barcode}:`, text);
      return res.status(500).json({ error: 'Invalid response: Expected JSON, got HTML or text', details: text });
    }

    const data = await response.json();

    if (data.status === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`Successfully fetched product data for barcode ${barcode}`);
    res.json(data);
  } catch (err) {
    console.error(`Error processing barcode ${barcode}:`, err.stack || err.message);
    res.status(500).json({ error: 'Failed to fetch product data', details: err.message });
  }
});

// Handle invalid routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack || err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
