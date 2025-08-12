// AllCategories.jsx — 6-category batches with network-driven paging

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

  // Network-driven pagination (by posts)
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);

  // Client-side search
  const [searchTerm, setSearchTerm] = useState("");

  // Trending
  const [trendingPosts, setTrendingPosts] = useState([]);

  // Batching by categories
  const [visibleCats, setVisibleCats] = useState(6);

  // Refs
  const sentinelRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const didFirstPageLoadRef = useRef(false);

  // Pull enough to fill several category blocks
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
  }, [page, hasMore]); // no API_URL dep (constant)

  // Cleanup timer
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
    const cat =
      post?.category
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Uncategorized";
    if (!postsByCategory[cat]) postsByCategory[cat] = [];
    postsByCategory[cat].push(post);
  });

  const allCategoryEntries = Object.entries(postsByCategory);

  // A category block is "ready" if it has 5 posts, OR (end reached) has >=1
  const readyCategoryEntries = allCategoryEntries.filter(
    ([, items]) => items.length >= 5 || (!hasMore && items.length > 0)
  );

  // ✅ Ensure we don't show the list until the first 6 category blocks are ready (or end reached)
  const initialBatchReady =
    readyCategoryEntries.length >= 6 || (!hasMore && readyCategoryEntries.length > 0);

  // Auto-fetch more pages to reach the first 6 ready categories (no UI flicker)
  useEffect(() => {
    if (!didFirstPageLoadRef.current) return;
    if (initialBatchReady) return;
    if (!loading && hasMore) {
      setPage((p) => p + 1);
    }
  }, [initialBatchReady, loading, hasMore]);

  // When searching, reset paging + visible category count
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setShowError(false);
    setVisibleCats(6);
    didFirstPageLoadRef.current = false;
    clearTimeout(errorTimeoutRef.current);
  }, [searchTerm]);

  // IntersectionObserver on a bottom sentinel:
  // - If we already have enough ready categories for the next batch, just reveal them (visibleCats += 6)
  // - Else, fetch another page (if possible) to fill up to the next batch
  useEffect(() => {
    if (!didFirstPageLoadRef.current) return;
    const node = sentinelRef.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        const need = visibleCats + 6;
        if (readyCategoryEntries.length >= need) {
          setVisibleCats((v) => v + 6);
        } else if (hasMore && !loading) {
          setPage((p) => p + 1);
        }
      },
      {
        root: null,
        // Require a tiny user scroll, so it won't auto-fire on first paint
        rootMargin: "-1px",
        threshold: 0,
      }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [readyCategoryEntries.length, visibleCats, hasMore, loading]);

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

      {/* First load: wait until 6 categories are ready (or end reached) */}
      {!initialBatchReady ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : (
        <>
          {readyCategoryEntries.slice(0, visibleCats).map(([category, postsInCat], index) => (
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

          {/* Bottom sentinel to load next 6 categories or fetch more posts */}
          <div ref={sentinelRef} />

          {/* Spinner after batches:
              - Show while fetching next page, OR
              - Show if fewer than visibleCats+6 ready categories exist and we still have more to load */}
          {(loading || (readyCategoryEntries.length < visibleCats + 6 && hasMore)) && (
            <div className="infinite-spinner">
              <span className="spinner" />
            </div>
          )}
        </>
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
