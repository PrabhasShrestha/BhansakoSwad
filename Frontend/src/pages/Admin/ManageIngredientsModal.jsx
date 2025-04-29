import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import '../../styles/Admin/ManageIngredientsModal.css';

const ManageIngredientsModal = ({ isOpen, onClose }) => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    name_ne: '',
    alternatives: [],
  });
  const [newAlternative, setNewAlternative] = useState({
    name: '',
    name_ne: '',
  });
  const [editMode, setEditMode] = useState(null);
  const [editIngredient, setEditIngredient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchIngredients();
    }
  }, [isOpen]);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/recipe/ingredients', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setIngredients(response.data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Failed to fetch ingredients');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient({
      ...newIngredient,
      [name]: value,
    });
  };

  const handleAlternativeChange = (e) => {
    const { name, value } = e.target;
    setNewAlternative({
      ...newAlternative,
      [name]: value,
    });
  };

  const addAlternative = () => {
    if (newAlternative.name.trim() === '') {
      toast.warning('Alternative name cannot be empty');
      return;
    }

    setNewIngredient({
      ...newIngredient,
      alternatives: [
        ...newIngredient.alternatives,
        { ...newAlternative, id: Date.now() },
      ],
    });
    setNewAlternative({ name: '', name_ne: '' });
  };

  const removeAlternative = (id) => {
    setNewIngredient({
      ...newIngredient,
      alternatives: newIngredient.alternatives.filter((alt) => alt.id !== id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newIngredient.name.trim() === '') {
      toast.warning('Ingredient name cannot be empty');
      return;
    }

    try {
      const payload = {
        name: newIngredient.name,
        name_ne: newIngredient.name_ne,
        alternatives: newIngredient.alternatives.map(alt => ({
          name: alt.name,
          name_ne: alt.name_ne
        }))
      };

      await axios.post('http://localhost:3000/api/recipe/ingredients/create', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      toast.success('Ingredient added successfully');
      setNewIngredient({
        name: '',
        name_ne: '',
        alternatives: [],
      });
      fetchIngredients();
    } catch (error) {
      console.error('Error adding ingredient:', error);
      toast.error('Failed to add ingredient');
    }
  };

  const startEdit = (ingredient) => {
    setEditMode(ingredient.id);
    setEditIngredient({
      ...ingredient,
      alternatives: ingredient.alternatives || [],
    });
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditIngredient(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditIngredient({
      ...editIngredient,
      [name]: value,
    });
  };

  const handleEditAlternativeChange = (index, field, value) => {
    const updatedAlternatives = [...editIngredient.alternatives];
    updatedAlternatives[index] = {
      ...updatedAlternatives[index],
      [field]: value,
    };
    setEditIngredient({
      ...editIngredient,
      alternatives: updatedAlternatives,
    });
  };

  const addEditAlternative = () => {
    setEditIngredient({
      ...editIngredient,
      alternatives: [
        ...editIngredient.alternatives,
        { name: '', name_ne: '', id: Date.now() },
      ],
    });
  };

  const removeEditAlternative = (index) => {
    const updatedAlternatives = [...editIngredient.alternatives];
    updatedAlternatives.splice(index, 1);
    setEditIngredient({
      ...editIngredient,
      alternatives: updatedAlternatives,
    });
  };

  const saveEdit = async () => {
    if (editIngredient.name.trim() === '') {
      toast.warning('Ingredient name cannot be empty');
      return;
    }

    try {
      const payload = {
        name: editIngredient.name,
        name_ne: editIngredient.name_ne,
        alternatives: editIngredient.alternatives.map(alt => ({
          name: alt.name,
          name_ne: alt.name_ne
        }))
      };

      console.log('Updating ingredient with payload:', payload);

      const response = await axios.post(`http://localhost:3000/api/recipe/updateingredients/${editIngredient.id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      console.log('Update response:', response.data);

      toast.success('Ingredient updated successfully');
      setEditMode(null);
      setEditIngredient(null);
      fetchIngredients();
    } catch (error) {
      console.error('Error updating ingredient:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(`Failed to update ingredient: ${error.response.data.message || 'Unknown error'}`);
      } else {
        toast.error('Failed to update ingredient');
      }
    }
  };

  const deleteIngredient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/recipe/ingredients/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      toast.success('Ingredient deleted successfully');
      fetchIngredients();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast.error('Failed to delete ingredient');
    }
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (ingredient.name_ne && ingredient.name_ne.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="manage-ingredient-modal-overlay">
      <div className="manage-ingredient-modal">
        <div className="manage-ingredient-modal-header">
          <h2>Manage Ingredients</h2>
          <button className="manage-ingredient-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="manage-ingredient-modal-content">
          <div className="manage-ingredient-form-section">
            <h3>Add New Ingredient</h3>
            <form onSubmit={handleSubmit} className="manage-ingredient-form">
              <div className="manage-ingredient-form-row">
                <div className="manage-ingredient-form-group">
                  <label>Name (English)</label>
                  <input
                    type="text"
                    name="name"
                    value={newIngredient.name}
                    onChange={handleInputChange}
                    placeholder="Enter ingredient name"
                  />
                </div>
                <div className="manage-ingredient-form-group">
                  <label>Name (Nepali)</label>
                  <input
                    type="text"
                    name="name_ne"
                    value={newIngredient.name_ne}
                    onChange={handleInputChange}
                    placeholder="Enter ingredient name in Nepali"
                  />
                </div>
              </div>

              <div className="manage-ingredient-alternatives-section">
                <h4>Alternatives</h4>
                <div className="manage-ingredient-alternatives-form">
                  <div className="manage-ingredient-form-row">
                    <div className="manage-ingredient-form-group">
                      <input
                        type="text"
                        name="name"
                        value={newAlternative.name}
                        onChange={handleAlternativeChange}
                        placeholder="Alternative name (English)"
                      />
                    </div>
                    <div className="manage-ingredient-form-group">
                      <input
                        type="text"
                        name="name_ne"
                        value={newAlternative.name_ne}
                        onChange={handleAlternativeChange}
                        placeholder="Alternative name (Nepali)"
                      />
                    </div>
                    <button
                      type="button"
                      className="manage-ingredient-add-alternative-btn"
                      onClick={addAlternative}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                {newIngredient.alternatives.length > 0 && (
                  <div className="manage-ingredient-alternatives-list">
                    <h5>Added Alternatives</h5>
                    <ul>
                      {newIngredient.alternatives.map((alt) => (
                        <li key={alt.id} className="manage-ingredient-alternative-item">
                          <div className="manage-ingredient-alternative-info">
                            <span>{alt.name}</span>
                            {alt.name_ne && (
                              <span className="manage-ingredient-alternative-nepali">{alt.name_ne}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="manage-ingredient-remove-alternative-btn"
                            onClick={() => removeAlternative(alt.id)}
                          >
                            <FaTrash />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="manage-ingredient-form-actions">
                <button type="submit" className="manage-ingredient-submit-btn">
                  <FaPlus /> Add Ingredient
                </button>
              </div>
            </form>
          </div>

          <div className="manage-ingredient-list-section">
            <h3>Ingredients List</h3>
            <div className="manage-ingredient-filters">
              <div className="manage-ingredient-search-container">
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="manage-ingredient-search-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="manage-ingredient-loading-indicator">Loading ingredients...</div>
            ) : (
              <div className="manage-ingredient-list">
                {filteredIngredients.length > 0 ? (
                  filteredIngredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className={`manage-ingredient-card ${
                        editMode === ingredient.id ? "manage-ingredient-editing" : ""
                      }`}
                    >
                      {editMode === ingredient.id ? (
                        <div className="manage-ingredient-edit-form">
                          <div className="manage-ingredient-form-row">
                            <div className="manage-ingredient-form-group">
                              <label>Name (English)</label>
                              <input
                                type="text"
                                name="name"
                                value={editIngredient.name}
                                onChange={handleEditChange}
                              />
                            </div>
                            <div className="manage-ingredient-form-group">
                              <label>Name (Nepali)</label>
                              <input
                                type="text"
                                name="name_ne"
                                value={editIngredient.name_ne || ''}
                                onChange={handleEditChange}
                              />
                            </div>
                          </div>

                          <div className="manage-ingredient-edit-alternatives">
                            <h5>Alternatives</h5>
                            {editIngredient.alternatives.map((alt, index) => (
                              <div key={index} className="manage-ingredient-edit-alternative-item">
                                <div className="manage-ingredient-form-row">
                                  <div className="manage-ingredient-form-group">
                                    <input
                                      type="text"
                                      value={alt.name}
                                      onChange={(e) => 
                                        handleEditAlternativeChange(index, 'name', e.target.value)
                                      }
                                      placeholder="Alternative name (English)"
                                    />
                                  </div>
                                  <div className="manage-ingredient-form-group">
                                    <input
                                      type="text"
                                      value={alt.name_ne || ''}
                                      onChange={(e) => 
                                        handleEditAlternativeChange(index, 'name_ne', e.target.value)
                                      }
                                      placeholder="Alternative name (Nepali)"
                                    />
                                  </div>
                                  <button 
                                    type="button"
                                    className="manage-ingredient-remove-btn"
                                    onClick={() => removeEditAlternative(index)}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button 
                              type="button"
                              className="manage-ingredient-add-alternative-btn"
                              onClick={addEditAlternative}
                            >
                              <FaPlus /> Add Alternative
                            </button>
                          </div>

                          <div className="manage-ingredient-edit-actions">
                            <button 
                              type="button"
                              className="manage-ingredient-save-btn"
                              onClick={saveEdit}
                            >
                              <FaSave /> Save
                            </button>
                            <button 
                              type="button"
                              className="manage-ingredient-cancel-btn"
                              onClick={cancelEdit}
                            >
                              <FaTimes /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="manage-ingredient-info">
                            <div className="manage-ingredient-header">
                              <h4 className="manage-ingredient-name">{ingredient.name}</h4>
                            </div>
                            {ingredient.name_ne && (
                              <div className="manage-ingredient-nepali">{ingredient.name_ne}</div>
                            )}

                            {ingredient.alternatives && ingredient.alternatives.length > 0 && (
                              <div className="manage-ingredient-alternatives">
                                <h5>Alternatives:</h5>
                                <ul>
                                  {ingredient.alternatives.map((alt, index) => (
                                    <li key={index}>
                                      <span>{alt.name}</span>
                                      {alt.name_ne && (
                                        <span className="manage-ingredient-alternative-nepali">{alt.name_ne}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="manage-ingredient-actions">
                            <button
                              className="manage-ingredient-edit-btn"
                              onClick={() => startEdit(ingredient)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="manage-ingredient-delete-btn"
                              onClick={() => deleteIngredient(ingredient.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="manage-ingredient-no-ingredients">
                    No ingredients found matching your search criteria
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageIngredientsModal;