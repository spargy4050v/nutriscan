const fetch = require('node-fetch');

async function analyzeWithAI(product) {
  // Read env vars at runtime, not at module load time
  const DIFY_API_KEY = process.env.DIFY_API_KEY;
  const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';

  // Debug log (remove after confirming it works)
  console.log('DIFY_API_KEY exists:', !!DIFY_API_KEY);
  console.log('DIFY_BASE_URL:', DIFY_BASE_URL);

  if (!DIFY_API_KEY) {
    console.error('DIFY_API_KEY is missing from environment variables');
    return null;
  }

  // Extract key nutriments to avoid hitting the 256 char limit in Dify
  const n = product.nutriments || {};
  const nutrientSummary = [
    `Energy: ${n['energy-kcal_100g'] || 0} kcal/100g`,
    `Sugar: ${n.sugars_100g || 0}g`,
    `Fat: ${n.fat_100g || 0}g`,
    `Sat fat: ${n['saturated-fat_100g'] || 0}g`,
    `Sodium: ${(n.sodium_100g || 0) * 1000}mg`
  ].join(', ');

  // Prepare minimal context to avoid token limits
  const context = {
    product_name: (product.product_name || 'Unknown Product').substring(0, 200), // Safety truncation
    ingredients: (product.ingredients_text || 'No ingredients listed').substring(0, 1000), // Safety truncation
    nutriments: nutrientSummary.substring(0, 250), // Enforce 250 limit (Pro Fix)
  };

  console.log("Sending to Dify:", {
    product_name: context.product_name,
    ingredients: context.ingredients,
    nutriments: context.nutriments
  });

  try {
    const response = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: context,
        response_mode: 'blocking',
        user: 'nutriscan-user',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Dify API error: Status ${response.status}`);
      console.error('Dify error details:', errorText.substring(0, 500));
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Dify returned non-JSON response:', text.substring(0, 500));
      return null;
    }

    const data = await response.json();
    const outputs = data.data.outputs;

    let aiRawData = outputs;

    // Handle case where Dify returns JSON wrapped in a string field
    if (typeof outputs !== 'string') {
      // 1. Try known keys
      let potentialJsonString = outputs.answer || outputs.text || outputs.output || outputs.json || outputs.result;

      // 2. If not found, search for ANY string value in the object
      if (!potentialJsonString && typeof outputs === 'object') {
        for (const key in outputs) {
          if (typeof outputs[key] === 'string' && outputs[key].length > 0) {
            potentialJsonString = outputs[key];
            break;
          }
        }
      }

      if (typeof potentialJsonString === 'string') {
        aiRawData = potentialJsonString;
      }
    }

    let aiReport = {};

    // Parse if it's a string
    if (typeof aiRawData === 'string') {
      try {
        const cleanJson = aiRawData.replace(/```json/g, '').replace(/```/g, '').trim();
        aiReport = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Failed to parse AI output as JSON. Error:', e.message);
        console.error('Raw AI output (first 500 chars):', aiRawData.substring(0, 500));
        // Fallback: treat string as summary if parsing fails
        aiReport = { summary: aiRawData };
      }
    } else {
      // It's already an object
      aiReport = aiRawData;
    }

    // Ensure we strictly map and normalize only the expected fields (Fix 2)
    // normalizing arrays handled below...

    // Normalize response to ensure arrays are valid
    const ensureArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        if (val.includes(',')) return val.split(',').map(s => s.trim());
        if (val.toLowerCase().includes('none') || !val.trim()) return [];
        return [val];
      }
      return [];
    };

    // Construct the clean result object (Fix 2 & 3 support)
    const fallbackSummary = (typeof outputs === 'object')
      ? `No summary. Recieved keys: ${Object.keys(outputs).join(', ')}`
      : 'No summary provided by AI.';

    const finalReport = {
      summary: aiReport.summary || (typeof aiReport === 'string' ? aiReport : fallbackSummary),
      banned_ingredients: ensureArray(aiReport.banned_ingredients),
      risks: ensureArray(aiReport.risks),
      daily_limits: ensureArray(aiReport.daily_limits),
      alternatives: ensureArray(aiReport.alternatives)
    };

    return finalReport;

  } catch (error) {
    console.error('AI Analysis failed:', error);
    return null;
  }
}

module.exports = { analyzeWithAI };
