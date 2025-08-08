import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import { MoreHorizontal, Check, Lock } from "lucide-react";
import AuthContext from "../context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function AllCategories() {
  const { user } = useContext(AuthContext);
  const [categoriesData, setCategoriesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/posts/by-category?page=${page}&limit=3`);
      setCategoriesData(prev => [...prev, ...res.data.categories]);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const lastCategoryRef = useCallback(node => {
    if (loading || !hasMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  return (
    <div className="all-categories-page">
      <div className="category-searchbar-wrapper">
        <button className="back-icon" onClick={() => navigate(-1)}>
          <BackArrow />
        </button>
        <input
          type="text"
          placeholder="Search categories…"
          className="category-search-bar"
        />
      </div>

      {categoriesData.length === 0 && !loading && (
        <div className="no-posts-message">
          <p>No categories found.</p>
        </div>
      )}

      {categoriesData.map((catData, index) => {
        const isLast = index === categoriesData.length - 1;
        return (
          <section
            key={catData.category}
            ref={isLast ? lastCategoryRef : null}
            className="category-block"
          >
            <h2 className="category-title">#{catData.category}</h2>
            <div className="category-slider">
              {catData.posts.map(post => {
                const isLocked = post.isPremium && (!user || !user.isSubscriber);
                const target = isLocked ? "/subscribe" : `/post/${post._id}`;
                return (
                  <div className="slider-post-card" key={post._id}>
                    <Link to={target} className="slider-post-card-link">
                      <div className="slider-post-card-inner">
                        {post.image && (
                          <div className={`fixed-image-wrapper1 ${isLocked ? "premium-locked" : ""}`}>
                            <img src={post.image} alt={post.title} className="fixed-image1" />
                            {isLocked && (
                              <div className="locked-banner small">
                                <Lock size={14} style={{ marginRight: "6px" }} />
                                Subscribe to view
                              </div>
                            )}
                          </div>
                        )}
                        <div className="slider-post-card-content">
                          <div className="profile-link verified-user">
                            <span className="slider-post-card-author">@{post.author.username}</span>
                            {post.author?.isSubscriber && (
                              <span className="verified-circle">
                                <Check size={12} color="white" strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <h3 className="slider-post-card-title">#{post.title}</h3>
                          <p className="slider-post-card-snippet">{post.content.substring(0, 80)}...</p>
                          <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
                          <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
            <Link to={`/category/${encodeURIComponent(catData.category)}`} className="view-all-premium-btn">
              View All Posts →
            </Link>
            <hr className="category-divider" />
          </section>
        );
      })}

      {loading && (
        <div className="infinite-spinner">
          <span className="spinner" />
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default AllCategories;
