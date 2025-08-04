import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import DynamicArrow from "../components/DynamicArrow";
import AuthContext from "../context/AuthContext";
import { Check, Lock } from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryPosts() {
  const { user } = useContext(AuthContext);
  const { name } = useParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  const normalizedCategory = name
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Fetch posts when category changes
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts?category=${encodeURIComponent(normalizedCategory)}`);
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

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [normalizedCategory]);

  // Infinite scroll observer
  const observer = useRef();

  const lastPostRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < posts.length) {
        setTimeout(() => {
          setVisibleCount((prev) => prev + 6);
        }, 800); // Simulated delay
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, visibleCount, posts.length]);

  const paginatedPosts = posts.slice(0, visibleCount);

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
          {paginatedPosts.map((post, index) => {
            const isLocked = post.isPremium && (!user || !user.isSubscriber);
            const isLast = index === paginatedPosts.length - 1;
            const target = isLocked ? "/subscribe" : `/post/${post._id}`;

            return (
              <div
                key={post._id}
                ref={isLast ? lastPostRef : null}
                className="category-post-card"
              >
                <Link to={target}>
                  {post.image && (
                    <div className={`fixed-image-wrapper2 ${isLocked ? "premium-locked" : ""}`}>
                      <img
                        src={post.image}
                        alt="Post"
                        className={`fixed-image2 ${isLocked ? "blurred-content" : ""}`}
                      />
                      {isLocked && (
                        <div className="locked-banner small">
                          <Lock size={14} style={{ marginRight: "6px" }} />
                          Subscribe to view
                        </div>
                      )}
                    </div>
                  )}

                  <div className="premium-page-card-content">
                    <div className="profile-link verified-user">
                      <span className="slider-post-card-author">
                        @{post.author.username}
                      </span>
                      {post.author?.isSubscriber && (
                        <span className="verified-circle">
                          <Check size={12} color="white" strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <h3 className="premium-page-title">#{post.title}</h3>
                    <p className="premium-page-snippet">
                      {post.content.substring(0, 80)}...
                    </p>
                    <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
                    <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {visibleCount < posts.length && (
        <div className="infinite-spinner">
          <span className="spinner" />
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default CategoryPosts;
