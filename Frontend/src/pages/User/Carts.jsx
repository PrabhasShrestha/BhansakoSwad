import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import Navigationbar from "../../components/NavBar";
import Footer from "../../components/Footer";
import "../../styles/User/Carts.css"; 

const ShoppingCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/cart/cart", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCartItems(data.cart);
          localStorage.setItem("cart", JSON.stringify(data.cart));
        } else {
          console.error("Failed to fetch cart items");
        }
      })
      .catch((error) => console.error("Error fetching cart items:", error));
  }, [cartItems]);

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.13;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotal();

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return; 
  
    fetch("http://localhost:3000/api/cart/update-quantity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ productdetails_id: id, quantity: newQuantity }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to update cart quantity.");
        }
        return data;
      })
      .then((data) => {
        if (data.success) {
          const updatedCart = cartItems.map((item) =>
            item.productdetails_id === id ? { ...item, quantity: newQuantity } : item
          );
          setCartItems(updatedCart);
          localStorage.setItem("cart", JSON.stringify(updatedCart)); 
        }
      })
      .catch((error) => {
        console.error("Error updating cart quantity:", error);
        toast.error(error.message || "Error updating cart quantity.");
      });
  };  
  
  const removeItem = (id) => {
    fetch("http://localhost:3000/api/cart/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ productdetails_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const updatedCart = cartItems.filter((item) => item.productdetails_id !== id);
          setCartItems(updatedCart);
          localStorage.setItem("cart", JSON.stringify(updatedCart));
        }
      })
      .catch((error) => console.error("Error removing item from cart:", error));
  };
  
  return (
    <div>
      <Navigationbar />
      <div className="cartPage_container">
        <header className="cartPage_header">
          <button className="cartPage_backButton" onClick={() => navigate(-1)}>← Back</button>
          <h1>Your Cart</h1>
        </header>

        <main className="cartPage_main">
          <div className="cartPage_cartItems">
            {cartItems.length === 0 ? (
              <p className="cartPage_emptyCart">Your cart is empty.</p>
            ) : (
              <table className="cartPage_table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.productdetails_id}>
                      <td className="cartPage_item">
                      <img src={item.image} alt={item.product_name} className="cartPage_itemImage" />
                        <div className="cartPage_itemInfo">
                          <h3 className="cartPage_itemName">{item.product_name}</h3>
                          <p>In kg</p>
                        </div>
                      </td>
                      <td>Rs {item.price}</td>
                      <td>
                        <div className="cartPage_quantityControls">
                          <button onClick={() => updateQuantity(item.productdetails_id, item.quantity - 1)} className="cartPage_quantityButton">-</button>
                          <span className="cartPage_quantityDisplay">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productdetails_id, item.quantity + 1)} className="cartPage_quantityButton">+</button>
                        </div>
                      </td>
                      <td>Rs {item.price * item.quantity}</td>
                      <td>
                        <button onClick={() => removeItem(item.productdetails_id)} className="cartPage_removeButton">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="cartPage_summary">
              <h2 className="cartPage_summaryTitle">Order Summary</h2>
              <div className="cartPage_summaryRow">
                <span>Subtotal:</span>
                <span>Rs {subtotal.toFixed(2)}</span>
              </div>
              <div className="cartPage_summaryRow">
                <span>Tax (13%):</span>
                <span>Rs {tax.toFixed(2)}</span>
              </div>
              <div className="cartPage_summaryRow cartPage_summaryTotal">
                <span>Total:</span>
                <span>Rs {total.toFixed(2)}</span>
              </div>
              <button className="cartPage_checkoutButton" onClick={() => {
                localStorage.setItem("total", total.toFixed(2));
                localStorage.setItem("cart", JSON.stringify(cartItems)); 
                navigate("/orderdetails");
              }}>
                Proceed to Checkout
              </button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ShoppingCart;
