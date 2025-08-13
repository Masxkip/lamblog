// AllCategories.jsx — indexed pagination (6 categories per page)

import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import { MoreHorizontal, Check, Lock } from "lucide-react";
import AuthContext from "../context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const CATS_PER_PAGE = 3;
const LIMIT = 30; // backend page size for posts fetch

function AllCategories() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
  const [catPage, setCatPage] = useState(1);      // <-- indexed pagination by category
  // UI / network state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const abortRef = useRef(null);


  const errorTimeoutRef = useRef(null);

const fetchPosts = useCallback(async () => {
  // bail out if no more pages or offline
  if (!hasMore || isOffline) {
    if (isOffline) {
      setError(true);
      setShowError(true);
      setLoading(false);
    }
    return;
  }

  // cancel any in-flight request
  if (abortRef.current) abortRef.current.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  setLoading(true);
  setError(false);

  try {
    const res = await axios.get(`${API_URL}/api/posts`, {
      params: { page: netPage, limit: LIMIT, _: Date.now() }, // cache-buster
      headers: { "Cache-Control": "no-cache" },               // revalidate
      signal: controller.signal,
      timeout: 10000,
    });

    const newPosts = Array.isArray(res.data?.posts) ? res.data.posts : [];
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
    if (axios.isCancel(err)) return; // ignore aborts

    setError(true);
    setNetPage((prev) => Math.max(prev - 1, 1));
    clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setShowError(true);
      setLoading(false);
    }, 10000);
    console.error("Failed to fetch posts (AllCategories):", err);
  }
}, [netPage, hasMore, isOffline]);


// listner for offline network
  useEffect(() => {
  const on = () => setIsOffline(false);
  const off = () => setIsOffline(true);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  };
}, []);


  // Cleanup timer
useEffect(() => {
  return () => {
    clearTimeout(errorTimeoutRef.current);
    if (abortRef.current) abortRef.current.abort();
  };
}, []);


  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Trending (unchanged)
useEffect(() => {
  const fetchTrending = async () => {
    if (isOffline) {
      setTrendingPosts([]);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/posts/trending/posts`, {
        params: { _: Date.now() },
        headers: { "Cache-Control": "no-cache" },
        timeout: 10000,
      });
      setTrendingPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch trending posts", err);
      setTrendingPosts([]);
    }
  };
  fetchTrending();
}, [isOffline]);


  // Filter, sort, group by category
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
  const totalCatPages = Math.max(1, Math.ceil(categoryEntries.length / CATS_PER_PAGE));

  // When searching, reset to first category page
  useEffect(() => {
    setCatPage(1);
    setShowError(false);
    clearTimeout(errorTimeoutRef.current);
  }, [searchTerm]);

  // On-demand prefetch: if user navigates near the end of available categories, fetch next backend page
 useEffect(() => {
  const catCount = categoryEntries.length;
  const lastIndexNeeded = catPage * CATS_PER_PAGE;
  if (!isOffline && lastIndexNeeded > catCount - 2 && hasMore && !loading) {
    setNetPage((p) => p + 1);
  }
}, [catPage, categoryEntries.length, hasMore, loading, isOffline]);


useEffect(() => {
  if (isOffline) {
    // clear stale data so nothing "sticks" while offline
    setPosts([]);
    setNetPage(1);
    setHasMore(true);
    setLoading(false);
    setShowError(true);
  } else {
    // back online → if empty, fetch the first page
    if (posts.length === 0) {
      fetchPosts();
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOffline]);


  // Trigger fetch when netPage increments due to prefetch logic
  useEffect(() => {
    if (netPage > 1) fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netPage]);

  // Current slice of categories to render
  const startIdx = (catPage - 1) * CATS_PER_PAGE;
  const endIdx = startIdx + CATS_PER_PAGE;
  const visibleCategoryEntries = categoryEntries.slice(startIdx, endIdx);

  // Pagination UI component
  const Pagination = () => {
    if (totalCatPages <= 1) return null;

    const go = (n) => setCatPage(n);

    // Build a compact pager (1 … active±1 … last)
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
        <span key={key} className="pager-ellipsis">…</span>
      );

    const first = 1;
    const last = totalCatPages;

    // Always show first
    push(first);

    // Left gap
    if (catPage > 3) addEllipsis("l");

    // Middle neighbors
    for (let n = Math.max(2, catPage - 1); n <= Math.min(last - 1, catPage + 1); n++) {
      if (n !== first && n !== last) push(n);
    }

    // Right gap
    if (catPage < last - 2) addEllipsis("r");

    // Always show last if > 1
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
          Showing {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""} for: <strong>"{searchTerm}"</strong>
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

          {/* 6 categories per page */}
          {visibleCategoryEntries.map(([category, postsInCat], indexOnPage) => (
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
                              <div className={`fixed-image-wrapper1 ${isLocked ? "premium-locked" : ""}`}>
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

              {/* Keep Trending after the 2nd category on the current page */}
              {indexOnPage === 1 && (
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

          {/* Bottom pager */}
          <Pagination />
        </>
      )}

      {isOffline && (
  <div className="network-banner offline">
    You’re offline. We’ll load categories when you’re back online.
  </div>
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
