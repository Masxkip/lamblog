// AllCategories.jsx — paginated by posts, rendered in full 5-card category blocks

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
  const navigate = useNavigate();

  // Network-driven pagination
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);

  // Client-side search on category/title
  const [searchTerm, setSearchTerm] = useState("");

  // Trending
  const [trendingPosts, setTrendingPosts] = useState([]);

  // Refs
  const errorTimeoutRef = useRef(null);
  const sentinelRef = useRef(null);
  const didFirstPageLoadRef = useRef(false);

  // Pull a decent chunk so blocks can fill to 5 quickly
  const LIMIT = 30;

  const fetchPosts = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    setError(false);

    try {
      const res = await axios.get(`${API_URL}/api/posts`, {
        params: { page, limit: LIMIT },
        timeout: 10000,
      });

      const newPosts = Array.isArray(res.data?.posts) ? res.data.posts : [];
      // De-duplicate by _id
      setPosts((prev) => {
        const map = new Map();
        prev.forEach((p) => map.set(p._id, p));
        newPosts.forEach((p) => map.set(p._id, p));
        return Array.from(map.values());
      });

      setHasMore(Boolean(res.data?.hasMore));
      setLoading(false);
      setShowError(false);

      if (page === 1) didFirstPageLoadRef.current = true;

      clearTimeout(errorTimeoutRef.current);
    } catch (err) {
      setError(true);
      setPage((prev) => Math.max(prev - 1, 1)); // retry same page later

      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(true);
        setLoading(false);
      }, 10000);

      console.error("Failed to fetch posts (AllCategories):", err);
    }
  }, [page, hasMore]); // no API_URL dep

  useEffect(() => {
    return () => clearTimeout(errorTimeoutRef.current);
  }, []);

  // Initial + subsequent page loads
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Trending
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/trending/posts`);
        setTrendingPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch trending posts", err);
        setTrendingPosts([]);
      }
    };
    fetchTrending();
  }, []); // no API_URL dep

  // Build filtered/sorted list
  const filteredPosts = (Array.isArray(posts) ? posts : []).filter(
    (post) =>
      post?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPosts = filteredPosts.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Group by normalized category
  const postsByCategory = {};
  sortedPosts.forEach((post) => {
    const formattedCategory =
      post?.category
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Uncategorized";
    if (!postsByCategory[formattedCategory]) postsByCategory[formattedCategory] = [];
    postsByCategory[formattedCategory].push(post);
  });

  const allCategoryEntries = Object.entries(postsByCategory);

  // 🚦 Only show category blocks that are "ready":
  // - have at least 5 posts, OR
  // - we've reached the end (hasMore === false) and they have at least 1 (so we don't hide forever)
  const readyCategoryEntries = allCategoryEntries.filter(
    ([, items]) => items.length >= 5 || (!hasMore && items.length > 0)
  );

  // Infinite scroll using a bottom sentinel (wait until tiny user scroll)
  useEffect(() => {
    if (!didFirstPageLoadRef.current) return; // don't trigger page 2 before page 1 shows
    if (loading || error || !hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "-1px", // require a tiny scroll so it doesn't auto-fire on first paint
        threshold: 0,
      }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [loading, error, hasMore]);

  // Reset on search change
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setShowError(false);
    didFirstPageLoadRef.current = false;
    clearTimeout(errorTimeoutRef.current);
  }, [searchTerm]);

  return (
    <div className="all-categories-page">
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

      {searchTerm && (
        <div className="search-results-heading">
          Showing {filteredPosts.length} result
          {filteredPosts.length !== 1 ? "s" : ""} for: <strong>"{searchTerm}"</strong>
        </div>
      )}

      {/* First full-screen spinner */}
      {posts.length === 0 && loading ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : readyCategoryEntries.length === 0 ? (
        // If we fetched something but no category has 5 yet, keep space tidy and show bottom spinner
        <>
          {/* No ready categories yet */}
          {loading && (
            <div className="infinite-spinner">
              <span className="spinner" />
            </div>
          )}
        </>
      ) : (
        <>
          {readyCategoryEntries.map(([category, postsInCat], index) => (
            <React.Fragment key={category}>
              <section className="category-block">
                <h2 className="category-title">#{category}</h2>

                <div className="category-slider">
                  {postsInCat.slice(0, 5).map((post) => {
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
                                  src={
                                    post.image.startsWith("http")
                                      ? post.image
                                      : `${API_URL}/${post.image}`
                                  }
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

                            {/* Text */}
                            <div className="slider-post-card-content">
                              <div className="profile-link verified-user">
                                <span className="slider-post-card-author">
                                  @{post.author?.username}
                                </span>
                                {post.author?.isSubscriber && (
                                  <span className="verified-circle">
                                    <Check size={12} strokeWidth={3} />
                                  </span>
                                )}
                              </div>
                              <h3 className="slider-post-card-title">#{post.title}</h3>
                              <p className="slider-post-card-snippet">
                                {post.content?.substring(0, 80)}...
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

              {/* Keep your “Trending after 2nd block” rule */}
              {index === 1 && (
                <div className="trending-categories-section">
                  <h3 className="premium-heading">Trending Posts</h3>
                  {trendingPosts.map((post) => (
                    <Link to={`/post/${post._id}`} key={post._id} className="premium-item">
                      <div className="premium-text">
                        <small className="premium-meta">
                          {post.category || "General"} · Trending
                        </small>
                        <span className="item-title">#{post.title}</span>
                        <small className="premium-meta">
                          {post.views ? `${post.views.toLocaleString()} views` : "Popular post"}
                        </small>
                      </div>
                      <MoreHorizontal size={18} />
                    </Link>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Bottom sentinel to load the next page */}
          <div ref={sentinelRef} />
        </>
      )}

      {/* Inline spinner for subsequent loads (page >= 2) */}
      {posts.length > 0 && loading && (
        <div className="infinite-spinner">
          <span className="spinner" />
        </div>
      )}

      {/* 10s fail + Retry */}
      {showError && error && (
        <div className="error-message">
          Failed to load more posts. Please check your connection.
          <button
            onClick={() => {
              setError(false);
              setShowError(false);
              setLoading(false);
              fetchPosts(); // retry current page
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
