import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import "../../styles/Vendor/AddProduct.css";

const AddProduct = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [product, setProduct] = useState({
    name: "",
    description: "",
    category: "",
    subCategory: "",
    quantity: "",
    sku: "",
    weight: "",
    length: "",
    breadth: "",
    width: "",
    price: "",
    comparePrice: "",
    sellingType: "in-store",
    image: null,
  });

  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct({ ...product, image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Product Data:", product);
  };

  return (
    <div className="add-product-page">
    <div className="add-product">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate("/product")}>
        ← Back to Product Page
      </button>

      <h2>Add New Product</h2>

      <form onSubmit={handleSubmit} className="product-form">
        {/* Left Side */}
        <div className="form-section">
          <label>Product Name</label>
          <input type="text" name="name" value={product.name} onChange={handleChange} placeholder="Enter product name" required />

          <label>Business Description</label>
          <textarea name="description" value={product.description} onChange={handleChange} placeholder="Enter product details" required></textarea>

          <label>Product Category</label>
          <select name="category" value={product.category} onChange={handleChange}>
            <option value="">Select Category</option>
            <option value="Health & Medicine">Health & Medicine</option>
            <option value="Beauty">Beauty</option>
          </select>

          <label>Sub Category</label>
          <select name="subCategory" value={product.subCategory} onChange={handleChange}>
            <option value="">Select Subcategory</option>
            <option value="Skincare">Skincare</option>
            <option value="Haircare">Haircare</option>
          </select>

          <label>Inventory</label>
          <div className="inventory">
            <input type="number" name="quantity" value={product.quantity} onChange={handleChange} placeholder="Quantity" required />
            <input type="text" name="sku" value={product.sku} onChange={handleChange} placeholder="SKU (Optional)" />
          </div>

          <label>Selling Type</label>
          <div className="selling-type">
            <input type="radio" name="sellingType" value="in-store" checked={product.sellingType === "in-store"} onChange={handleChange} />
            <label>In-store only</label>

            <input type="radio" name="sellingType" value="online" checked={product.sellingType === "online"} onChange={handleChange} />
            <label>Online only</label>

            <input type="radio" name="sellingType" value="both" checked={product.sellingType === "both"} onChange={handleChange} />
            <label>Available both in-store and online</label>
          </div>
        </div>

        {/* Right Side */}
        <div className="form-section">
          <label>Product Images</label>
          <div className="image-upload">
            <input type="file" onChange={handleImageUpload} hidden id="imageUpload" />
            <label htmlFor="imageUpload" className="upload-box">
              {previewImage ? <img src={previewImage} alt="Preview" className="preview-image" /> : "Click to upload or drag and drop"}
            </label>
          </div>

          <label>Shipping and Delivery</label>
          <div className="shipping">
            <input type="number" name="weight" value={product.weight} onChange={handleChange} placeholder="Item Weight" />
            <div className="dimensions">
              <input type="number" name="length" value={product.length} onChange={handleChange} placeholder="Length" />
              <input type="number" name="breadth" value={product.breadth} onChange={handleChange} placeholder="Breadth" />
              <input type="number" name="width" value={product.width} onChange={handleChange} placeholder="Width" />
            </div>
          </div>

          <label>Pricing</label>
          <div className="pricing">
            <input type="number" name="price" value={product.price} onChange={handleChange} placeholder="Price ($)" required />
            <input type="number" name="comparePrice" value={product.comparePrice} onChange={handleChange} placeholder="Compare at Price ($)" />
          </div>

          <div className="buttons">
            <button type="button" className="discard">Discard</button>
            <button type="button" className="schedule">Schedule</button>
            <button type="submit" className="add-product-btn">Add Product</button>
          </div>
        </div>
      </form>
    </div>
    </div>
  );
};

export default AddProduct;
