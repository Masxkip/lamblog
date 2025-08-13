// Premium.jsx — server-paginated premium posts with ellipsis pager

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import BackArrow from "../components/BackArrow";
import { Check } from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;
const PER_PAGE = 6;

function Premium() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ⛔ Redirect if not subscribed
  useEffect(() => {
    if (user && !user.isSubscriber) navigate("/subscribe");
  }, [user, navigate]);

  const [pagesData, setPagesData] = useState([]);  // pagesData[0] = page 1
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null); // computed from total/limit
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null); // { message }
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [search, setSearch] = useState("");

  const abortRef = useRef(null);

  // online/offline indicators
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
          params: {
            isPremium: true,
            page: pageToLoad,
            limit: PER_PAGE,
            ...(search ? { search } : {}),
          },
          signal: controller.signal,
          timeout: 15000,
        });

        const list = Array.isArray(res.data?.posts) ? res.data.posts : [];
        const total = typeof res.data?.total === "number" ? res.data.total : null;

        if (isFirstPage && total != null) {
          setTotalPages(Math.max(1, Math.ceil(total / PER_PAGE)));
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
        let message = "Failed to load premium posts. Please try again.";
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
    [isOffline, search] // (intentionally excluding API_URL)
  );

  // initial load + cleanup
  useEffect(() => {
    setPagesData([]);
    setCurrentPage(1);
    setTotalPages(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchPage(1, true);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPage]);

  // reset + refetch when search changes
  useEffect(() => {
    setPagesData([]);
    setCurrentPage(1);
    setTotalPages(null);
    setError(null);
    fetchPage(1, true);
  }, [search, fetchPage]);

  const totalLoadedPages = pagesData.length;
  const effectiveTotalPages =
    totalPages != null ? totalPages : totalLoadedPages; // total should be set on first page

  const canPrev = currentPage > 1;
  const canNext = totalPages != null ? currentPage < effectiveTotalPages : true;

  const goToPage = (n) => {
    if (n < 1 || (totalPages != null && n > effectiveTotalPages)) return;
    if (n <= totalLoadedPages) {
      setCurrentPage(n);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!loadingMore && !loadingInitial) {
      fetchPage(n, false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => canPrev && goToPage(currentPage - 1);
  const handleNext = () => canNext && goToPage(currentPage + 1);

  const currentPosts = pagesData[currentPage - 1] || [];

  const Pagination = () => {
    // always show the bar; if we still don't know total yet (very rare), fallback to loaded pages
    const tp = effectiveTotalPages || 1;

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
    const dots = (key) => <span key={key} className="pager-ellipsis">…</span>;

    if (tp === 1) {
      return (
        <div className="pager">
          <button className="pager-nav" disabled>← Prev</button>
          <button className="pager-btn active" disabled>1</button>
          <button className="pager-nav" disabled>Next →</button>
        </div>
      );
    }

    const btns = [];
    btns.push(pushBtn(1));
    if (currentPage > 3) btns.push(dots("l"));
    for (let n = Math.max(2, currentPage - 1); n <= Math.min(tp - 1, currentPage + 1); n++) {
      if (n > 1 && n < tp) btns.push(pushBtn(n));
    }
    if (currentPage < tp - 2) btns.push(dots("r"));
    btns.push(pushBtn(tp));

    return (
      <div className="pager">
        <button className="pager-nav" onClick={handlePrev} disabled={!canPrev}>← Prev</button>
        {btns}
        <button className="pager-nav" onClick={handleNext} disabled={currentPage === tp}>Next →</button>
      </div>
    );
  };

  const handleRetry = () => {
    setError(null);
    if (pagesData.length === 0) fetchPage(1, true);
    else fetchPage(currentPage, false);
  };

  return (
    <div className="premium-page-container">
      {/* Sticky Back + Search */}
      <div className="premium-page-searchbar-wrapper">
        <button className="back-icon" onClick={() => navigate(-1)}>
          <BackArrow />
        </button>

        <input
          type="text"
          placeholder="Search categories or titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="premium-page-searchbar"
        />
      </div>

      {/* offline banner */}
      {isOffline && (
        <div className="network-banner offline">
          You’re offline. We’ll resume loading when you’re back online.
        </div>
      )}

      {loadingInitial ? (
        <div className="full-page-spinner"><span className="spinner1" /></div>
      ) : error && pagesData.length === 0 ? (
        <div className="error-block">
          <p>{error.message}</p>
          <button className="retry-btn" onClick={handleRetry}>Retry</button>
        </div>
      ) : currentPosts.length === 0 ? (
        <p className="premium-page-status">No premium posts found{search ? " for your search." : "."}</p>
      ) : (
        <>
          {/* Top pager */}
          <Pagination />

          {/* Grid */}
          <div className="premium-page-grid">
            {currentPosts.map((post) => (
              <Link to={`/post/${post._id}`} key={post._id} className="premium-page-card-link">
                <div className="premium-page-card">
                  {post.image && (
                    <div className="premium-page-image-wrapper">
                      <img
                        src={post.image.startsWith("http") ? post.image : `${API_URL}/${post.image}`}
                        alt={post.title}
                        className="premium-page-image"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="premium-page-card-content">
                    <div className="profile-link verified-user">
                      <span className="slider-post-card-author">@{post.author?.username}</span>
                      {post.author?.isSubscriber && (
                        <span className="verified-circle">
                          <Check size={12} color="white" strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <h3 className="premium-page-title">#{post.title}</h3>
                    <p className="premium-page-snippet">{post.content?.substring(0, 80)}...</p>
                    <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
                    <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Inline loading for next pages */}
          {loadingMore && (
            <div className="infinite-spinner" style={{ marginTop: 12 }}>
              <span className="spinner" />
            </div>
          )}

          {/* Bottom pager */}
          <Pagination />
        </>
      )}
    </div>
  );
}

export default Premium;
