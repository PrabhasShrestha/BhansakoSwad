import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navigationbar from "../../components/NavBar";
import Footer from "../../components/Footer";
import "../../styles/User/ProductDetails.css";
import { FaShoppingCart } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProductDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const sellerId = queryParams.get("seller_id");

  useEffect(() => {
    if (!id || !sellerId) {
      console.error("Missing product ID or seller ID. Ensure the URL contains ?seller_id=VALUE.");
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
          throw new Error("Product not found.");
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
          const filteredProducts = productsData.data.filter(
            (item) => item.product_id !== parseInt(id)
          );
          setRelatedProducts(filteredProducts);
        } else {
          throw new Error("No products found for this store.");
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
    if (!product) {
      toast.error("Product data is not available.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    const cartItem = {
      product_id: product.product_id,
      productdetails_id: product.productdetails_id,
      seller_id: sellerId,
      quantity: quantity,
    };

    fetch("http://localhost:3000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(cartItem),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Response data:", data);

        if (
          data.message?.includes("added to cart") ||
          data.message?.includes("updated successfully")
        ) {
          toast.success(`"${product.product_name}" added to cart successfully! 🛒`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          toast.error(`Failed to add to cart: ${data.message || "Unknown error"}`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        toast.error("Server error, please try again.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
  };

  const handleQuickAddToCart = (item) => {
    if (!item || !item.product_id || !item.store_id) {
      console.error("❌ Invalid product data:", item);
      toast.error("Invalid product data.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    const cartItem = {
      product_id: item.product_id,
      productdetails_id: item.productdetails_id || item.product_id,
      seller_id: item.store_id,
      quantity: 1,
    };

    fetch("http://localhost:3000/api/cart/add", {
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
        console.log("🔍 Quick Add API Response:", data);

        if (
          data.message?.includes("added to cart") ||
          data.message?.includes("updated successfully")
        ) {
          toast.success(`"${item.product_name}" added to cart! 🛒`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          toast.error(`Failed to add to cart: ${data.message || "Unknown error"}`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      })
      .catch((error) => {
        let errorMessage = "Server error, try again.";

        if (error.status === 400) {
          errorMessage = `Not enough stock available.`;
        } else if (error.status === 401) {
          errorMessage = "Unauthorized! Please log in.";
        } else if (error.status === 404) {
          errorMessage = "Product not found.";
        } else if (error.status === 500) {
          errorMessage = "Internal server error.";
        }

        console.error(`❌ Error (${error.status}):`, error.message || "Unknown error");

        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
  };

  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredProducts([]);
      setShowDropdown(false);
      return;
    }

    const results = relatedProducts.filter((product) =>
      product.product_name.toLowerCase().includes(term)
    );

    setFilteredProducts(results);
    setShowDropdown(results.length > 0);
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.product_id}?seller_id=${product.store_id}`);
    setSearchTerm("");
    setShowDropdown(false);
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
              onChange={handleSearchChange}
            />
            <button className="search-button" onClick={handleSearchChange}>
              Search
            </button>
            {showDropdown && (
              <div className="search-dropdown">
                {filteredProducts.map((product) => (
                  <div
                    key={product.product_id}
                    className="search-result-item"
                    onClick={() => handleProductClick(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.product_name}
                      className="search-product-image"
                    />
                    <span className="search-product-name">{product.product_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="cart-button" onClick={() => navigate("/shoppingcart")}>
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
                <button onClick={handleAddToCart} className="carts-button">
                  <FaShoppingCart /> Add to Cart
                </button>
                <button onClick={handleDecrease} className="quantity-button">
                  -
                </button>
                <span className="quantity-display">{quantity}kg</span>
                <button onClick={handleIncrease} className="quantity-button">
                  +
                </button>
              </div>
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
                    onClick={() =>
                      navigate(`/product/${item.product_id}?seller_id=${item.store_id}`)
                    }
                  />
                  <div className="related-card-info">
                    <div>
                      <h4>{item.product_name}</h4>
                      <p>Rs {item.price}</p>
                    </div>
                    <button
                      className="add-to-carts-button"
                      onClick={() => handleQuickAddToCart(item)}
                    >
                      <FaShoppingCart size={13} style={{ marginRight: "3px" }} /> Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
};

export default ProductDetails;