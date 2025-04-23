const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

app.post('/scan', async (req, res) => {
  const { barcode } = req.body;
  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required' });
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,nutriscore_data,nutriments,nutrition_grades`,
      {
        headers: {
          'User-Agent': 'NutriScan/1.0 (contact@nutriscan.example.com)',
        },
      }
    );
    const data = await response.json();

    if (data.status === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Failed to fetch product data' });
  }
});

module.exports = app;
