import React from 'react';
import { FaTimes } from 'react-icons/fa';
import translations from "../components/nepaliTranslations.json";

const ViewRecipeModal = ({ isOpen, onClose, recipe, translated, toggleTranslation }) => {
  if (!isOpen || !recipe) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-container admin-view-recipe-modal">
        <div className="admin-modal-header">
          <h2>Recipe Details: {translated ? recipe.title_ne || recipe.title : recipe.title}</h2>
          <button 
            className="admin-modal-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className="admin-view-modal-content">
          <div className="admin-view-recipe-image">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} />
            ) : (
              <div className="admin-no-image-placeholder">No Image Available</div>
            )}
          </div>
          <div className="admin-view-recipe-details">
            <div className="admin-view-recipe-header">
              <h3>{translated ? recipe.title_ne || recipe.title : recipe.title}</h3>
              <div className="admin-view-recipe-badges">
                <span className="admin-badge admin-badge-blue">
                  {recipe.category}
                </span>
                <span className={`admin-badge ${
                  recipe.difficulty === 'Easy' ? 'admin-badge-green' :
                  recipe.difficulty === 'Medium' ? 'admin-badge-orange' :
                  'admin-badge-red'
                }`}>
                  {recipe.difficulty}
                </span>
              </div>
            </div>
            <div className="admin-view-recipe-section">
              <h4>{translated ? "खाना पकाउने समय" : "Cooking Time"}</h4>
              <p>{recipe.cooking_time || (translated ? "उल्लेख गरिएको छैन" : "Not specified")}</p>
            </div>
            <div className="admin-view-recipe-section">
              <h4>{translated ? "सामग्रीहरू" : "Ingredients"}</h4>
              <ul>
                {recipe.ingredients?.map((ing, index) => (
                  <li key={index}>
                    {translated ? (ing.amount_ne || ing.amount) : ing.amount}{' '}
                    {translated ? (ing.ingredient_ne || ing.ingredient) : ing.ingredient}
                  </li>
                ))}
              </ul>
            </div>
            <div className="admin-view-recipe-section">
              <h4>{translated ? translations.cookingSteps : "Cooking Steps"}</h4>
              {recipe.cookingSteps?.length > 0 ? (
                <>
                  {recipe.cookingSteps.map((step, index) => (
                    <div className="admin-method-step" key={index}>
                      <h4>
                        {translated ? translations.step : "Step"}{' '}
                        {translated ? translations.nepaliNumbers[index + 1] : index + 1}
                      </h4>
                      <p>{translated && step.step_ne ? step.step_ne : step.step}</p>
                    </div>
                  ))}
                </>
              ) : (
                <p>{translated ? "कुनै चरणहरू उपलब्ध छैनन्" : "No steps available"}</p>
              )}
            </div>
            <div className="admin-view-recipe-section">
              <h4>{translated ? "पोषण जानकारी" : "Nutrition Information"}</h4>
              <table className="admin-view-nutrition-table">
                <tbody>
                  {recipe.nutritionInfo?.map((info, index) => (
                    <tr key={index}>
                      <td>{translated ? (info.nutrient_ne || info.nutrient) : info.nutrient}</td>
                      <td>{translated ? (info.value_ne || info.value) : info.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-view-recipe-footer">
              <div className="admin-view-recipe-metadata">
                <p>{translated ? "पेश गर्ने: " : "Submitted By: "} {recipe.submittedBy}</p>
                <p>{translated ? "थपिएको मिति: " : "Date Added: "} {new Date(recipe.created_at).toLocaleDateString()}</p>
                <button
                  className="translate-btn"                      
                  onClick={toggleTranslation}                      
                >
                  {translated ? "Translate to English" : translations.translateToNepali}                       
                </button>                   
              </div>
            </div>
          </div>
        </div>
        <div className="admin-modal-actions">
          <button 
            className="admin-btn-secondary"
            onClick={onClose}
          >
            {translated ? "बन्द गर्नुहोस्" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewRecipeModal;