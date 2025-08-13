// CategoryPosts.jsx — indexed pagination (numbered), progressive loading

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
  const limit = 3; // posts per page (UI shows 9 per “index” page)

  // Progressive pagination state
  const [pagesData, setPagesData] = useState([]); // array of arrays; pagesData[0] = page 1 posts, etc.
  const [currentPage, setCurrentPage] = useState(1); // 1-based index into pagesData
  const [hasMore, setHasMore] = useState(true);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null); // { message }
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

  // ---- fetch a specific backend page ----
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

        setPagesData(prev => {
          // If loading page 1, reset; otherwise append (ensure no gaps)
          if (pageToLoad === 1) return [list];
          const next = prev.slice();
          // if user skipped (shouldn’t happen through UI), pad
          while (next.length < pageToLoad - 1) next.push([]);
          next[pageToLoad - 1] = list;
          return next;
        });

        setCurrentPage(pageToLoad);
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
    [normalizedCategory, isOffline] // (intentionally excluding API_URL to avoid ESLint warning)
  );

  // ---- (re)load first page when category changes ----
  useEffect(() => {
    setPagesData([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchPage(1, true);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [normalizedCategory, fetchPage]);

  // ---- retry button handler ----
  const handleRetry = () => {
    setError(null);
    if (pagesData.length === 0) fetchPage(1, true);
    else fetchPage(currentPage, false);
  };

  // ---- pagination control handlers ----
  const totalLoadedPages = pagesData.length;
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalLoadedPages || hasMore;

  const goToPage = (n) => {
    // If page already loaded, just switch
    if (n >= 1 && n <= totalLoadedPages) {
      setCurrentPage(n);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // If n is exactly the “next” page and we still have more, fetch it
    if (n === totalLoadedPages + 1 && hasMore && !loadingMore && !loadingInitial) {
      fetchPage(n, false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (!canPrev) return;
    goToPage(currentPage - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    // If there’s a loaded next page, go there; else fetch the next page
    if (currentPage < totalLoadedPages) goToPage(currentPage + 1);
    else goToPage(totalLoadedPages + 1);
  };

  // current page posts
  const currentPosts = pagesData[currentPage - 1] || [];

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
      ) : error && pagesData.length === 0 ? (
        <div className="error-block">
          <p>{error.message}</p>
          <button className="retry-btn" onClick={handleRetry}>Retry</button>
        </div>
      ) : currentPosts.length === 0 ? (
        <p>No posts found under this category.</p>
      ) : (
        <>
          {/* Pager (top) */}
          <div className="pager">
            <button className="pager-nav" onClick={handlePrev} disabled={!canPrev}>← Prev</button>

            {/* number buttons for loaded pages */}
            {Array.from({ length: totalLoadedPages }, (_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  className={`pager-btn ${n === currentPage ? "active" : ""}`}
                  onClick={() => goToPage(n)}
                  disabled={n === currentPage}
                >
                  {n}
                </button>
              );
            })}

            {/* show the next page index if more pages exist */}
            {hasMore && (
              <button
                className={`pager-btn ${currentPage === totalLoadedPages + 1 ? "active" : ""}`}
                onClick={() => goToPage(totalLoadedPages + 1)}
                disabled={loadingMore}
              >
                {totalLoadedPages + 1}
              </button>
            )}

            <button className="pager-nav" onClick={handleNext} disabled={!canNext}>
              Next →
            </button>
          </div>

          {/* Posts grid for current page */}
          <div className="category-posts-container">
            {currentPosts.map((post) => {
              const isLocked = post.isPremium && (!user || !user.isSubscriber);
              const target = isLocked ? "/subscribe" : `/post/${post._id}`;
              const imgSrc =
                post.image && (post.image.startsWith("http") ? post.image : `${API_URL}/${post.image}`);

              return (
                <div key={post._id} className="category-post-card">
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

        

          {/* Pager (bottom) */}
          <div className="pager" style={{ marginTop: 16 }}>
            <button className="pager-nav" onClick={handlePrev} disabled={!canPrev}>← Prev</button>

            {Array.from({ length: totalLoadedPages }, (_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  className={`pager-btn ${n === currentPage ? "active" : ""}`}
                  onClick={() => goToPage(n)}
                  disabled={n === currentPage}
                >
                  {n}
                </button>
              );
            })}

            {hasMore && (
              <button
                className={`pager-btn ${currentPage === totalLoadedPages + 1 ? "active" : ""}`}
                onClick={() => goToPage(totalLoadedPages + 1)}
                disabled={loadingMore}
              >
                {totalLoadedPages + 1}
              </button>
            )}

            <button className="pager-nav" onClick={handleNext} disabled={!canNext}>
              Next →
            </button>
          </div>
        </>
      )}

      {/* error while navigating more pages */}
      {!loadingInitial && error && pagesData.length > 0 && (
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
