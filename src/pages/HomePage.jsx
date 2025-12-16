import Dashboard from '../components/Dashboard'

const HomePage = ({ products, onAddToCart, featuredProducts }) => {
  return (
    <Dashboard 
      featuredProducts={featuredProducts}
      onProductClick={onAddToCart}
    />
  )
}

export default HomePage