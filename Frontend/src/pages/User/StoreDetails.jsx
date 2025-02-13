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
        if (data.success) {
          setProducts(data.data);
        } else {
          console.error("No products found:", data.message);
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, [id]);

  if (!store) return <p>Loading store details...</p>;

  return (
    <div className="store-detailspage">
      <Navigationbar />
      <div className="productdetailspage">
      <div className="store-header">
      <h2 className="store-title">{store?.shop_name || "Store Not Found"} Store</h2>
        <div className="search-container">
          <input type="text" placeholder="Search in Store" className="search-box" />
          <button className="search-button">Search</button>
        </div>
        <button className="cart-button" onClick={() => navigate('/cart')}>
          <FaShoppingCart size={24} />
        </button>
      </div>

      <h3 className="featured-products-title">Featured Products</h3>
      <div className="product-grid">
      {products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          products.map((product) => (
            <div key={product.id  || product.product_name} className={`product-card`}>
              <img src={product.image} alt={product.product_name} className="product-image" />
              
              <div className="product-info">
                <div className="product-details">
                  <h4 className="product-name">{product.product_name}</h4>
                  <p className="product-price">Rs {product.price} per {product.unit || 'kg'}</p>
                </div>
                <button className="add-to-cart-button">
                  <FaShoppingCart size={13} style={{ marginRight: "3px" }}/>Add
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default StoreDetails;
