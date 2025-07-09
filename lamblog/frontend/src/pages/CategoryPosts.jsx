import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import DynamicArrow from "../components/DynamicArrow";
import {Lock } from "lucide-react";
import AuthContext from "../context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryPosts() {
  const { user } = useContext(AuthContext);
  const { name } = useParams(); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizedCategory = name
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts?category=${encodeURIComponent(normalizedCategory)}`);

           // Sort by createdAt (newest first)
           const sortedPosts = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
           setPosts(sortedPosts);

      } catch (err) {
        console.error("Failed to fetch posts by category", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [normalizedCategory]);

  return (
    <div className="category-posts-page">
      <div className="category-header-row">
  <BackArrow />
  <h2 className="category-title-text">
    All Posts in <span style={{ color: "#6a1bbd" }}>#{normalizedCategory}</span>
  </h2>
  <DynamicArrow />
</div>


      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts found under this category.</p>
      ) : (
        <div className="category-posts-container">
          {posts.map((post) => {
  const isLocked = post.isPremium && (!user || !user.isSubscriber);
  const target   = isLocked ? "/subscribe" : `/post/${post._id}`;

  return (
    <Link to={target} key={post._id} className="category-post-card">
      {/* --- Image / lock overlay --- */}
      {post.image && (
        <div
          className={`fixed-image-wrapper2 ${isLocked ? "premium-locked" : ""}`}
        >
          <img
            src={post.image}
            alt="Post"
            className={`fixed-image2 ${isLocked ? "blurred-content" : ""}`}
          />

          {isLocked && (
            <div className="locked-banner small" onClick={(e) => e.stopPropagation()}>
              <Lock size={14} style={{ marginRight: "6px" }} />
              Subscribe to view
            </div>
          )}
        </div>
      )}

      {/* --- Text --- */}
      <div className="premium-page-card-content">
        <p className="premium-page-author">@{post.author.username}</p>
        <h3 className="premium-page-title">#{post.title}</h3>
        <p className="premium-page-snippet">
          {post.content.substring(0, 80)}…
        </p>
        <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
        <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
      </div>
    </Link>
  );
})}
        </div>
      )}
      <BottomNav />
    </div>
  );
}

export default CategoryPosts;
