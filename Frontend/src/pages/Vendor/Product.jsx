import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import "../../styles/Vendor/ProductPage.css"; // Import external CSS
import Sidebar from "../../components/Sidebar";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [showing, setShowing] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatedProduct, setUpdatedProduct] = useState({ price: "", in_stock: "", image: null, description: "" });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "", in_stock: "", image: null, description: "" });
  const [customCategory, setCustomCategory] = useState("");
  const [errorMessage, setErrorMessage] = useState("");


  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }
  
      const response = await axios.get("http://localhost:3000/api/getproducts", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("API Response:", response.data); // Debugging line
  
      if (response.data.success && Array.isArray(response.data.products)) {
        setProducts(response.data.products);
      } else {
        console.error("Unexpected API response:", response.data);
        setProducts([]); // Fallback to empty array
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]); // Prevent crash
    }
  };
  
  
  // Handle Delete Request
  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:3000/api/deleteproducts", {
        headers: { Authorization: `Bearer ${token}` },
        data: { id: selectedProduct.product_id },
      });

      setProducts(products.filter((p) => p.product_id !== selectedProduct.product_id));
      setShowConfirmDelete(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // Handle Update Request
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("id", selectedProduct.product_id);
      formData.append("price", updatedProduct.price);
      formData.append("in_stock", updatedProduct.in_stock);
      formData.append("description", updatedProduct.description);
      if (updatedProduct.image) {
        formData.append("image", updatedProduct.image);
      } else {
        formData.append("existingImage", selectedProduct.image); // Send previous image
      }

      await axios.post("http://localhost:3000/api/updateproducts", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      fetchProducts(); // Refresh product list
      setShowUpdateModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  
const handleAddProduct = async (e) => {
  e.preventDefault();
  setErrorMessage(""); // Reset error message before attempting submission

  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    // Use custom category if "Other" is selected
    const finalCategory = newProduct.category === "Other" ? customCategory : newProduct.category;

    if (!finalCategory) {
      setErrorMessage("Please select a category or enter a custom one.");
      return;
    }

    formData.append("name", newProduct.name);
    formData.append("category", finalCategory);
    formData.append("price", newProduct.price);
    formData.append("in_stock", newProduct.in_stock);
    formData.append("description", newProduct.description);
    if (newProduct.image) {
      formData.append("image", newProduct.image);
    }

    await axios.post("http://localhost:3000/api/addproducts", formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });

    fetchProducts(); // Refresh product list
    setShowAddProductModal(false);
    setNewProduct({ name: "", category: "", price: "", in_stock: "", image: null, description: "" });
    setCustomCategory(""); // Reset input
  } catch (error) {
    if (error.response) {
      if (error.response.status === 409) {
        setErrorMessage("This product already exists! Try updating the existing product instead.");
      } else {
        setErrorMessage("Failed to add product. Please try again.");
      }
    } else {
      setErrorMessage("Network error. Please check your connection.");
    }
  }
};

  return (
    <div className="products-grid">
      <Sidebar />
      <div className="product-page">
        <div className="top-section">
          {/* Search Bar */}
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Controls */}
          <div className="controls">
            <div className="dropdown">
              <span>Showing</span>
              <select value={showing} onChange={(e) => setShowing(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button className="add-product-btn" onClick={() => setShowAddProductModal(true)}>
              + Add New Product
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="product-table">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Product ID</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(products) &&products
               .filter((product) => product.product_name && product.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, showing)
                .map((product) => (
                  <tr key={product.product_id}>
                    <td>
                      <div className="product-info">
                        <img src={`http://localhost:3000/uploads/products/${product.image}`} alt={product.name} className="products-image" />
                        <span className="products-name">{product.product_name}</span>
                      </div>
                    </td>
                    <td>{product.product_id}</td>
                    <td>{product.price}</td>
                    <td>{product.in_stock}</td>
                    <td>{product.category}</td>
                    <td>{product.description}</td>
                    <td>
                      <span className={`status ${product.in_stock > 0 ? "available" : "out-of-stock"}`}>
                        {product.in_stock > 0 ? "Available" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="action-column">
                      <div className="action-menu">
                        <span
                          className="action-dots"
                          onClick={() => setShowMenu(showMenu === product.product_id ? null : product.product_id)}
                        >
                          ⋮
                        </span>
                        {showMenu === product.product_id && (
                          <div className="dropdown-menu">
                            <button onClick={() => { 
                              setSelectedProduct(product); 
                              setUpdatedProduct({ price: product.price, in_stock: product.in_stock, description: product.description, image: null });
                              setShowUpdateModal(true);
                            }}>Update</button>
                            <button onClick={() => { setSelectedProduct(product); setShowConfirmDelete(true); }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddProductModal && (
        <div className="modals">
          <div className="modal-content">
            <h3>Add New Product</h3>
                  {/* Error Message Display */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
            <form onSubmit={handleAddProduct}>
              <label>Product Name</label>
              <input type="text" name="name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required />

              <label>Category</label>
                <select
                  name="category"
                  value={newProduct.category}
                  onChange={(e) => {
                    const selectedCategory = e.target.value;
                    setNewProduct({ ...newProduct, category: selectedCategory });
                    
                    // Reset custom input when "Other" is selected
                    if (selectedCategory === "Other") {
                      setCustomCategory("");
                    }
                  }}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Spices & Herbs">Spices & Herbs</option>
                  <option value="Dairy Products">Dairy Products</option>
                  <option value="Meat & Poultry">Meat & Poultry</option>
                  <option value="Baking Essentials">Baking Essentials</option>
                  <option value="Other">Other</option>
                </select>

                {/* Show text input if 'Other' is selected */}
                {newProduct.category === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                )}

              <label>Stock</label>
              <input type="number" name="in_stock" value={newProduct.in_stock} onChange={(e) => setNewProduct({ ...newProduct, in_stock: e.target.value })} required />

              <label>Price ($)</label>
              <input type="number" name="price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} required />

              <label>Description</label>
              <textarea
                name="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Enter product description"
                rows="4"
                required
              ></textarea>

              <label>Product Image</label>
              <input type="file" accept="image/*" onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })} />

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddProductModal(false)}>Cancel</button>
                <button type="submit" className="add-btn">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="modals">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this product?</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmDelete(false)}>Cancel</button>
              <button className="delete-btn" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="modals">
          <div className="modal-content">
            <h3>Update Product</h3>
            <form onSubmit={handleUpdate}>
              <label>Price</label>
              <input type="number" value={updatedProduct.price} onChange={(e) => setUpdatedProduct({ ...updatedProduct, price: e.target.value })} required />
              <label>Stock</label>
              <input type="number" value={updatedProduct.in_stock} onChange={(e) => setUpdatedProduct({ ...updatedProduct, in_stock: e.target.value })} required />
              <label>Description</label>
              <textarea
                name="description"
                value={updatedProduct.description}
                onChange={(e) => setUpdatedProduct({ ...updatedProduct, description: e.target.value })}
                placeholder="Update product description"
                rows="4"
                required
              ></textarea>
            <label>Current Image</label>
        {updatedProduct.image ? (
          <img
            src={URL.createObjectURL(updatedProduct.image)} // Preview selected image
            alt="Updated Product Preview"
            className="product-preview"
          />
        ) : (
          <img
            src={`http://localhost:3000/uploads/products/${selectedProduct.image}`} // Show old image
            alt="Current Product"
            className="product-preview"
          />
        )}

        <label>Change Image (Optional)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setUpdatedProduct({ ...updatedProduct, image: e.target.files[0] })} 
        />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="update-btn">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
