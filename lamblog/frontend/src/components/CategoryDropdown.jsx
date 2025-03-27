import React from "react";

function CategoryDropdown({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="category-dropdown-custom">
      <p className="category-label">All Categories</p>
      
      {/* Scrollable Wrapper for Categories */}
      <div className="category-scroll-wrapper">
        <button
          className={`category-item ${selectedCategory === "" ? "active" : ""}`}
          onClick={() => onSelectCategory("")}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-item ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryDropdown;
