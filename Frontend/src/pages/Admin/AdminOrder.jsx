import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin/AdminOrder.css';
import { FaSearch } from 'react-icons/fa';
import AdminSidebar from '../../components/AdminSidebar';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/admin/orders");
      setOrders(response.data.orders);
      setFilteredOrders(response.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    let result = orders;
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.order_id.toString().toLowerCase().includes(query) ||
        order.first_name.toLowerCase().includes(query) ||
        order.last_name.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(result);
    setCurrentPage(1);
  }, [statusFilter, searchQuery, orders]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:3000/api/orders/${orderId}/updateStatus`, { status: newStatus });
      setOrders(orders.map(order => order.order_id === orderId ? { ...order, status: newStatus } : order));
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-orders">
          <div className="admin-header">
            <h1 className="admin-title">Orders</h1>
          </div>

          <div className="admin-card">
            <div className="admin-filters">
              <div className="admin-filter-group">
                <label htmlFor="statusFilter" className="admin-filter-label">Status:</label>
                <select 
                  id="statusFilter" 
                  className="admin-filter-select"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="admin-search-group">
                <input
                  type="text"
                  placeholder="Search by Order ID, Name, or Email..."
                  className="admin-search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <FaSearch className="admin-order-search-icon" />
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Shop Name</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
      
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(order => (
                    <tr key={order.order_id}>
                      <td>{order.order_id}</td>
                      <td>
                        <div>{order.first_name} {order.last_name}</div>
                      </td>
                      <td>{order.seller_name}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>{order.quantity}</td>
                      <td>Rs {order.total_amount}</td>
                      <td>
                        <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
    
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button 
                className="admin-pagination-button" 
                disabled={currentPage === 1}
                onClick={() => paginate(currentPage - 1)}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.ceil(filteredOrders.length / itemsPerPage) }).map((_, index) => (
                <button
                  key={index}
                  className={`admin-pagination-number ${currentPage === index + 1 ? 'admin-pagination-active' : ''}`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              
              <button 
                className="admin-pagination-button"
                disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                onClick={() => paginate(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
