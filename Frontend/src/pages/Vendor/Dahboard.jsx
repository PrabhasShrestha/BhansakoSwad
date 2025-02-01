import React from 'react';
import '../../components/chartConfig';
import Sidebar from '../../components/Sidebar'
import '../../styles/Vendor/Dashboard.css';
import { Line } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';

export default function Dashboard() {
  const lineData = {
    labels: ['Aug 24', 'Aug 25', 'Aug 26', 'Aug 27', 'Aug 28'],
    datasets: [
      {
        label: 'Earning Sales ($)',
        data: [12000, 15000, 10000, 20000, 25000],
        borderColor: '#FFA500',
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const doughnutData = {
    labels: ['Income', 'Taxes', 'Fees'],
    datasets: [
      {
        label: 'Earnings',
        data: [20656, 2650, 962],
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
              <p>Total Balance: <span className="dashboard-balance">$12,560</span></p>
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
                <th>Payment</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#45630</td>
                <td>Aug 15, 2020</td>
                <td>Backpack</td>
                <td className="dashboard-paid">Paid</td>
                <td>Delivered</td>
                <td>$56.00</td>
              </tr>
              <tr>
                <td>#45631</td>
                <td>Aug 15, 2020</td>
                <td>Speaker</td>
                <td className="dashboard-unpaid">Unpaid</td>
                <td>In Progress</td>
                <td>$132.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
