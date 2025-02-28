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
  const [cartMessages, setCartMessages] = useState({});
  const [showMessage, setShowMessage] = useState(false);

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

  
  const handleQuickAddToCart = (product) => {
    if (!product || !product.product_id || !product.seller_id) {
        console.error("❌ Invalid product data:", product);
        return;
    }

    const cartItem = {
        product_id: product.product_id,
        productdetails_id: product.productdetails_id || product.product_id,
        seller_id: product.seller_id,
        quantity: 1,
    };

    console.log("🛒 Sending to cart:", JSON.stringify(cartItem, null, 2));

    fetch("http://localhost:3000/api/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cartItem),
    })
    .then((res) => {
        if (!res.ok) {
            return res.json().then((data) => {
                throw { status: res.status, message: data.message };
            });
        }
        return res.json();
    })
    .then((data) => {
        console.log("🔍 API Response:", data);

        const successMessage = `"${product.product_name}" added to cart! 🛒`;
        const errorMessage = `❌ Failed to add to cart: ${data.message || "Unknown error"}`;

        setCartMessages((prevMessages) => ({
            ...prevMessages,
            [product.product_id]: data.message?.includes("added to cart") || data.message?.includes("updated successfully")
                ? successMessage
                : errorMessage,
        }));

        setTimeout(() => {
            setCartMessages((prevMessages) => ({
                ...prevMessages,
                [product.product_id]: "",
            }));
        }, 3000);
    })
    .catch((error) => {
        let errorMessage = "❌ Server error, try again.";

        if (error.status === 400) {
            errorMessage = "❌ " + (error.message || "Not enough stock available.");
        } else if (error.status === 401) {
            errorMessage = "❌ Unauthorized! Please log in.";
        } else if (error.status === 404) {
            errorMessage = "❌ Product not found.";
        } else if (error.status === 500) {
            errorMessage = "❌ Internal server error.";
        }

        console.error(`❌ Error (${error.status}):`, error.message || "Unknown error");

        setCartMessages((prevMessages) => ({
            ...prevMessages,
            [product.product_id]: errorMessage,
        }));

        setTimeout(() => {
            setCartMessages((prevMessages) => ({
                ...prevMessages,
                [product.product_id]: "",
            }));
        }, 3000);
    });
};

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
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button className="search-button">Search</button>
          </div>
          <button className="cart-button" onClick={() => navigate('/shoppingcart')}>
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
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <img src={product.image} alt={product.product_name} className="product-image" onClick={()=>{navigate(`/product/${product.product_id}?seller_id=${product.seller_id}`)}} />
                  {cartMessages[product.product_id] && (
                    <p style={{
                     
                      color: cartMessages[product.product_id].includes("❌") ? "red" : "green",
                        fontSize: "9px",
                        marginTop: "3px", 
                        marginLeft: "10px"             
                    }}>
                        {cartMessages[product.product_id]}
                    </p>)}
                  <div className="product-info">
                    <div className="product-details">
                      <h4 className="product-name">{product.product_name}</h4>
                      <p className="product-price">Rs {product.price} per {product.unit || 'kg'}</p>
                    </div>
                    
                    <button className="add-to-cart-button" onClick={() => handleQuickAddToCart(product)}>
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
