import React from "react";
import { Link } from "react-router-dom";

function CategoryDropdown({ categories, selectedCategory, onSelectCategory, onClose }) {
  return (
    <div className="category-dropdown-custom">
      <p className="category-label">Top Categories</p>

      <div className="category-scroll-wrapper">


        {categories.slice(0, 7).map((cat) => (
          <button
            key={cat}
            className={`category-item ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}

        {/* ✅ View All Categories Nav */}
              <Link
        to="/categories"
        className="view-all-categories-link"
        onClick={onClose} // explicitly close the sidebar
      >
        View All &rarr;
      </Link>

      </div>
    </div>
  );
}

export default CategoryDropdown;
