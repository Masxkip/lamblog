// AllCategories.jsx — indexed pagination (3 categories per page) with cache-buster and hard reset

import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import { MoreHorizontal, Check, Lock } from "lucide-react";
import AuthContext from "../context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const CATS_PER_PAGE = 3;   // how many categories per UI page
const LIMIT = 30;          // backend page size for /api/posts (flat list)

// Title-Case normalizer to match your backend normalization
function normalizeCategory(name) {
  if (!name) return "Uncategorized";
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function AllCategories() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Network-driven state
  const [posts, setPosts] = useState([]);
  const [netPage, setNetPage] = useState(1);      // backend page pointer
  const [hasMore, setHasMore] = useState(true);   // from backend
  const [loading, setLoading] = useState(false);  // first-load or on-demand prefetch
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [catPage, setCatPage] = useState(1);      // indexed pagination by category

  const errorTimeoutRef = useRef(null);

  // --- NEW: hard reset helper so we don't carry old merged pages ---
  const resetState = useCallback(() => {
    setPosts([]);
    setNetPage(1);
    setHasMore(true);
    setError(false);
    setShowError(false);
    setLoading(false);
    clearTimeout(errorTimeoutRef.current);
  }, []);

  // --- CHANGED: fetchPosts now accepts pageOverride + adds cache-buster + no-cache headers ---
  const fetchPosts = useCallback(
    async (pageOverride) => {
      if (!hasMore && !pageOverride) return; // allow explicit page 1 load on reset
      setLoading(true);
      setError(false);
      try {
        const pageToLoad = pageOverride ?? netPage;
        const res = await axios.get(`${API_URL}/api/posts`, {
          params: { page: pageToLoad, limit: LIMIT, _ts: Date.now() },
          timeout: 10000,
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });

        const newPosts = Array.isArray(res.data?.posts) ? res.data.posts : [];

        // Merge by _id (prevents dupes if skip/limit shifts)
        setPosts((prev) => {
          const map = new Map();
          prev.forEach((p) => map.set(p._id, p));
          newPosts.forEach((p) => map.set(p._id, p));
          return Array.from(map.values());
        });

        setHasMore(Boolean(res.data?.hasMore));
        setLoading(false);
        setShowError(false);
        clearTimeout(errorTimeoutRef.current);
      } catch (err) {
        setError(true);
        // step back so we can retry same backend page on next attempt
        setNetPage((prev) => Math.max(prev - 1, 1));
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
          setShowError(true);
          setLoading(false);
        }, 10000);
        console.error("Failed to fetch posts (AllCategories):", err);
      }
    },
    // intentionally excluding API_URL to avoid ESLint noise; it won't change at runtime
    [netPage, hasMore]
  );

  // Cleanup timer
  useEffect(() => {
    return () => clearTimeout(errorTimeoutRef.current);
  }, []);

  // --- NEW: reset and force a fresh page-1 fetch whenever this route is navigated to ---
  useEffect(() => {
    resetState();
    // explicit page-1 fetch avoids waiting for state updates to settle
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Initial mount safety: in case location.key doesn't change on first render
  useEffect(() => {
    if (posts.length === 0 && netPage === 1 && !loading && !error) {
      fetchPosts(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trending (with cache-buster)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/trending/posts`, {
          params: { _ts: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        setTrendingPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch trending posts", err);
        setTrendingPosts([]);
      }
    };
    fetchTrending();
  }, []); // trending can be independent

  // Filter, sort, group by category (memoized so it doesn't churn)
  const filteredSortedPosts = useMemo(() => {
    const arr = Array.isArray(posts) ? posts : [];
    const term = searchTerm.toLowerCase();
    const filtered = term
      ? arr.filter(
          (post) =>
            post?.category?.toLowerCase().includes(term) ||
            post?.title?.toLowerCase().includes(term)
        )
      : arr;

    // latest first
    return filtered.slice().sort((a, b) => {
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return db - da;
    });
  }, [posts, searchTerm]);

  const postsByCategory = useMemo(() => {
    const grouped = {};
    filteredSortedPosts.forEach((post) => {
      const key = normalizeCategory(post?.category);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(post);
    });
    return grouped;
  }, [filteredSortedPosts]);

  const categoryEntries = useMemo(
    () => Object.entries(postsByCategory),
    [postsByCategory]
  );

  const totalCatPages = useMemo(
    () => Math.max(1, Math.ceil(categoryEntries.length / CATS_PER_PAGE)),
    [categoryEntries.length]
  );

  // Reset pager on search change (and hide error)
  useEffect(() => {
    setCatPage(1);
    setShowError(false);
    clearTimeout(errorTimeoutRef.current);
  }, [searchTerm]);

  // On-demand prefetch: if user navigates near the end of available categories, fetch next backend page
  useEffect(() => {
    const catCount = categoryEntries.length;
    const lastIndexNeeded = catPage * CATS_PER_PAGE;

    // If about to show beyond what's loaded and backend has more, prefetch next page
    if (lastIndexNeeded > catCount - 2 && hasMore && !loading) {
      setNetPage((p) => p + 1);
    }
  }, [catPage, categoryEntries.length, hasMore, loading]);

  // Trigger fetch when netPage increments due to prefetch logic
  useEffect(() => {
    if (netPage > 1) fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netPage]);

  // Current slice of categories to render
  const startIdx = (catPage - 1) * CATS_PER_PAGE;
  const endIdx = startIdx + CATS_PER_PAGE;
  const visibleCategoryEntries = categoryEntries.slice(startIdx, endIdx);

  // Pagination UI component (unchanged visual; runs off totalCatPages/catPage)
  const Pagination = () => {
    if (totalCatPages <= 1) return null;

    const go = (n) => setCatPage(n);

    const pages = [];
    const push = (n, key = n) =>
      pages.push(
        <button
          key={key}
          className={`pager-btn ${n === catPage ? "active" : ""}`}
          onClick={() => go(n)}
          disabled={n === catPage}
        >
          {n}
        </button>
      );

    const addEllipsis = (key) =>
      pages.push(
        <span key={key} className="pager-ellipsis">
          …
        </span>
      );

    const first = 1;
    const last = totalCatPages;

    push(first);
    if (catPage > 3) addEllipsis("l");
    for (let n = Math.max(2, catPage - 1); n <= Math.min(last - 1, catPage + 1); n++) {
      if (n !== first && n !== last) push(n);
    }
    if (catPage < last - 2) addEllipsis("r");
    if (last > 1) push(last);

    return (
      <div className="pager">
        <button
          className="pager-nav"
          onClick={() => go(Math.max(1, catPage - 1))}
          disabled={catPage === 1}
        >
          ← Prev
        </button>

        {/* Optional manual Refresh to force page-1 + reset */}
        <button
          className="pager-nav"
          onClick={() => {
            resetState();
            fetchPosts(1);
          }}
        >
          Refresh
        </button>

        {pages}

        <button
          className="pager-nav"
          onClick={() => go(Math.min(last, catPage + 1))}
          disabled={catPage === last}
        >
          Next →
        </button>
      </div>
    );
  };

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
          Showing {filteredSortedPosts.length} result
          {filteredSortedPosts.length !== 1 ? "s" : ""} for:{" "}
          <strong>"{searchTerm}"</strong>
        </div>
      )}

      {/* First-load spinner only */}
      {posts.length === 0 && loading ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : visibleCategoryEntries.length === 0 ? (
        <div className="no-posts-message">
          <p>No posts available{searchTerm ? " for your search." : "."}</p>
        </div>
      ) : (
        <>
          {/* Top pager */}
          <Pagination />

          {/* 3 categories per page */}
          {visibleCategoryEntries.map(([category, postsInCat], indexOnPage) => (
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
                              <h3 className="slider-post-card-title">
                                #{post.title}
                              </h3>
                              <p className="slider-post-card-snippet">
                                {post.content?.substring(0, 80)}...
                              </p>
                              <p>
                                <strong>Category:</strong>{" "}
                                {normalizeCategory(post.category)}
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

              {/* Keep Trending after the 2nd category on the current page */}
              {indexOnPage === 1 && (
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
                          {normalizeCategory(post.category)} · Trending
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

          {/* Bottom pager */}
          <Pagination />
        </>
      )}

      {/* Error (retry fetch of backend page) */}
      {showError && error && (
        <div className="error-message">
          Failed to load more posts. Please check your connection.
          <button
            onClick={() => {
              setError(false);
              setShowError(false);
              setLoading(false);
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
