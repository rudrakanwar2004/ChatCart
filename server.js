// server.js — refined, beginner-friendly Ollama proxy that prepends a compact PRODUCT_CATALOG
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // keep this if your Node doesn't have global fetch
import AbortController from 'abort-controller';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

/* -------------------------
   Mock product data
   (kept compact for clarity)
   ------------------------- */
const mockElectronics = [
  { id: 101, title: "iPhone 15 Pro", priceINR: 84999, originalPrice: 99999, discount: 15, description: "Latest iPhone with advanced camera and A17 Pro chip", category: "electronics", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&w=600", rating: { rate: 4.8, count: 250 }, brand: "Apple" },
  { id: 102, title: "Samsung Galaxy S24", priceINR: 74999, originalPrice: 84999, discount: 12, description: "Powerful Android smartphone with AI features", category: "electronics", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300", rating: { rate: 4.6, count: 180 }, brand: "Samsung" },
  { id: 103, title: "MacBook Pro 16-inch", priceINR: 199999, originalPrice: 229999, discount: 13, description: "Professional laptop for creative work", category: "electronics", image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&w=600", rating: { rate: 4.9, count: 150 }, brand: "Apple" },
  { id: 104, title: "Sony WH-1000XM5", priceINR: 34999, originalPrice: 39999, discount: 13, description: "Industry-leading noise canceling headphones", category: "electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300", rating: { rate: 4.7, count: 320 }, brand: "Sony" },
  { id: 105, title: "PlayStation 5", priceINR: 44999, originalPrice: 49999, discount: 10, description: "Next-gen gaming console", category: "electronics", image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300", rating: { rate: 4.8, count: 420 }, brand: "Sony" }
];

const mockFashion = [
  { id: 201, title: "Men's Casual Shirt", priceINR: 3799, originalPrice: 4499, discount: 16, description: "Comfortable cotton casual shirt", category: "fashion", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300", rating: { rate: 4.3, count: 89 }, brand: "Urban Classic" },
  { id: 202, title: "Women's Summer Dress", priceINR: 5499, originalPrice: 6499, discount: 15, description: "Elegant floral summer dress", category: "fashion", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300", rating: { rate: 4.5, count: 120 }, brand: "Summer Bliss" },
  { id: 203, title: "Leather Jacket", priceINR: 16999, originalPrice: 19999, discount: 15, description: "Genuine leather biker jacket", category: "fashion", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300", rating: { rate: 4.7, count: 75 }, brand: "Rider's Edge" },
  { id: 204, title: "Running Shoes", priceINR: 9999, originalPrice: 11999, discount: 17, description: "Lightweight running shoes", category: "fashion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300", rating: { rate: 4.4, count: 200 }, brand: "RunFast" },
  { id: 205, title: "Designer Handbag", priceINR: 24999, originalPrice: 29999, discount: 17, description: "Luxury leather handbag", category: "fashion", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300", rating: { rate: 4.8, count: 65 }, brand: "Elegance" }
];

/* ------------------------------------------------
   Compact product catalog helper + caching
   ------------------------------------------------ */
let productCatalogCache = null;
let productCatalogCacheAt = 0;
const PRODUCT_CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes
const CATALOG_MAX_CHARS = 120000; // avoid huge prompts — trim if necessary

async function buildProductCatalogText() {
  const now = Date.now();
  if (productCatalogCache && (now - productCatalogCacheAt) < PRODUCT_CACHE_TTL_MS) {
    console.log('Using cached product catalog (fresh).');
    return productCatalogCache;
  }

  console.log('Building product catalog text (fetching endpoints)...');

  try {
    // fetch our own endpoints (they will try external APIs and fall back to mocks)
    const [electronics, fashion] = await Promise.all([
      fetch(`http://localhost:${PORT}/api/electronics`).then(r => r.json()).catch(err => {
        console.warn('Failed to fetch /api/electronics; using mockElectronics', err);
        return [...mockElectronics];
      }),
      fetch(`http://localhost:${PORT}/api/fashion`).then(r => r.json()).catch(err => {
        console.warn('Failed to fetch /api/fashion; using mockFashion', err);
        return [...mockFashion];
      })
    ]);

    const all = [...electronics, ...fashion];
    console.log(`Fetched products: electronics=${electronics.length}, fashion=${fashion.length}, combined=${all.length}`);

    // Build compact lines: id | title | price | category | rating
    const lines = all.map(p => {
      const id = p.id;
      const title = (p.title || '').replace(/\s+/g, ' ').trim();
      const price = p.priceINR ?? (p.price ? Math.round(p.price * 85) : 0);
      const category = p.category || 'misc';
      const rating = p.rating?.rate ?? 'N/A';
      return `${id} | ${title} | ₹${price} | ${category} | ${rating}`;
    });

    let catalogText = `PRODUCT_CATALOG\nCount: ${lines.length}\n\n` + lines.join('\n');

    // If the catalog is too big, trim (keep top-rated first by attempt)
    if (catalogText.length > CATALOG_MAX_CHARS) {
      console.warn('Product catalog too large; trimming to fit prompt size limits.');
      // Keep first N characters safely at word boundary
      catalogText = catalogText.slice(0, CATALOG_MAX_CHARS);
      // avoid breaking a line: cut back to last newline
      const lastNewline = catalogText.lastIndexOf('\n');
      if (lastNewline > 0) catalogText = catalogText.slice(0, lastNewline);
      catalogText += `\n\n[TRUNCATED: catalog too large to include fully]`;
    }

    productCatalogCache = catalogText;
    productCatalogCacheAt = Date.now();
    console.log(`Built product catalog (chars=${productCatalogCache.length}).`);
    return productCatalogCache;

  } catch (err) {
    console.error('Error building product catalog — falling back to mock lists:', err);
    const lines = [...mockElectronics, ...mockFashion].map(p => `${p.id} | ${p.title} | ₹${p.priceINR} | ${p.category} | ${p.rating?.rate}`);
    const fallback = `PRODUCT_CATALOG\nCount: ${lines.length}\n\n` + lines.join('\n');
    productCatalogCache = fallback;
    productCatalogCacheAt = Date.now();
    return productCatalogCache;
  }
}

/* ------------------------------------------------
   Ollama proxy endpoint — prepends PRODUCT_CATALOG
   ------------------------------------------------ */
app.post('/api/ollama/generate', async (req, res) => {
  console.log('\n===============================');
  console.log('🟡 /api/ollama/generate HIT', new Date().toISOString());

  try {
    const body = req.body || {};
    const { model, prompt, stream = false, options = {}, useProductContext = true, extraContext = {} } = body;

    console.log('Incoming request -> model:', model || '(default)', 'useProductContext:', Boolean(useProductContext));
    console.log('Incoming extraContext:', JSON.stringify(extraContext));

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt in request body.' });
    }

    let productContext = '';
    if (useProductContext) {
      productContext = await buildProductCatalogText();
      const cartIds = (extraContext.current_cart_ids || []).join(',') || 'none';
      const lastUserQuery = extraContext.last_user_query || 'none';
      const lastBotResponse = extraContext.last_bot_response || 'none';
      productContext += `\n\nSESSION_METADATA:\n- CART_IDS: ${cartIds}\n- LAST_USER_QUERY: ${lastUserQuery}\n- LAST_BOT_RESPONSE: ${lastBotResponse}\n`;
      console.log('Attached SESSION_METADATA (cart/count/last queries).');
    }

    const finalPrompt = `${productContext}\n\nUSER_PROMPT:\n${prompt}`;
    console.log('📝 FINAL PROMPT LENGTH (chars):', finalPrompt.length);
    console.log('📝 Prompt excerpt:\n', finalPrompt.slice(0, 1200).replace(/\n/g, ' ') + (finalPrompt.length > 1200 ? '... (truncated excerpt)' : ''));

    const targetModel = model || 'llama3.2';

    // increased timeout for Ollama requests
    const controller = new AbortController();
    const timeoutMs = 60_000; // 60s (raise if needed)
    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const upstreamResp = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: targetModel,
        prompt: finalPrompt,
        stream,
        options: Object.keys(options).length ? options : { temperature: 0.1, top_p: 0.9, max_tokens: 120 }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!upstreamResp.ok) {
      const bodyText = await upstreamResp.text().catch(() => '(could not read upstream body)');
      console.error('Ollama upstream non-OK. Status:', upstreamResp.status, 'Body (excerpt):', bodyText.slice(0, 2000));
      throw new Error(`Ollama upstream error: ${upstreamResp.status} ${bodyText}`);
    }

    const data = await upstreamResp.json();

    console.log('✅ Ollama returned response. Keys:', Object.keys(data));
    if (data.response && typeof data.response === 'string') {
      console.log('  - response excerpt:', data.response.slice(0, 800).replace(/\n/g, ' ') + (data.response.length > 800 ? '...': ''));
    }

    res.json(data);
    console.log('➡️ Proxied Ollama response back to client. DONE.');
  } catch (err) {
    console.error('Ollama proxy error (detailed):', err && err.message ? err.message : err);
    res.status(500).json({
      error: 'Failed to communicate with Ollama (proxy error).',
      details: err?.message || String(err)
    });
  }
});

/* ------------------------------------------------
   Force rebuild product catalog (dev)
   ------------------------------------------------ */
app.post('/api/ollama/rebuild-context', async (req, res) => {
  try {
    console.log('Rebuild product catalog requested.');
    productCatalogCache = null;
    await buildProductCatalogText();
    res.json({ ok: true, message: 'Product catalog rebuilt.' });
  } catch (err) {
    console.error('Failed to rebuild product catalog:', err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

/* ------------------------------------------------
   Product endpoints (try external APIs, fall back to mock)
   ------------------------------------------------ */
app.get('/api/electronics', async (req, res) => {
  try {
    let products = [...mockElectronics];

    try {
      const [dummyResponse, fakeResponse] = await Promise.allSettled([
        fetch('https://dummyjson.com/products/category/smartphones').then(r => r.json()),
        fetch('https://fakestoreapi.com/products/category/electronics').then(r => r.json())
      ]);

      if (dummyResponse.status === 'fulfilled' && dummyResponse.value.products) {
        const dummyProducts = dummyResponse.value.products.map(product => ({
          id: `dummy-${product.id}`,
          title: product.title,
          priceINR: Math.round(product.price * 85),
          originalPrice: Math.round(product.price * 85 * 1.2),
          discount: Math.floor(Math.random() * 30) + 10,
          description: product.description,
          category: "electronics",
          image: product.thumbnail,
          rating: { rate: product.rating, count: product.stock },
          brand: product.brand || 'Premium',
          source: 'dummyjson'
        }));
        products.push(...dummyProducts);
      }

      if (fakeResponse.status === 'fulfilled') {
        const fakeProducts = fakeResponse.value.map(product => ({
          id: `fake-${product.id}`,
          title: product.title,
          priceINR: Math.round(product.price * 85),
          originalPrice: Math.round(product.price * 85 * 1.15),
          discount: Math.floor(Math.random() * 30) + 10,
          description: product.description,
          category: "electronics",
          image: product.image,
          rating: { rate: product.rating?.rate || 4.0, count: product.rating?.count || 100 },
          brand: 'Premium',
          source: 'fakestore'
        }));
        products.push(...fakeProducts);
      }
    } catch (externalError) {
      console.warn('External electronics APIs failed; using mock data only.', externalError && externalError.message);
    }

    res.json(products);
  } catch (error) {
    console.error('Electronics endpoint error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Failed to fetch electronics' });
  }
});

app.get('/api/fashion', async (req, res) => {
  try {
    let products = [...mockFashion];

    try {
      const [dummyMen, dummyWomen, fakeFashion] = await Promise.allSettled([
        fetch('https://dummyjson.com/products/category/mens-shirts').then(r => r.json()),
        fetch('https://dummyjson.com/products/category/womens-dresses').then(r => r.json()),
        fetch('https://fakestoreapi.com/products/category/jewelery').then(r => r.json())
      ]);

      if (dummyMen.status === 'fulfilled' && dummyMen.value.products) {
        const menProducts = dummyMen.value.products.map(product => ({
          id: `dummy-men-${product.id}`,
          title: product.title,
          priceINR: Math.round(product.price * 85),
          originalPrice: Math.round(product.price * 85 * 1.25),
          discount: Math.floor(Math.random() * 30) + 10,
          description: product.description,
          category: "fashion",
          image: product.thumbnail,
          rating: { rate: product.rating, count: product.stock },
          brand: product.brand || 'Fashion',
          source: 'dummyjson'
        }));
        products.push(...menProducts);
      }

      if (dummyWomen.status === 'fulfilled' && dummyWomen.value.products) {
        const womenProducts = dummyWomen.value.products.map(product => ({
          id: `dummy-women-${product.id}`,
          title: product.title,
          priceINR: Math.round(product.price * 85),
          originalPrice: Math.round(product.price * 85 * 1.25),
          discount: Math.floor(Math.random() * 30) + 10,
          description: product.description,
          category: "fashion",
          image: product.thumbnail,
          rating: { rate: product.rating, count: product.stock },
          brand: product.brand || 'Fashion',
          source: 'dummyjson'
        }));
        products.push(...womenProducts);
      }

      if (fakeFashion.status === 'fulfilled') {
        const fakeProducts = fakeFashion.value.map(product => ({
          id: `fake-fashion-${product.id}`,
          title: product.title,
          priceINR: Math.round(product.price * 85),
          originalPrice: Math.round(product.price * 85 * 1.2),
          discount: Math.floor(Math.random() * 30) + 10,
          description: product.description,
          category: "fashion",
          image: product.image,
          rating: { rate: product.rating?.rate || 4.0, count: product.rating?.count || 100 },
          brand: 'Luxury',
          source: 'fakestore'
        }));
        products.push(...fakeProducts);
      }
    } catch (externalError) {
      console.warn('External fashion APIs failed; using mock data only.', externalError && externalError.message);
    }

    res.json(products);
  } catch (error) {
    console.error('Fashion endpoint error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Failed to fetch fashion' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const [electronics, fashion] = await Promise.all([
      fetch(`http://localhost:${PORT}/api/electronics`).then(r => r.json()),
      fetch(`http://localhost:${PORT}/api/fashion`).then(r => r.json())
    ]);
    const allProducts = [...electronics, ...fashion];
    // Shuffle for variety
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);
    res.json(shuffledProducts);
  } catch (error) {
    console.error('Products endpoint error:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/electronics');
  console.log('  GET  /api/fashion');
  console.log('  GET  /api/products');
  console.log('  GET  /api/health');
  console.log('  POST /api/ollama/generate');
  console.log('  POST /api/ollama/rebuild-context');
});
