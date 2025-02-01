import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoFilter } from "react-icons/io5";
import axios from "axios";
import "../../styles/Vendor/ProductPage.css"; // Import external CSS
import Sidebar from "../../components/Sidebar";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [showing, setShowing] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/products"); // Adjust API endpoint
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  return (
    <div className="product-grid">
    <Sidebar/>
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
          {/* Showing Dropdown */}
          <div className="dropdown">
            <span>Showing</span>
            <select value={showing} onChange={(e) => setShowing(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Filter Button */}
          <button className="filter-btn">
            <IoFilter /> Filter
          </button>

          {/* Add New Product Button */}
          <button className="add-product-btn">+ Add New Product</button>
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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products
              .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .slice(0, showing)
              .map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      <img src={product.image} alt={product.name} className="product-image" />
                      <span className="product-name">{product.name}</span>
                    </div>
                  </td>
                  <td>{product.id}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                  <td>{product.type}</td>
                  <td>
                    <span className={`status ${product.status.toLowerCase()}`}>{product.status}</span>
                  </td>
                  <td>⋮</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default ProductPage;
