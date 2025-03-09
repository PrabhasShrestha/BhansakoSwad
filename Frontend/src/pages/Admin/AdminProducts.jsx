// AdminProducts.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/Admin/AdminProducts.css';
import AdminSidebar from '../../components/AdminSidebar';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    // In a real application, you would fetch this data from your API
    const dummyProducts = [
      { id: '1', name: 'Fresh Basil', category: 'Herbs', price: 4.99, stock: 50, description: 'Fresh organic basil', image: 'basil.jpg' },
      { id: '2', name: 'Olive Oil', category: 'Oils', price: 12.99, stock: 25, description: 'Extra virgin olive oil', image: 'olive-oil.jpg' },
      { id: '3', name: 'Himalayan Salt', category: 'Spices', price: 8.50, stock: 40, description: 'Pink Himalayan salt', image: 'salt.jpg' },
      { id: '4', name: 'Organic Honey', category: 'Sweeteners', price: 9.99, stock: 30, description: 'Organic wildflower honey', image: 'honey.jpg' },
      { id: '5', name: 'Vanilla Extract', category: 'Flavorings', price: 15.99, stock: 20, description: 'Pure vanilla extract', image: 'vanilla.jpg' },
      { id: '6', name: 'Parmesan Cheese', category: 'Dairy', price: 7.50, stock: 35, description: 'Aged Parmesan cheese', image: 'parmesan.jpg' },
      { id: '7', name: 'Tomato Sauce', category: 'Sauces', price: 3.99, stock: 60, description: 'Homemade tomato sauce', image: 'tomato-sauce.jpg' },
      { id: '8', name: 'Almond Flour', category: 'Flours', price: 11.99, stock: 15, description: 'Fine ground almond flour', image: 'almond-flour.jpg' },
      { id: '9', name: 'Maple Syrup', category: 'Sweeteners', price: 14.50, stock: 18, description: 'Pure maple syrup', image: 'maple-syrup.jpg' },
      { id: '10', name: 'Balsamic Vinegar', category: 'Vinegars', price: 10.99, stock: 22, description: 'Aged balsamic vinegar', image: 'balsamic.jpg' },
      { id: '11', name: 'Saffron', category: 'Spices', price: 29.99, stock: 10, description: 'Premium saffron threads', image: 'saffron.jpg' },
      { id: '12', name: 'Coconut Milk', category: 'Dairy Alternatives', price: 4.50, stock: 45, description: 'Organic coconut milk', image: 'coconut-milk.jpg' },
    ];
    
    setProducts(dummyProducts);
    setFilteredProducts(dummyProducts);
  }, []);

  useEffect(() => {
    let result = products;
    
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(result);
    setCurrentPage(1);
  }, [categoryFilter, searchQuery, products]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(product => product.id !== id));
  };



  // Get categories for filter
  const categories = [...new Set(products.map(product => product.category))];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="admin-layout">
    <AdminSidebar />
    <div className="admin-main">
    <div className="admin-products">
      <div className="admin-header">
        <h1 className="admin-title">Products</h1>
      </div>

      <div className="admin-card">
        <div className="admin-filters">
          <div className="admin-filter-group">
            <label htmlFor="categoryFilter" className="admin-filter-label">Category:</label>
            <select 
              id="categoryFilter" 
              className="admin-filter-select"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="admin-search-group">
            <input
              type="text"
              placeholder="Search products..."
              className="admin-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(product => (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td>
                    <div className="admin-product-image">
                      <img src={`/placeholder-images/${product.image}`} alt={product.name} />
                    </div>
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="admin-action-button admin-delete-button"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <button 
            className="admin-pagination-button" 
            disabled={currentPage === 1}
            onClick={() => paginate(currentPage - 1)}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }).map((_, index) => (
            <button
              key={index}
              className={`admin-pagination-number ${currentPage === index + 1 ? 'admin-pagination-active' : ''}`}
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          
          <button 
            className="admin-pagination-button"
            disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
            onClick={() => paginate(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      
    </div>
    </div>
    </div>
  );
};

export default AdminProducts;