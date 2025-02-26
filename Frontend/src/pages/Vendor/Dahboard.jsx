import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../components/chartConfig';
import Sidebar from '../../components/Sidebar';
import '../../styles/Vendor/Dashboard.css';
import { Line, Doughnut } from 'react-chartjs-2';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [netEarnings, setNetEarnings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [weeklySales, setWeeklySales] = useState([]);
  const vendorId = localStorage.getItem("vendorId"); // Get vendor ID

  useEffect(() => {
    const fetchOrders = async () => {
      if (!vendorId) {
        console.error("No Vendor ID found!");
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3000/api/orders/vendor/${vendorId}`);
        const ordersData = response.data.orders;

        setOrders(ordersData);

        // Calculate Total Earnings
        const calculatedNetEarnings = ordersData.reduce((sum, order) => sum + order.total_amount, 0);
        setNetEarnings(calculatedNetEarnings);
        const taxAmount = calculatedNetEarnings * 0.13;
        const platformFee = calculatedNetEarnings * 0.07;
        const calculatedTotalEarnings = calculatedNetEarnings - (taxAmount + platformFee);


        setTotalEarnings(calculatedTotalEarnings);

        // Process Weekly Sales (Assuming backend orders have 'order_date' field)
        const salesMap = {}; 
        ordersData.forEach(order => {
          const date = new Date(order.order_date).toLocaleDateString();
          salesMap[date] = (salesMap[date] || 0) + order.total_amount;
        });

        // Format weekly sales data
        const formattedSales = Object.entries(salesMap).map(([date, total]) => ({
          date, total
        })).slice(-7); 

        setWeeklySales(formattedSales);

      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, [vendorId]);

  // Prepare Data for Charts
  const lineData = {
    labels: weeklySales.map(sale => sale.date),
    datasets: [
      {
        label: 'Earning Sales (Rs)',
        data: weeklySales.map(sale => sale.total),
        borderColor: '#FFA500',
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const doughnutData = {
    labels: ['Income', 'Taxes (13%)', 'Platform Fees (7%)'],
    datasets: [
      {
        label: 'Earnings Breakdown',
        data: [
          totalEarnings,  // Income after deductions
          netEarnings * 0.13,  // Taxes (13%)
          netEarnings * 0.07   // Platform Fees (7%)
        ],
        backgroundColor: ['#4CAF50', '#FFC107', '#FF5722'],
      },
    ],
  };
  
  

  return (
    <div className="dashboard-grid">
      <Sidebar/>

      {/* Main Content */}
      <div className="dashboard-main-content">
        <header className="dashboard-header">
          <h1 className="dashboard-heading">Dashboard</h1>
        </header>

        <div className="dashboard-charts">
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Sales Reports</h2>
            <Line data={lineData} />
          </div>

          <div className="dashboard-card">
            <h2 className="dashboard-card-title">Earnings</h2>
            <Doughnut data={doughnutData} />
            <div className="dashboard-earnings">
              <p>Total Balance: <span className="dashboard-balance">Rs {totalEarnings.toFixed(2)}</span></p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Recent Orders</h2>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Product</th>
                <th>Status</th>
                <th>Total (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>{order.product_name}</td>
                    <td>{order.status}</td>
                    <td>Rs {order.total_amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>No Orders Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
