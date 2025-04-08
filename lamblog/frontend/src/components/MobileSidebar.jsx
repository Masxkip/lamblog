import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react"; // Close icon
import CategoryDropdown from "./CategoryDropdown";
import { useEffect, useState } from "react";
import axios from "axios";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";


const API_URL = import.meta.env.VITE_BACKEND_URL;


function MobileSidebar({ isOpen, onClose }) {

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);
  const { user, logout } = useContext(AuthContext);



  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts`);
        const unique = [...new Set(res.data.map((post) => post.category))];
        setCategories(unique);
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    };
  
    fetchCategories();
  }, []);


  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/trending/posts`);
        setTrendingPosts(res.data);
      } catch (err) {
        console.error("Error fetching trending posts", err);
      }
    };
  
    fetchTrending();
  }, []);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onClose();
      }
    };
  
    window.addEventListener("resize", handleResize);
  
    return () => window.removeEventListener("resize", handleResize);
  }, [onClose]);
  


  return (
    <div className={`mobile-sidebar ${isOpen ? "show" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        <X size={32} />
      </button>

      <div className="mobile-sidebar-content">
        {/* Placeholder content for now */}
        <CategoryDropdown
  categories={categories}
  selectedCategory={selectedCategory}
  onSelectCategory={setSelectedCategory}
  onClose={onClose}
/>



        <div className="mobile-trending-section">
          <h3># Trending Posts</h3>
          {trendingPosts.map((post) => (
            <Link
              to={`/post/${post._id}`}
              key={post._id}
              onClick={onClose}
              className="trending-item"
            >
              # {post.title}
            </Link>
          ))}
        </div>



<div className="mobile-auth-links">
  {!user ? (
    <>
      <Link to="/login" onClick={onClose} className="auth-link">Login</Link>
      <Link to="/register" onClick={onClose} className="auth-link">Register</Link>
    </>
  ) : (
    <>
      <button className="auth-link logout" onClick={() => { logout(); onClose(); }}>
         Logout
      </button>
      <hr style={{ marginTop: "30px", border: "1px solid #444" }} />

    </>
  )}
</div>
      </div>
    </div>
  );
}

export default MobileSidebar;
