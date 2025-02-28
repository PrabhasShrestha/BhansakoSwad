import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import "../../styles/Vendor/ProductPage.css"; // Import external CSS
import Sidebar from "../../components/Sidebar";

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [showing, setShowing] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const vendorId = localStorage.getItem("vendorId");

  // Fetch Orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!vendorId) {
          console.error("No Vendor ID found!");
          return;
        }

        console.log("Fetching orders for Vendor ID:", vendorId);
        const response = await axios.get(`http://localhost:3000/api/orders/vendor/${vendorId}`);
        setOrders(response.data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, [vendorId]);

  // Group orders by order_id
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.order_id]) {
      acc[order.order_id] = { ...order, products: [] };
    }
    acc[order.order_id].products.push({
      name: order.product_name,
      image: order.product_image,
      quantity: order.quantity,
      price: order.price,
    });
    return acc;
  }, {});

  const ordersArray = Object.values(groupedOrders); // Ensure it's defined before usage

  // Filter Orders Based on Search Term
  const filteredOrders = ordersArray.filter(order =>
    order.products.some(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    order.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.post(`http://localhost:3000/api/orders/${orderId}/status`, { status: newStatus });

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId ? { ...order, status: newStatus } : order
        )
      );

      console.log(`✅ Order ${orderId} updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Error updating order status:", error);
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
          </div>
        </div>

        {/* Orders Table */}
        <div className="product-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product Name</th>
                <th>Customer Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total Amount</th>
                <th>Order Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, showing).map((order) => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>
                    {order.products.map((product, index) => (
                      <div key={index} className="product-info">
                        <img src={`http://localhost:3000/uploads/products/${product.image}`} className="products-image" />
                        <span className="products-name">{product.name}</span>
                      </div>
                    ))}
                  </td>
                  <td>{`${order.first_name} ${order.last_name}`}</td>
                  <td>
                    {order.products.map((product, index) => (
                      <div key={index}>Rs {product.price.toFixed(2)}</div>
                    ))}
                  </td>
                  <td>
                    {order.products.map((product, index) => (
                      <div key={index}>{product.quantity}</div>
                    ))}
                  </td>
                  <td>Rs {order.total_amount.toFixed(2)}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{order.status}</td>
                  <td>
                    {order.status === "Processing" && (
                      <button className="status-button" onClick={() => updateOrderStatus(order.order_id, "Shipped")}>
                        Mark as Shipped
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>No Orders Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
