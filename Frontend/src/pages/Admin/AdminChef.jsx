import React, { useState } from 'react';
import '../../styles/Admin/AdminChefs.css';
import AdminSidebar from '../../components/AdminSidebar';

const ChefApproval = () => {
  // Mock data - in a real app, this would come from an API
  const [chefs, setChefs] = useState([
    { id: 1, name: 'Gordon Ramsay', specialty: 'International', experience: '20 years', documents: 'Verified', status: 'pending' },
    { id: 2, name: 'Jamie Oliver', specialty: 'Italian', experience: '15 years', documents: 'Verified', status: 'approved' },
    { id: 3, name: 'Nigella Lawson', specialty: 'Desserts', experience: '18 years', documents: 'Pending', status: 'pending' },
    { id: 4, name: 'Bobby Flay', specialty: 'American', experience: '22 years', documents: 'Verified', status: 'rejected' },
    { id: 5, name: 'Rachael Ray', specialty: 'Quick Meals', experience: '12 years', documents: 'Pending', status: 'pending' },
  ]);

  const handleApproval = (id, newStatus) => {
    setChefs(chefs.map(chef => 
      chef.id === id ? { ...chef, status: newStatus } : chef
    ));
  };

  const handleDocumentVerification = (id) => {
    setChefs(chefs.map(chef => 
      chef.id === id ? { ...chef, documents: 'Verified' } : chef
    ));
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Chef Approval Management</h1>
        <div className="admin-user-info">
          <span className="admin-user-name">Admin User</span>
          <div className="admin-avatar"></div>
        </div>
      </div>
      
      <div className="admin-table-container">
        <div className="admin-table-header">
          <div className="admin-search">
            <input type="text" placeholder="Search chefs..." className="admin-search-input" />
            <button className="admin-search-button">Search</button>
          </div>
          <div className="admin-filter">
            <select className="admin-filter-select">
              <option value="all">All Chefs</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Specialty</th>
              <th>Experience</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chefs.map(chef => (
              <tr key={chef.id} className={`admin-row-${chef.status}`}>
                <td>{chef.id}</td>
                <td>{chef.name}</td>
                <td>{chef.specialty}</td>
                <td>{chef.experience}</td>
                <td>
                  <span className={`admin-document-status admin-document-${chef.documents === 'Verified' ? 'verified' : 'pending'}`}>
                    {chef.documents}
                  </span>
                  {chef.documents === 'Pending' && (
                    <button 
                      className="admin-button admin-document-verify" 
                      onClick={() => handleDocumentVerification(chef.id)}
                    >
                      Verify
                    </button>
                  )}
                </td>
                <td>
                  <span className={`admin-status admin-status-${chef.status}`}>
                    {chef.status.charAt(0).toUpperCase() + chef.status.slice(1)}
                  </span>
                </td>
                <td className="admin-actions">
                  {chef.status === 'pending' && (
                    <>
                      <button 
                        className="admin-button admin-approve" 
                        onClick={() => handleApproval(chef.id, 'approved')}
                        disabled={chef.documents !== 'Verified'}
                      >
                        Approve
                      </button>
                      <button 
                        className="admin-button admin-reject" 
                        onClick={() => handleApproval(chef.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {chef.status === 'approved' && (
                    <button 
                      className="admin-button admin-reject" 
                      onClick={() => handleApproval(chef.id, 'rejected')}
                    >
                      Revoke
                    </button>
                  )}
                  {chef.status === 'rejected' && (
                    <button 
                      className="admin-button admin-approve" 
                      onClick={() => handleApproval(chef.id, 'approved')}
                      disabled={chef.documents !== 'Verified'}
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="admin-pagination">
          <button className="admin-pagination-button">Previous</button>
          <span className="admin-pagination-info">Page 1 of 2</span>
          <button className="admin-pagination-button">Next</button>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default ChefApproval;