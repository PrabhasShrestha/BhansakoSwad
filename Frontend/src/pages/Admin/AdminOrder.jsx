// AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/Admin/AdminOrder.css';
import AdminSidebar from '../../components/AdminSidebar';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    const dummyOrders = [
      { id: '1001', customer: 'John Doe', email: 'john@example.com', date: '2025-03-07', status: 'Delivered', total: '$89.99', items: 3 },
      { id: '1002', customer: 'Jane Smith', email: 'jane@example.com', date: '2025-03-07', status: 'Processing', total: '$124.50', items: 5 },
      { id: '1003', customer: 'Bob Johnson', email: 'bob@example.com', date: '2025-03-06', status: 'Pending', total: '$56.75', items: 2 },
      { id: '1004', customer: 'Alice Brown', email: 'alice@example.com', date: '2025-03-06', status: 'Shipped', total: '$210.25', items: 7 },
      { id: '1005', customer: 'Charlie Wilson', email: 'charlie@example.com', date: '2025-03-05', status: 'Delivered', total: '$45.00', items: 1 },
      { id: '1006', customer: 'Diana Martinez', email: 'diana@example.com', date: '2025-03-05', status: 'Cancelled', total: '$78.50', items: 4 },
      { id: '1007', customer: 'Edward Lee', email: 'edward@example.com', date: '2025-03-04', status: 'Delivered', total: '$112.75', items: 3 },
      { id: '1008', customer: 'Fiona Garcia', email: 'fiona@example.com', date: '2025-03-04', status: 'Processing', total: '$95.25', items: 2 },
      { id: '1009', customer: 'George Thompson', email: 'george@example.com', date: '2025-03-03', status: 'Shipped', total: '$150.00', items: 6 },
      { id: '1010', customer: 'Helen Davis', email: 'helen@example.com', date: '2025-03-03', status: 'Pending', total: '$67.50', items: 3 },
      { id: '1011', customer: 'Ivan Rodriguez', email: 'ivan@example.com', date: '2025-03-02', status: 'Delivered', total: '$89.99', items: 2 },
      { id: '1012', customer: 'Julia Kim', email: 'julia@example.com', date: '2025-03-02', status: 'Processing', total: '$130.50', items: 4 },
      { id: '1013', customer: 'Kevin Patel', email: 'kevin@example.com', date: '2025-03-01', status: 'Cancelled', total: '$45.75', items: 1 },
    ];
    
    setOrders(dummyOrders);
    setFilteredOrders(dummyOrders);
  }, []);

  useEffect(() => {
    let result = orders;
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query)
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

  const updateOrderStatus = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
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
              placeholder="Search by ID, customer name or email..."
              className="admin-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <div>{order.customer}</div>
                    <div className="admin-email">{order.email}</div>
                  </td>
                  <td>{order.date}</td>
                  <td>{order.items}</td>
                  <td>{order.total}</td>
                  <td>
                    <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    
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