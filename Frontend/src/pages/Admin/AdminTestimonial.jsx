// AdminTestimonials.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Admin/AdminTestimonial.css';
import AdminSidebar from '../../components/AdminSidebar';
import userImage from '../../assets/user.png';
const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch testimonials from backend API when component mounts
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        // Adjust the endpoint to your actual admin testimonials endpoint
        const response = await axios.get('http://localhost:3000/api/gettestimonials');
        setTestimonials(response.data.testimonials);
        setFilteredTestimonials(response.data.testimonials);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      }
    };

    fetchTestimonials();
  }, []);

  // Update filtered testimonials based on filter and search query
  useEffect(() => {
    let result = testimonials;

    if (statusFilter !== 'all') {
      result = result.filter(testimonial => testimonial.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(testimonial =>
        testimonial.user_name.toLowerCase().includes(query) ||
        testimonial.text.toLowerCase().includes(query)
      );
    }

    setFilteredTestimonials(result);
    setCurrentPage(1);
  }, [statusFilter, searchQuery, testimonials]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Function to update testimonial status (approve/reject)
  const updateTestimonialStatus = async (id, newStatus) => {
    try {
      await axios.post(`http://localhost:3000/api/testimonials/${id}`, { status: newStatus });
      setTestimonials(testimonials.map(testimonial =>
        testimonial.id === id ? { ...testimonial, status: newStatus } : testimonial
      ));
    } catch (error) {
      console.error('Error updating testimonial status:', error);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-testimonials">
          <div className="admin-header">
            <h1 className="admin-title">Testimonials</h1>
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
                  <option value="all">All Testimonials</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="admin-search-group">
                <input
                  type="text"
                  placeholder="Search by name or content..."
                  className="admin-search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="admin-testimonials-grid">
              {currentItems.map(testimonial => (
                <div key={testimonial.id} className={`admin-testimonial-card admin-testimonial-${testimonial.status}`}>
                  <div className="admin-testimonial-header">
                    <div className="admin-testimonial-avatar">
                      <img
                        src={testimonial.user_image
                                            ? `http://localhost:3000${testimonial.user_image}` // Use user's profile image if available
                                            : userImage // Fallback to default user image (imported)
                                        }
                        alt={testimonial.user_name}
                      />
                    </div>
                    <div className="admin-testimonial-info">
                      <h3 className="admin-testimonial-name">{testimonial.user_name}</h3>
                      {/* Optionally display other fields such as role if available */}
                    </div>
                    <div className="admin-testimonial-date">
                      {testimonial.date || ''}
                    </div>
                  </div>
                  <div className="admin-testimonial-content">
                    <p>{testimonial.text}</p>
                  </div>
                  <div className="admin-testimonial-footer">
                    <div className="admin-testimonial-status">
                      <span className={`admin-status admin-status-${testimonial.status}`}>
                        {testimonial.status.charAt(0).toUpperCase() + testimonial.status.slice(1)}
                      </span>
                    </div>
                    <div className="admin-testimonial-actions">
                      {testimonial.status === 'pending' && (
                        <>
                          <button 
                            className="admin-action-button admin-approve-button"
                            onClick={() => updateTestimonialStatus(testimonial.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button 
                            className="admin-action-button admin-reject-button"
                            onClick={() => updateTestimonialStatus(testimonial.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {testimonial.status === 'approved' && (
                        <button 
                          className="admin-action-button admin-reject-button"
                          onClick={() => updateTestimonialStatus(testimonial.id, 'rejected')}
                        >
                          Reject
                        </button>
                      )}
                      {testimonial.status === 'rejected' && (
                        <button 
                          className="admin-action-button admin-approve-button"
                          onClick={() => updateTestimonialStatus(testimonial.id, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-pagination">
              <button 
                className="admin-pagination-button" 
                disabled={currentPage === 1}
                onClick={() => paginate(currentPage - 1)}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.ceil(filteredTestimonials.length / itemsPerPage) }).map((_, index) => (
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
                disabled={currentPage === Math.ceil(filteredTestimonials.length / itemsPerPage)}
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

export default AdminTestimonials;
