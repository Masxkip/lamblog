// AllCategories.jsx (updated with real backend pagination + error handling like Home.jsx)

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

  // Core state
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);

  // Search + trending
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);

  // For infinite scroll observer
  const observer = useRef();
  const errorTimeoutRef = useRef(null);

  const navigate = useNavigate();

  // Fetch posts from backend with pagination
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const queryParams = [`page=${page}`, `limit=15`]; // 15 posts ~ 3 categories
      if (searchTerm) queryParams.push(`search=${searchTerm}`);

      const res = await axios.get(`${API_URL}/api/posts?${queryParams.join("&")}`);

      setPosts((prev) => [...prev, ...res.data.posts]);
      setHasMore(res.data.hasMore);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(true);
      setPage((prev) => Math.max(prev - 1, 1));

      // Delay showing the error banner for 10s like Home.jsx
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(true);
        setLoading(false);
      }, 10000);
    }
  }, [page, searchTerm]);

  // Cleanup error timeout on unmount
  useEffect(() => {
    return () => clearTimeout(errorTimeoutRef.current);
  }, []);

  // Initial + paginated fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset when search changes
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [searchTerm]);

  // Fetch trending posts once
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/trending/posts`);
        setTrendingPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch trending posts", err);
      }
    };
    fetchTrending();
  }, []);

  // Group posts into categories
  const postsByCategory = {};
  posts.forEach((post) => {
    const formattedCategory = post.category
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (!postsByCategory[formattedCategory]) postsByCategory[formattedCategory] = [];
    postsByCategory[formattedCategory].push(post);
  });
  const categoryEntries = Object.entries(postsByCategory);

  // IntersectionObserver for loading next page after last category
  const lastCategoryRef = useCallback(
    (node) => {
      if (loading || error || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, error, hasMore]
  );

  return (
    <div className="all-categories-page">
      {/* Search bar */}
      <div className="category-searchbar-wrapper">
        <button className="back-icon" onClick={() => navigate(-1)}>
          <BackArrow />
        </button>

        <input
          type="text"
          placeholder="Search categories or titles…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="category-search-bar"
        />
      </div>

      {/* Search results heading */}
      {searchTerm && (
        <div className="search-results-heading">
          Showing {posts.length} result
          {posts.length !== 1 ? "s" : ""} for: <strong>"{searchTerm}"</strong>
        </div>
      )}

      {/* No posts */}
      {!loading && categoryEntries.length === 0 && !error && (
        <div className="no-posts-message">
          <p>No posts available for your search.</p>
        </div>
      )}

      {/* Categories list */}
      {categoryEntries.map(([category, catPosts], index) => {
        const isLast = index === categoryEntries.length - 1;
        return (
          <React.Fragment key={category}>
            <section
              className="category-block"
              ref={isLast ? lastCategoryRef : null}
            >
              <h2 className="category-title">#{category}</h2>

              <div className="category-slider">
                {catPosts.slice(0, 5).map((post) => {
                  const isLocked = post.isPremium && (!user || !user.isSubscriber);
                  const target = isLocked ? "/subscribe" : `/post/${post._id}`;

                  return (
                    <div className="slider-post-card" key={post._id}>
                      <Link to={target} className="slider-post-card-link">
                        <div className="slider-post-card-inner">
                          {/* Image */}
                          {post.image && (
                            <div
                              className={`fixed-image-wrapper1 ${isLocked ? "premium-locked" : ""}`}
                            >
                              <img
                                src={post.image.startsWith("http") ? post.image : `${API_URL}/${post.image}`}
                                alt={post.title}
                                className={`fixed-image1 ${isLocked ? "blurred-content" : ""}`}
                              />
                              {isLocked && (
                                <div className="locked-banner small">
                                  <Lock size={14} style={{ marginRight: "6px" }} />
                                  Subscribe to view
                                </div>
                              )}
                            </div>
                          )}

                          {/* Content */}
                          <div className="slider-post-card-content">
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
                            <h3 className="slider-post-card-title">#{post.title}</h3>
                            <p className="slider-post-card-snippet">
                              {post.content.substring(0, 80)}...
                            </p>
                            <p>
                              <strong>Category:</strong> {post.category || "Uncategorized"}
                            </p>
                            <p>
                              <strong>Published:</strong>{" "}
                              {new Date(post.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              <Link
                to={`/category/${encodeURIComponent(category)}`}
                className="view-all-premium-btn"
              >
                View All Posts →
              </Link>

              <hr className="category-divider" />
            </section>

            {/* Trending section after 2nd category */}
            {index === 1 && (
              <div className="trending-categories-section">
                <h3 className="premium-heading">Trending Posts</h3>
                {trendingPosts.map((post) => (
                  <Link
                    to={`/post/${post._id}`}
                    key={post._id}
                    className="premium-item"
                  >
                    <div className="premium-text">
                      <small className="premium-meta">
                        {post.category || "General"} · Trending
                      </small>
                      <span className="item-title">#{post.title}</span>
                      <small className="premium-meta">
                        {post.views
                          ? post.views.toLocaleString() + " views"
                          : "Popular post"}
                      </small>
                    </div>
                    <MoreHorizontal size={18} />
                  </Link>
                ))}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Spinner */}
      {loading && (
        <div className="infinite-spinner">
          <span className="spinner" />
        </div>
      )}

      {/* Error banner */}
      {showError && error && (
        <div className="error-message">
          Failed to load more categories. Please check your connection.
          <button
            onClick={() => {
              setError(false);
              setShowError(false);
              fetchPosts();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default AllCategories;
