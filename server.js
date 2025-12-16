import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Ollama API proxy
app.post('/api/ollama/generate', async (req, res) => {
  try {
    const { model, prompt, stream, options } = req.body;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama3.2:1b',
        prompt,
        stream: stream || false,
        options: options || { temperature: 0.7, top_p: 0.9, max_tokens: 600 }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ollama proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with Ollama', 
      details: error.message 
    });
  }
});

// Mock data (moved from App.jsx)
const mockElectronics = [
  {
    id: 101,
    title: "iPhone 15 Pro",
    priceINR: 84999,
    originalPrice: 99999,
    discount: 15,
    description: "Latest iPhone with advanced camera and A17 Pro chip",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&w=600",
    rating: { rate: 4.8, count: 250 },
    brand: "Apple"
  },
  {
    id: 102,
    title: "Samsung Galaxy S24",
    priceINR: 74999,
    originalPrice: 84999,
    discount: 12,
    description: "Powerful Android smartphone with AI features",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300",
    rating: { rate: 4.6, count: 180 },
    brand: "Samsung"
  },
  {
    id: 103,
    title: "MacBook Pro 16-inch",
    priceINR: 199999,
    originalPrice: 229999,
    discount: 13,
    description: "Professional laptop for creative work",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&w=600",
    rating: { rate: 4.9, count: 150 },
    brand: "Apple"
  },
  {
    id: 104,
    title: "Sony WH-1000XM5",
    priceINR: 34999,
    originalPrice: 39999,
    discount: 13,
    description: "Industry-leading noise canceling headphones",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
    rating: { rate: 4.7, count: 320 },
    brand: "Sony"
  },
  {
    id: 105,
    title: "PlayStation 5",
    priceINR: 44999,
    originalPrice: 49999,
    discount: 10,
    description: "Next-gen gaming console",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300",
    rating: { rate: 4.8, count: 420 },
    brand: "Sony"
  }
];

const mockFashion = [
  {
    id: 201,
    title: "Men's Casual Shirt",
    priceINR: 3799,
    originalPrice: 4499,
    discount: 16,
    description: "Comfortable cotton casual shirt",
    category: "fashion",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300",
    rating: { rate: 4.3, count: 89 },
    brand: "Urban Classic"
  },
  {
    id: 202,
    title: "Women's Summer Dress",
    priceINR: 5499,
    originalPrice: 6499,
    discount: 15,
    description: "Elegant floral summer dress",
    category: "fashion",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300",
    rating: { rate: 4.5, count: 120 },
    brand: "Summer Bliss"
  },
  {
    id: 203,
    title: "Leather Jacket",
    priceINR: 16999,
    originalPrice: 19999,
    discount: 15,
    description: "Genuine leather biker jacket",
    category: "fashion",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300",
    rating: { rate: 4.7, count: 75 },
    brand: "Rider's Edge"
  },
  {
    id: 204,
    title: "Running Shoes",
    priceINR: 9999,
    originalPrice: 11999,
    discount: 17,
    description: "Lightweight running shoes",
    category: "fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
    rating: { rate: 4.4, count: 200 },
    brand: "RunFast"
  },
  {
    id: 205,
    title: "Designer Handbag",
    priceINR: 24999,
    originalPrice: 29999,
    discount: 17,
    description: "Luxury leather handbag",
    category: "fashion",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300",
    rating: { rate: 4.8, count: 65 },
    brand: "Elegance"
  }
];

// Enhanced product APIs with real data fetching
app.get('/api/electronics', async (req, res) => {
  try {
    let products = [...mockElectronics];
    
    // Try to fetch from external APIs for more data
    try {
      const [dummyResponse, fakeResponse] = await Promise.allSettled([
        fetch('https://dummyjson.com/products/category/smartphones').then(r => r.json()),
        fetch('https://fakestoreapi.com/products/category/electronics').then(r => r.json())
      ]);

      // Add DummyJSON products
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

      // Add FakeStore products
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
      console.warn('External APIs failed, using mock data only');
    }

    res.json(products);
  } catch (error) {
    console.error('Electronics endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch electronics' });
  }
});

app.get('/api/fashion', async (req, res) => {
  try {
    let products = [...mockFashion];
    
    // Try to fetch from external APIs for more data
    try {
      const [dummyMen, dummyWomen, fakeFashion] = await Promise.allSettled([
        fetch('https://dummyjson.com/products/category/mens-shirts').then(r => r.json()),
        fetch('https://dummyjson.com/products/category/womens-dresses').then(r => r.json()),
        fetch('https://fakestoreapi.com/products/category/jewelery').then(r => r.json())
      ]);

      // Process DummyJSON men's fashion
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

      // Process DummyJSON women's fashion
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

      // Process FakeStore fashion
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
      console.warn('External fashion APIs failed, using mock data only');
    }

    res.json(products);
  } catch (error) {
    console.error('Fashion endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch fashion' });
  }
});

// Combined products endpoint
app.get('/api/products', async (req, res) => {
  try {
    const [electronics, fashion] = await Promise.all([
      fetch(`http://localhost:${PORT}/api/electronics`).then(r => r.json()),
      fetch(`http://localhost:${PORT}/api/fashion`).then(r => r.json())
    ]);
    
    const allProducts = [...electronics, ...fashion];
    
    // Shuffle products for variety
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);
    
    res.json(shuffledProducts);
  } catch (error) {
    console.error('Products endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/electronics');
  console.log('  GET  /api/fashion');
  console.log('  GET  /api/products');
  console.log('  GET  /api/health');
  console.log('  POST /api/ollama/generate');
});