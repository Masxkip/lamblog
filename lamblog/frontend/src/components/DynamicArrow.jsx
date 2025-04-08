// DynamicArrow.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowRightCircle } from "lucide-react";


const API_URL = import.meta.env.VITE_BACKEND_URL;

function DynamicArrow() {
  const navigate = useNavigate();
  const { name } = useParams();
  const [categoriesOrder, setCategoriesOrder] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/categories`);
        const sorted = res.data
          .map(cat =>
            cat.trim().toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, c => c.toUpperCase())
          )
          .sort();
        setCategoriesOrder(sorted);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const currentCategory = name
    ? name.trim().toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : (categoriesOrder[0] || "");

  let currentIndex = categoriesOrder.indexOf(currentCategory);
  if (currentIndex === -1) currentIndex = 0;

  const nextIndex = (currentIndex + 1) % categoriesOrder.length;
  const nextCategory = categoriesOrder[nextIndex];

  const handleClick = () => {
    navigate(`/category/${encodeURIComponent(nextCategory)}`);
  };

  return (
    <button
      onClick={handleClick}
      className="next-arrow-button"
      aria-label="Next Category"
    >
      <ArrowRightCircle size={32} strokeWidth={2.5} className="lucid-icon" />
    </button>
  );
}

export default DynamicArrow;
