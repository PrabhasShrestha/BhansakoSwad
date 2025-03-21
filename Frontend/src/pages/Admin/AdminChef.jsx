import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin/AdminChefs.css';
import AdminSidebar from '../../components/AdminSidebar';

const ChefApproval = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch chefs from backend
  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/chef/chef");
      setChefs(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching chefs:", error);
      setError("Failed to load chefs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Approve or Reject a Chef
  const handleApproval = async (id, newStatus) => {
    try {
      await axios.post(`http://localhost:3000/api/chef/${id}/status`, { status: newStatus });
      setChefs(chefs.map(chef => (chef.id === id ? { ...chef, status: newStatus } : chef)));
    } catch (error) {
      console.error("Error updating chef status:", error);
      alert(error.response?.data?.msg || "Error updating chef status");
    }
  };

  // Verify Chef Documents
  const handleDocumentVerification = async (id) => {
    try {
      await axios.post(`http://localhost:3000/api/chef/${id}/verify`);
      setChefs(chefs.map(chef => (chef.id === id ? { ...chef, documents: 'Verified' } : chef)));
    } catch (error) {
      console.error("Error verifying documents:", error);
      alert(error.response?.data?.msg || "Error verifying documents");
    }
  };

  // Filter and search functionality
  const filteredChefs = chefs.filter(chef => {
    const matchesSearch = chef.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         chef.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chef.status === statusFilter;
    
    const matchesDocument = documentFilter === 'all' || 
                          (documentFilter === 'verified' && chef.documents === 'Verified') ||
                          (documentFilter === 'pending' && chef.documents === 'Pending');
    
    return matchesSearch && matchesStatus && matchesDocument;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChefs = filteredChefs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredChefs.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Truncate text for better display
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-dashboard">
          <div className="admin-header">
            <h1>Chef Approval Management</h1>
          </div>
          
          <div className="admin-table-container">
            <div className="admin-table-header">
              <div className="admin-search">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search by name or nationality..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                
              </div>
              
              <div className="admin-filter-group">
                <select 
                  className="admin-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <select 
                  className="admin-filter-select"
                  value={documentFilter}
                  onChange={(e) => setDocumentFilter(e.target.value)}
                >
                  <option value="all">All Documents</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="admin-loading">
                <div className="admin-loading-spinner"></div>
              </div>
            ) : error ? (
              <div className="admin-empty-state">
                <div className="admin-empty-state-icon">⚠️</div>
                <div className="admin-empty-state-text">{error}</div>
              </div>
            ) : filteredChefs.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-state-icon">🔍</div>
                <div className="admin-empty-state-text">No chefs match your search criteria</div>
              </div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Nationality</th>
                      <th>About Chef</th>
                      <th>Certificate</th>
                      <th>Documents</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentChefs.map(chef => (
                      <tr 
                        key={chef.id}
                        className={`admin-row-${chef.status}`}
                      >
                        <td>{chef.id}</td>
                        <td>{chef.name}</td>
                        <td>{chef.nationality}</td>
                        <td>{truncateText(chef.about_you, 50)}</td>

                        {/* Certificate Column: Shows View PDF Button if Available */}
                        <td>
                          {chef.certificate ? (
                            <a 
                              href={`http://localhost:3000/uploads/chefs/${chef.certificate}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="admin-button view-pdf"
                            >
                              View PDF
                            </a>
                          ) : (
                            <span className="admin-document-status pending">No Certificate</span>
                          )}
                        </td>

                        {/* Document Verification Column */}
                        <td>
                          <span className={`admin-document-status ${chef.documents.toLowerCase()}`}>
                            {chef.documents}
                          </span>
                          {chef.documents === 'Pending' && chef.certificate && (
                            <button className="admin-button verify" onClick={() => handleDocumentVerification(chef.id)}>
                              Verify
                            </button>
                          )}
                        </td>

                        {/* Status Column */}
                        <td>
                          <span className={`admin-status ${chef.status}`}>
                            {chef.status.charAt(0).toUpperCase() + chef.status.slice(1)}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="admin-actions">
                          {chef.status === 'pending' && (
                            <>
                              <button 
                                className="admin-button approve" 
                                onClick={() => handleApproval(chef.id, 'approved')}
                                disabled={chef.documents !== 'Verified' || !chef.certificate}
                                title={chef.documents !== 'Verified' || !chef.certificate ? 
                                  "Documents must be verified and certificate must be provided" : ""}
                              >
                                Approve
                              </button>
                              <button 
                                className="admin-button reject" 
                                onClick={() => handleApproval(chef.id, 'rejected')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {chef.status === 'approved' && (
                            <button className="admin-button reject" onClick={() => handleApproval(chef.id, 'rejected')}>
                              Revoke
                            </button>
                          )}
                          {chef.status === 'rejected' && (
                            <button 
                              className="admin-button approve" 
                              onClick={() => handleApproval(chef.id, 'approved')}
                              disabled={chef.documents !== 'Verified' || !chef.certificate}
                              title={chef.documents !== 'Verified' || !chef.certificate ? 
                                "Documents must be verified and certificate must be provided" : ""}
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="admin-pagination">
                    <button 
                      className="admin-pagination-button" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        className={`admin-pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                        onClick={() => paginate(index + 1)}
                      >
                        {index + 1}
                      </button>
                    ))}
                    
                    <button 
                      className="admin-pagination-button" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                    
                    <span className="admin-pagination-info">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredChefs.length)} of {filteredChefs.length} chefs
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefApproval;