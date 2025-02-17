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
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [store, setStore] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [cartMessage, setCartMessage] = useState("");
    const [cartsMessage, setCartsMessage] = useState("");
    const [showMessage, setShowMessage] = useState(false);
    const [messages, setMessages] = useState({});

    const queryParams = new URLSearchParams(location.search);
    const sellerId = queryParams.get("seller_id");

    useEffect(() => {
        if (!id || !sellerId) {
          console.error(" Missing product ID or seller ID. Ensure the URL contains ?seller_id=VALUE.");
          return;
        }
    
        fetch(`http://localhost:3000/api/product/${id}?seller_id=${sellerId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Server Error: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.success) {
              setProduct(data.data);
              return fetch(`http://localhost:3000/api/store/details/${sellerId}`);
            } else {
              throw new Error(" Product not found.");
            }
          })
          .then((res) => res.json())
          .then((storeData) => {
            if (storeData.success) {
              setStore(storeData.data);
              return fetch(`http://localhost:3000/api/store/${sellerId}/products`);
            } else {
              throw new Error("Store not found.");
            }
          })
          .then((res) => res.json())
          .then((productsData) => {
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

      const handleAddToCart = () => {
        if (!product){
        return;
        }

        const cartItem = {
          product_id: product.product_id,
          productdetails_id: product.productdetails_id, 
          seller_id: sellerId,
          quantity: quantity,
        };
    
        // Send data to backend
        fetch("http://localhost:3000/api/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Ensure user authentication
          },
          body: JSON.stringify(cartItem),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success || data.message.includes("updated successfully")) {  
              setCartMessage(" Item added to cart successfully! 🛒");
              setShowMessage(true);

              setTimeout(() => {
                  setShowMessage(false);
              }, 3000);
          } else {
            setCartMessage(`❌ Failed to add to cart: ${data.message}`);
            setShowMessage(true);

            setTimeout(() => {
                setShowMessage(false);
            }, 3000);
          }
          })
          .catch((error) => console.error("Error adding to cart:", error));
      };

      const handleQuickAddToCart = (item) => {
        if (!item || !item.product_id || !item.store_id) {
            return;
        }

        const cartItem = {
            product_id: item.product_id,
            productdetails_id: item.productdetails_id, // Ensure productdetails_id exists
            seller_id: item.store_id, // Ensure correct seller/store ID
            quantity: 1, // Always add exactly one unit
        };

        fetch("http://localhost:3000/api/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`, // Ensure authentication
            },
            body: JSON.stringify(cartItem),
        })
        .then((res) => res.json())
        .then((data) => {
            const successMessage = `"${item.product_name}" added to cart!`;
            const errorMessage = "❌ Failed to add to cart.";

            // Update the message for the clicked product only
            setMessages((prev) => ({
                ...prev,
                [item.product_id]: data.success || data.message.includes("updated successfully") ? successMessage : errorMessage
            }));

            // Remove the message after 3 seconds
            setTimeout(() => {
                setMessages((prev) => ({
                    ...prev,
                    [item.product_id]: null
                }));
            }, 3000);
        })
        .catch((error) => {
            console.error("❌ Error adding to cart:", error);
        });
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
          <button className="cart-button" onClick={() => navigate('/shoppingcart')}>
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
              <button   onClick={handleAddToCart} className="carts-button">
                <FaShoppingCart /> Add to Cart
              </button>
                <button onClick={handleDecrease} className="quantity-button">-</button>
                <span className="quantity-display">{quantity}kg</span>
                <button onClick={handleIncrease} className="quantity-button">+</button>
              </div>
              {showMessage && (
              <p style={{
                  color: cartMessage.includes("❌") ? "red" : "green", 
                  marginTop: "10px",
                  transition: "opacity 0.5s ease-in-out"
              }}>
                  {cartMessage}
              </p>
              )}
            </div>
          </div>
          <h3>Similar Products from {store?.shop_name}</h3>
            <div className="related-card-grid">
                {relatedProducts.length === 0 ? (
                    <p>No related products found.</p>
                ) : (
                    relatedProducts.map((item) => (
                        <div key={`${item.product_id}-${item.store_id}`} className="related-card">
                            <img 
                                src={item.image} 
                                alt={item.product_name} 
                                className="related-card-image" 
                                onClick={() => navigate(`/product/${item.product_id}?seller_id=${item.store_id}`)} 
                            />
                            <div className="related-card-info">
                                <div>
                                    <h4>{item.product_name}</h4>
                                    <p>Rs {item.price}</p>
                                </div>
                                <button className="add-to-carts-button" onClick={() => handleQuickAddToCart(item)}>
                                    <FaShoppingCart size={13} style={{ marginRight: "3px" }} /> Add
                                </button>
                            </div>
                            
                            {/* Show success or error message only for the clicked product */}
                            {messages[item.product_id] && (
                                <p style={{
                                    color: messages[item.product_id].includes("❌") ? "red" : "green",
                                    fontSize: "9px",
                                    marginTop: "1px",
                                    marginLeft: "10px",
                                    marginBottom: "5px",
                                    transition: "opacity 0.5s ease-in-out"
                                }}>
                                    {messages[item.product_id]}
                                </p>
                            )}
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