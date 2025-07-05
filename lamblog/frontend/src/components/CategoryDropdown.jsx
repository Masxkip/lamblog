import React from "react";
import { Link, useNavigate } from "react-router-dom";

function CategoryDropdown({ categories, selectedCategory, onSelectCategory, onClose }) {
  const navigate = useNavigate();

  const handleCategoryClick = (cat) => {
    if (onSelectCategory) onSelectCategory(cat); // still allow state handling
    if (onClose) onClose(); // close sidebar if needed
    navigate(`/category/${encodeURIComponent(cat)}`); // push to category page
  };

  return (
    <div className="category-dropdown-custom">
      <p className="category-label">Top Categories</p>

      <div className="category-scroll-wrapper">
        {categories.slice(0, 7).map((cat) => (
          <button
            key={cat}
            className={`category-item ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}


     <Link
    to="/categories"
    className="view-all-premium-btn"
  >
    View all premium posts →
  </Link>

      </div>
    </div>
  );
}

export default CategoryDropdown;
