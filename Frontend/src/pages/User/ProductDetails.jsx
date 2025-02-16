import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navigationbar from "../../components/NavBar";
import Footer from "../../components/Footer";
import "../../styles/User/ProductDetails.css";
import { FaShoppingCart } from "react-icons/fa";

const ProductDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [storeProducts, setStoreProducts] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [store, setStore] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [quantity, setQuantity] = useState(1);
  
    // ✅ Ensure seller_id is correctly extracted from the URL
    const queryParams = new URLSearchParams(location.search);
    const sellerId = queryParams.get("seller_id");

    console.log("🔍 Extracted product_id:", id);
    console.log("🔍 Extracted seller_id:", sellerId);
  
    useEffect(() => {
        if (!id || !sellerId) {
          console.error(" Missing product ID or seller ID. Ensure the URL contains ?seller_id=VALUE.");
          return;
        }
    
        console.log(`Fetching product details for ID: ${id} and Seller ID: ${sellerId}`);
    
        fetch(`http://localhost:3000/api/product/${id}?seller_id=${sellerId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Server Error: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            console.log("✅ Product API Response:", data);
            if (data.success) {
              setProduct(data.data);
              return fetch(`http://localhost:3000/api/store/details/${sellerId}`);
            } else {
              throw new Error(" Product not found.");
            }
          })
          .then((res) => res.json())
          .then((storeData) => {
            console.log("Store API Response:", storeData);
            if (storeData.success) {
              setStore(storeData.data);
              return fetch(`http://localhost:3000/api/store/${sellerId}/products`);
            } else {
              throw new Error("Store not found.");
            }
          })
          .then((res) => res.json())
          .then((productsData) => {
            console.log("✅ Store Products API Response:", productsData);
            if (productsData.success) {
              const filteredProducts = productsData.data.filter(item => item.product_id !== parseInt(id));
              setRelatedProducts(filteredProducts);
            } else {
              throw new Error(" No products found for this store.");
            }
          })
          .catch((error) => console.error("API Fetch Error:", error));
      }, [id, sellerId]);

      const handleDecrease = () => {
        setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
      };
    
      const handleIncrease = () => {
        setQuantity((prev) => prev + 1);
      };
    
  if (!product) return <p>Loading product details...</p>;

  return (
    <div className="productdetails-page">
      <Navigationbar />
      <div className="details-page">
        <div className="store-header">
          <h2 className="store-title">{store?.shop_name || "Store Not Found"} Store</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search in Store"
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-button">Search</button>
          </div>
          <button className="cart-button" onClick={() => navigate('/cart')}>
            <FaShoppingCart size={24} />
          </button>
        </div>
        <div className="details-container">
          <div className="details-grid">
            <img src={product.image} alt={product.product_name} className="details-image" />
            <div className="details-info">
              <h1>{product.product_name}</h1>
              <p>Rs {product.price}</p>
              <p>In stock: {product.in_stock}</p>
              <p>{product.description}</p>
              <div className="quantity-selector">
              <button className="carts-button">
                <FaShoppingCart /> Add to Cart
              </button>
                <button onClick={handleDecrease} className="quantity-button">-</button>
                <span className="quantity-display">{quantity}kg</span>
                <button onClick={handleIncrease} className="quantity-button">+</button>
              </div>
            </div>
          </div>
          <h3>Similar Products from {store?.shop_name}</h3>
          <div className="related-card-grid">
            {relatedProducts.length === 0 ? (
              <p>No related products found.</p>
            ) : (
              relatedProducts.map((item) => (
                <div key={`${item.product_id}-${item.store_id}`} className="related-card" onClick={() => navigate(`/product/${item.product_id}?seller_id=${item.store_id}`)}>
                  <img src={item.image} alt={item.product_name} className="related-card-image" />
                  <div className="related-card-info">
                    <div>
                    <h4>{item.product_name}</h4>
                    <p>Rs {item.price}</p>
                    </div>
                    <button className="add-to-carts-button">
                      <FaShoppingCart size={13} style={{ marginRight: "3px" }}/> Add
                    </button>
                    </div>
                  </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetails;