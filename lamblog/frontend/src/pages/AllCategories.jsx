// AllCategories.jsx — network-driven infinite pagination (6 at a time)
// - First load shows 6 posts (grouped by category), then a spinner, then next 6, etc.
// - Uses a bottom sentinel so fetching is triggered by scroll, not timeouts.
// - rootMargin: "-1px" forces a tiny user scroll before auto-loading the next page.

import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";
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

  // Pagination state (real network-driven, like Home)
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);

  // Client-side search (filters categories/titles locally)
  const [searchTerm, setSearchTerm] = useState("");

  // Trending list (unchanged)
  const [trendingPosts, setTrendingPosts] = useState([]);

  // Refs
  const sentinelRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const didFirstPageLoadRef = useRef(false);

  // Fetch 6 at a time
  const LIMIT = 6;

  const fetchPosts = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    setError(false);

    try {
      const res = await axios.get(`${API_URL}/api/posts`, {
        params: { page, limit: LIMIT },
        timeout: 10000, // 10s timeout like Home
      });

      const newPosts = Array.isArray(res.data?.posts) ? res.data.posts : [];

      // De-dupe by _id across pages
      setPosts((prev) => {
        const map = new Map();
        prev.forEach((p) => map.set(p._id, p));
        newPosts.forEach((p) => map.set(p._id, p));
        return Array.from(map.values());
      });

      setHasMore(Boolean(res.data?.hasMore));
      setLoading(false);
      setShowError(false);

      if (page === 1) {
        // First page finished -> allow the observer to trigger next loads
        didFirstPageLoadRef.current = true;
      }

      clearTimeout(errorTimeoutRef.current);
    } catch (err) {
      setError(true);
      // Step back page so we can retry this page
      setPage((prev) => Math.max(prev - 1, 1));

      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(true);
        setLoading(false);
      }, 10000);

      console.error("Failed to fetch posts (AllCategories):", err);
    }
  }, [page, hasMore]); // ✅ no API_URL here (ESLint-safe)

  // Cleanup any pending error timers on unmount
  useEffect(() => {
    return () => clearTimeout(errorTimeoutRef.current);
  }, []);

  // Initial load + subsequent page loads
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Trending posts (one-off)
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
  }, []); // ✅ no API_URL dep needed

  // Grouping helpers (client-side search on category/title)
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
    if (!postsByCategory[formattedCategory])
      postsByCategory[formattedCategory] = [];
    postsByCategory[formattedCategory].push(post);
  });

  const categoryEntries = Object.entries(postsByCategory);

  // IntersectionObserver on a single bottom sentinel
  useEffect(() => {
    // Block observer until first page has rendered
    if (!didFirstPageLoadRef.current) return;
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
        // TIP: To require a tiny user scroll (avoid instant auto-trigger),
        // use "-1px". If you want eager prefetching, you can use "200px".
        rootMargin: "-1px",
        threshold: 0,
      }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [loading, error, hasMore]); // ✅ no API_URL dep needed

  // Reset when search changes (repeat the same first-load behavior)
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
          {filteredPosts.length !== 1 ? "s" : ""} for:{" "}
          <strong>"{searchTerm}"</strong>
        </div>
      )}

      {/* First page: full-screen spinner */}
      {posts.length === 0 && loading ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : categoryEntries.length === 0 ? (
        <div className="no-posts-message">
          <p>No posts available for your search.</p>
        </div>
      ) : (
        <>
          {categoryEntries.map(([category, postsInCat], index) => (
            <React.Fragment key={category}>
              <section className="category-block">
                <h2 className="category-title">#{category}</h2>

                <div className="category-slider">
                  {postsInCat.slice(0, 5).map((post) => {
                    const isLocked =
                      post.isPremium && (!user || !user.isSubscriber);
                    const target = isLocked ? "/subscribe" : `/post/${post._id}`;

                    return (
                      <div className="slider-post-card" key={post._id}>
                        <Link to={target} className="slider-post-card-link">
                          <div className="slider-post-card-inner">
                            {/* Image */}
                            {post.image && (
                              <div
                                className={`fixed-image-wrapper1 ${
                                  isLocked ? "premium-locked" : ""
                                }`}
                              >
                                <img
                                  src={
                                    post.image.startsWith("http")
                                      ? post.image
                                      : `${API_URL}/${post.image}`
                                  }
                                  alt={post.title}
                                  className={`fixed-image1 ${
                                    isLocked ? "blurred-content" : ""
                                  }`}
                                />
                                {isLocked && (
                                  <div className="locked-banner small">
                                    <Lock
                                      size={14}
                                      style={{ marginRight: "6px" }}
                                    />
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
                              <h3 className="slider-post-card-title">
                                #{post.title}
                              </h3>
                              <p className="slider-post-card-snippet">
                                {post.content?.substring(0, 80)}...
                              </p>
                              <p>
                                <strong>Category:</strong>{" "}
                                {post.category || "Uncategorized"}
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

              {/* Insert the Trending section after the 2nd category block (as before) */}
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
                            ? `${post.views.toLocaleString()} views`
                            : "Popular post"}
                        </small>
                      </div>
                      <MoreHorizontal size={18} />
                    </Link>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Bottom sentinel to trigger next page */}
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
