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

  // Backend pagination (posts)
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // UI pagination (categories)
  const CATS_PER_PAGE = 6;
  const [uiPage, setUiPage] = useState(1); // 1 => show 6 categories, 2 => 12, etc.

  // Loading split
  const [initialLoading, setInitialLoading] = useState(true); // first-ever fetch
  const [loading, setLoading] = useState(false);              // subsequent fetches

  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);

  // Search + trending
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);

  const observer = useRef(null);
  const errorTimeoutRef = useRef(null);

  // Grab enough posts at a time. The UI will clamp how many categories it shows.
  const LIMIT = 30;

  const fetchPosts = useCallback(async () => {
    if (loading || !hasMore) return;
    setError(false);

    const isFirstLoad = initialLoading && page === 1;
    if (isFirstLoad) setInitialLoading(true);
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/api/posts`, {
        params: { page, limit: LIMIT },
        timeout: 10000,
      });

      const newPosts = Array.isArray(res.data?.posts) ? res.data.posts : [];
      setPosts(prev => {
        const map = new Map();
        prev.forEach(p => map.set(p._id, p));
        newPosts.forEach(p => map.set(p._id, p));
        return Array.from(map.values());
      });

      setHasMore(Boolean(res.data?.hasMore));
      setShowError(false);
      clearTimeout(errorTimeoutRef.current);
    } catch (err) {
      setError(true);
      setPage(prev => Math.max(prev - 1, 1));
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(true);
        setLoading(false);
      }, 10000);
      console.error("Failed to fetch posts (AllCategories):", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [page, hasMore, loading, initialLoading]);

  useEffect(() => {
    return () => clearTimeout(errorTimeoutRef.current);
  }, []);

  // Kick off fetch whenever `page` changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Trending (unchanged)
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
  }, []);

  // Filter & group by category
  const filteredPosts = (Array.isArray(posts) ? posts : []).filter(
    (post) =>
      post?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPosts = filteredPosts.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

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

  const categoryEntries = Object.entries(postsByCategory);

  // How many categories we WANT to show based on uiPage
  const desiredCategoryCount = uiPage * CATS_PER_PAGE;
  const visibleCategories = categoryEntries.slice(0, desiredCategoryCount);

  // If user asks for more categories (uiPage++) but we don't yet have enough distinct
  // categories from the backend, auto-fetch more pages until we fill the gap or run out.
  useEffect(() => {
    const have = categoryEntries.length;
    const need = desiredCategoryCount;
    if (!initialLoading && have < need && hasMore && !loading) {
      setPage((p) => p + 1); // pull another backend page of posts
    }
  }, [categoryEntries.length, desiredCategoryCount, hasMore, loading, initialLoading]);

  // Observe the last *visible* category block to advance uiPage
  const lastCategoryRef = useCallback(
    (node) => {
      if (initialLoading || loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          // Ask UI to show 6 more categories
          setUiPage((u) => u + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [initialLoading, loading]
  );

  // Reset when searching
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setUiPage(1);
    setShowError(false);
    setInitialLoading(true);
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

      {/* First-load spinner */}
      {initialLoading && posts.length === 0 ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : visibleCategories.length === 0 ? (
        <div className="no-posts-message">
          <p>No posts available for your search.</p>
        </div>
      ) : (
        visibleCategories.map(([category, postsInCat], index) => {
          const isLastVisible = index === visibleCategories.length - 1;

          return (
            <React.Fragment key={category}>
              <section
                className="category-block"
                ref={isLastVisible ? lastCategoryRef : null}
              >
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
          );
        })
      )}

      {/* Bottom spinner: never show on the very first load */}
      {!initialLoading && loading && (
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
              fetchPosts(); // retry current 'page'
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
