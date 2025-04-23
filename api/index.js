const express = require('express');

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenFoodFacts API error: ${response.status} ${response.statusText} - ${errorText}`);
      return res.status(response.status).json({ error: `Failed to fetch product data: ${response.statusText}` });
    }

    const data = await response.json();

    if (data.status === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('API error:', err.message, err.stack);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
