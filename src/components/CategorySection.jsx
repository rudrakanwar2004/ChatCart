import ProductCard from './ProductCard'
import { memo } from 'react'

const CategorySection = ({ title, subtitle, products, onAddToCart }) => {
  return (
    <section className="category-section">
      <div className="container">
        <div className="category-header">
          <h1 className="category-title">{title}</h1>
          <p className="category-subtitle">{subtitle}</p>
          <div className="category-stats">
            <span>{products.length} products available</span>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => onAddToCart(product)}
              />
            ))}
          </div>
        ) : (
          <div className="no-products">
            <h3>No products found in this category</h3>
            <p>Please check back later for new arrivals.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default memo(CategorySection)