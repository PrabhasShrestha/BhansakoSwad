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
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch all products data from the API endpoint
    fetch("http://localhost:3000/api/admin/allProducts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
          setFilteredProducts(data.data);
        } else {
          console.error("Failed to fetch products.");
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    let result = products;

    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.product_name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
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
    if (window.confirm("Are you sure you want to delete this product?")) {
      fetch(`http://localhost:3000/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Remove the deleted product from the state
            setProducts(products.filter(product => product.product_id !== id));
            alert("Product deleted successfully.");
          } else {
            // Display error message if deletion failed (e.g., product in active order)
            alert(data.message);
          }
        })
        .catch((error) => {
          console.error("Error deleting product:", error);
          alert("Error deleting product.");
        });
    }
  };

  // Get unique categories for filter
  const categories = [...new Set(products.map(product => product.category))];

  // Pagination logic
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
                <label htmlFor="categoryFilter" className="admin-filter-label">
                  Category:
                </label>
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
                    <th>Product ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Seller ID</th>
                    <th>Seller Name</th>
                    <th>Shop Name</th>
                    <th>Price</th>
                    <th>In Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(product => (
                    <tr key={product.product_id}>
                      <td>{product.product_id}</td>
                      <td>
                        <div className="admin-product-image">
                          <img 
                            src={`http://localhost:3000/${product.image}`} 
                            alt={product.product_name} 
                          />
                        </div>
                      </td>
                      <td>{product.product_name}</td>
                      <td>{product.category}</td>
                      <td>{product.seller_id}</td>
                      <td>{product.seller_name}</td>
                      <td>{product.shop_name}</td>
                      <td>Rs{product.price.toFixed(2)}</td>
                      <td>{product.in_stock}</td>
                      <td>
                        <div className="admin-actions">
                          <button 
                            className="admin-action-button admin-delete-button"
                            onClick={() => handleDeleteProduct(product.product_id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan="10" className="no-products">No products found.</td>
                    </tr>
                  )}
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

          {/* Add Product Modal can be integrated here if needed */}
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
