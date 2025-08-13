// CategoryPosts.jsx — numbered pagination with ellipsis, supports full index if API returns total

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

  // ---- normalize category (Title Case, single spaces) ----
  const normalizedCategory = name
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // ---- pagination + network state ----
  const limit = 3; // posts per backend page

  // Each array entry is a page of posts; pagesData[0] = page 1, etc.
  const [pagesData, setPagesData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // 1-based
  const [hasMore, setHasMore] = useState(true);

  // If known, total number of pages for the category (computed from total count / limit).
  // If null, we don't know yet and will fall back to progressive pager.
  const [totalPages, setTotalPages] = useState(null);

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

        // If the backend provides a total count, compute total pages once on first page load.
        // Rename res.data.total to your actual field if different (e.g., totalCount).
        if (isFirstPage && typeof res.data?.total === "number") {
          setTotalPages(Math.max(1, Math.ceil(res.data.total / limit)));
        }

        setPagesData((prev) => {
          if (pageToLoad === 1) return [list];
          const next = prev.slice();
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
        await new Promise((r) => setTimeout(r, wait));
        if (isFirstPage) setLoadingInitial(false);
        else setLoadingMore(false);
      }
    },
    [normalizedCategory, isOffline] // (intentionally excluding API_URL to avoid ESLint noise)
  );

  // ---- (re)load first page when category changes ----
  useEffect(() => {
    setPagesData([]);
    setCurrentPage(1);
    setHasMore(true);
    setTotalPages(null); // reset known total when the category changes
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

  // ---- pagination helpers ----
  const totalLoadedPages = pagesData.length;

  // If we know totalPages, use it; otherwise show progressive count (loaded + 1 if hasMore)
  const effectiveTotalPages =
    totalPages != null ? totalPages : hasMore ? totalLoadedPages + 1 : totalLoadedPages;

  const canPrev = currentPage > 1;
  const canNext = currentPage < effectiveTotalPages;

  const goToPage = (n) => {
    if (n < 1 || n > effectiveTotalPages) return;

    // If already loaded, just switch
    if (n <= totalLoadedPages) {
      setCurrentPage(n);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Otherwise fetch it on demand
    if (!loadingMore && !loadingInitial) {
      fetchPage(n, false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (canPrev) goToPage(currentPage - 1);
  };

  const handleNext = () => {
    if (canNext) goToPage(currentPage + 1);
  };

  // currently displayed posts
  const currentPosts = pagesData[currentPage - 1] || [];

  // ---- Compact pager with ellipsis (matches Premium) ----
  const Pagination = () => {
    if (effectiveTotalPages <= 1) return null;

    const pushBtn = (n) => (
      <button
        key={n}
        className={`pager-btn ${n === currentPage ? "active" : ""}`}
        onClick={() => goToPage(n)}
        disabled={n === currentPage}
      >
        {n}
      </button>
    );

    const dots = (key) => (
      <span key={key} className="pager-ellipsis">
        …
      </span>
    );

    const btns = [];
    // Always show first
    btns.push(pushBtn(1));

    // Left dots
    if (currentPage > 3) btns.push(dots("l"));

    // Middle neighbors
    for (
      let n = Math.max(2, currentPage - 1);
      n <= Math.min(effectiveTotalPages - 1, currentPage + 1);
      n++
    ) {
      if (n > 1 && n < effectiveTotalPages) btns.push(pushBtn(n));
    }

    // Right dots
    if (currentPage < effectiveTotalPages - 2) btns.push(dots("r"));

    // Always show last
    if (effectiveTotalPages > 1) btns.push(pushBtn(effectiveTotalPages));

    return (
      <div className="pager">
        <button className="pager-nav" onClick={handlePrev} disabled={!canPrev}>
          ← Prev
        </button>
        {btns}
        <button className="pager-nav" onClick={handleNext} disabled={!canNext}>
          Next →
        </button>
      </div>
    );
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

      {/* initial load / error / content */}
      {loadingInitial ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : error && pagesData.length === 0 ? (
        <div className="error-block">
          <p>{error.message}</p>
          <button className="retry-btn" onClick={handleRetry}>
            Retry
          </button>
        </div>
      ) : currentPosts.length === 0 ? (
        <p>No posts found under this category.</p>
      ) : (
        <>
          {/* Pager (top) */}
          <Pagination />

          {/* Posts grid for current page */}
          <div className="category-posts-container">
            {currentPosts.map((post) => {
              const isLocked = post.isPremium && (!user || !user.isSubscriber);
              const target = isLocked ? "/subscribe" : `/post/${post._id}`;
              const imgSrc =
                post.image &&
                (post.image.startsWith("http") ? post.image : `${API_URL}/${post.image}`);

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
                      <p>
                        <strong>Category:</strong> {post.category || "Uncategorized"}
                      </p>
                      <p>
                        <strong>Published:</strong>{" "}
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Optional inline next-page spinner (kept for UX parity) */}
          {loadingMore && (
            <div className="infinite-spinner" style={{ marginTop: 12 }}>
              <span className="spinner" />
            </div>
          )}

          {/* Pager (bottom) */}
          <Pagination />
        </>
      )}

      {/* error while navigating more pages */}
      {!loadingInitial && error && pagesData.length > 0 && (
        <div className="error-inline">
          <span>{error.message}</span>
          <button className="retry-btn small" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default CategoryPosts;
