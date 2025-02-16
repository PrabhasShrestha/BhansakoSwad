import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/User/StoreDetails.css";
import Navigationbar from "../../components/NavBar";
import Footer from "../../components/Footer";
import { FaShoppingCart } from "react-icons/fa";

const StoreDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 

  useEffect(() => {
    // Fetch store details
    fetch(`http://localhost:3000/api/store/details/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStore(data.data);
        } else {
          console.error("Store not found:", data.message);
        }
      })
      .catch((err) => console.error("Error fetching store:", err));

    // Fetch store products
    fetch(`http://localhost:3000/api/store/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Store Products API Response:", data)
        if (data.success) {
          setProducts(data.data);
        } else {
          console.error("No products found:", data.message);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, [id]);

  if (!store) return <p>Loading store details...</p>;

  const filteredProducts = products.filter((product) =>
    product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="store-detailspage">
      <Navigationbar />
      <div className="productdetailspage">
        <div className="store-header">
          <h2 className="store-title">{store?.shop_name || "Store Not Found"} Store</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search in Store"
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // ✅ Updates searchTerm state
            />
            <button className="search-button">Search</button>
          </div>
          <button className="cart-button" onClick={() => navigate('/cart')}>
            <FaShoppingCart size={24} />
          </button>
        </div>

        <h3 className="featured-products-title">Featured Products</h3>
        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <p>No products match your search.</p>
          ) : (
            filteredProducts.map((product) => (
                <div
                  key={product.product_id || product.product_name}
                  className="product-card"
                  onClick={() => {
                    if (!product.product_id) {
                      console.error("Product ID is undefined for:", product);
                    } else {
                      console.log("🛒 Navigating to product:", product);
                      console.log("🔍 Product ID:", product.product_id);
                      console.log("🔍 Seller ID:", product.seller_id);
                      navigate(`/product/${product.product_id}?seller_id=${product.seller_id}`);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <img src={product.image} alt={product.product_name} className="product-image" />
                  
                  <div className="product-info">
                    <div className="product-details">
                      <h4 className="product-name">{product.product_name}</h4>
                      <p className="product-price">Rs {product.price} per {product.unit || 'kg'}</p>
                    </div>
                    <button className="add-to-cart-button">
                      <FaShoppingCart size={13} style={{ marginRight: "3px" }} /> Add
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StoreDetails;
