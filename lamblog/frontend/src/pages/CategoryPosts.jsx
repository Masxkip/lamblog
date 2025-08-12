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

  // ---- normalized category (Title Case, single spaces) ----
  const normalizedCategory = name
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // ---- pagination + network state ----
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loadingInitial, setLoadingInitial] = useState(true); // first page
  const [loadingMore, setLoadingMore] = useState(false);      // next pages
  const [error, setError] = useState(null);                   // { message }
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const limit = 9; // how many to fetch per page (tweak to taste)

  // AbortController for in-flight requests (cancel on unmount/category switch)
  const abortRef = useRef(null);

  // ---- online/offline listeners ----
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ---- fetch function that shows spinner for actual network time ----
 const fetchPage = useCallback(
  async (pageToLoad, isFirstPage = false) => {
    if (isOffline) {
      setError({ message: "You’re offline. Check your connection and retry." });
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    if (isFirstPage) setLoadingInitial(true);
    else setLoadingMore(true);

    const start = performance.now();

    try {
      const res = await axios.get(`${API_URL}/api/posts`, {
        params: { category: normalizedCategory, page: pageToLoad, limit },
        signal: controller.signal,
        timeout: 15000,
      });

      const list = Array.isArray(res.data?.posts) ? res.data.posts : [];
      setHasMore(Boolean(res.data?.hasMore));

      setPosts(prev => (pageToLoad === 1 ? list : [...prev, ...list]));
      setPage(pageToLoad + 1);
    } catch (err) {
      if (axios.isCancel(err)) return;
      let message = "Failed to load posts. Please try again.";
      if (err.code === "ECONNABORTED") message = "Request timed out. Retry?";
      if (err.response?.status >= 500) message = "Server error. Please retry.";
      if (!navigator.onLine) message = "You’re offline. Check connection and retry.";
      setError({ message });
    } finally {
      const elapsed = performance.now() - start;
      const minSpinner = 250;
      const wait = elapsed < minSpinner ? minSpinner - elapsed : 0;
      await new Promise(r => setTimeout(r, wait));
      if (isFirstPage) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  },
  [normalizedCategory, isOffline] // ⬅ removed API_URL
);


  // ---- (re)load first page when category changes ----
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchPage(1, true);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [normalizedCategory, fetchPage]);

  // ---- infinite scroll (IntersectionObserver) ----
  const observer = useRef(null);
  const lastPostRef = useCallback(
    (node) => {
      if (loadingInitial || loadingMore || !hasMore || error || isOffline) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchPage(page, false);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingInitial, loadingMore, hasMore, error, isOffline, fetchPage, page]
  );

  // ---- retry button handler ----
  const handleRetry = () => {
    setError(null);
    // If nothing loaded yet, retry first page; otherwise retry current page
    fetchPage(posts.length ? page : 1, !posts.length);
  };

  return (
    <div className="category-posts-page">
      <div className="category-header-row">
        <BackArrow />
        <h2 className="category-title-text">
          All Posts in <span style={{ color: "#6a1bbd" }}>#{normalizedCategory}</span>
        </h2>
        <DynamicArrow />
      </div>

      {/* offline banner */}
      {isOffline && (
        <div className="network-banner offline">
          You’re offline. We’ll resume loading when you’re back online.
        </div>
      )}

      {/* initial load */}
      {loadingInitial ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : error && posts.length === 0 ? (
        <div className="error-block">
          <p>{error.message}</p>
          <button className="retry-btn" onClick={handleRetry}>Retry</button>
        </div>
      ) : posts.length === 0 ? (
        <p>No posts found under this category.</p>
      ) : (
        <div className="category-posts-container">
          {posts.map((post, index) => {
            const isLocked = post.isPremium && (!user || !user.isSubscriber);
            const target = isLocked ? "/subscribe" : `/post/${post._id}`;
            const isLast = index === posts.length - 1;

            const imgSrc =
              post.image && (post.image.startsWith("http") ? post.image : `${API_URL}/${post.image}`);

            return (
              <div
                key={post._id}
                ref={isLast ? lastPostRef : null}
                className="category-post-card"
              >
                <Link to={target}>
                  {imgSrc && (
                    <div className={`fixed-image-wrapper2 ${isLocked ? "premium-locked" : ""}`}>
                      <img
                        src={imgSrc}
                        alt={post.title || "Post"}
                        className={`fixed-image2 ${isLocked ? "blurred-content" : ""}`}
                        loading="lazy"
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
                        @{post.author?.username || "user"}
                      </span>
                      {post.author?.isSubscriber && (
                        <span className="verified-circle">
                          <Check size={12} color="white" strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <h3 className="premium-page-title">#{post.title}</h3>
                    <p className="premium-page-snippet">
                      {post.content?.substring(0, 80)}...
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

      {/* load-more spinner */}
      {!loadingInitial && !error && hasMore && (
        <div className="infinite-spinner">
          {loadingMore ? <span className="spinner" /> : null}
        </div>
      )}

      {/* error while loading more (show inline with retry) */}
      {!loadingInitial && error && posts.length > 0 && (
        <div className="error-inline">
          <span>{error.message}</span>
          <button className="retry-btn small" onClick={handleRetry}>Retry</button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default CategoryPosts;
