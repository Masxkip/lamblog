import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
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

  // data
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);

  // search + UI
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(3); // client "pagination" for category blocks
  const [pageLoading, setPageLoading] = useState(false); // small spinner between category chunks

  // initial load / error states
  const [loadingInitial, setLoadingInitial] = useState(true); // full-page spinner
  const [loadError, setLoadError] = useState(false);
  const [showError, setShowError] = useState(false); // flip after 10s when there's an error
  const errorTimeoutRef = useRef(null);

  // sentinel to reveal next 3 category blocks
  const sentinelRef = useRef(null);
  const ioRef = useRef(null);

  const navigate = useNavigate();

  // ---------- Fetch posts once (bigger limit so we can group client-side) ----------
  const fetchAllPosts = useCallback(async () => {
    // reset states for a fresh attempt
    setLoadingInitial(true);
    setLoadError(false);
    setShowError(false);

    // start a 10s timer: if request fails, we keep spinner up until this fires, then show error panel
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setShowError(true);
      setLoadingInitial(false);
    }, 10000);

    try {
      const res = await axios.get(`${API_URL}/api/posts?limit=200&page=1`);
      const list = Array.isArray(res.data?.posts) ? res.data.posts : [];
      setPosts(list);
      setLoadingInitial(false);
      setLoadError(false);
      // success → cancel the 10s error swap
      clearTimeout(errorTimeoutRef.current);
    } catch (err) {
      console.error("Failed to fetch posts", err);
      setLoadError(true);
      // keep loadingInitial=true; after 10s the timer will flip to the error panel
    }
  }, []);

  useEffect(() => {
    fetchAllPosts();
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [fetchAllPosts]);

  // ---------- Fetch trending (independent; failure here doesn't affect main spinner/error) ----------
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/trending/posts`);
        setTrendingPosts(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.warn("Trending fetch failed (non-blocking).", e);
      }
    };
    run();
  }, []);

  // ---------- Derive categories client-side ----------
  const filteredPosts = useMemo(() => {
    const list = Array.isArray(posts) ? posts : [];
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (p) =>
        p?.category?.toLowerCase().includes(q) ||
        p?.title?.toLowerCase().includes(q)
    );
  }, [posts, searchTerm]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [filteredPosts]);

  const categoryEntries = useMemo(() => {
    const byCat = {};
    sortedPosts.forEach((post) => {
      const cat =
        post?.category
          ?.trim()
          .toLowerCase()
          .replace(/\s+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()) || "Uncategorized";
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(post);
    });
    return Object.entries(byCat);
  }, [sortedPosts]);

  // ---------- Reset client "pagination" on search ----------
  useEffect(() => {
    setVisibleCount(3);
    setPageLoading(false);
  }, [searchTerm]);

  // ---------- IntersectionObserver for sentinel (load next 3 category blocks) ----------
  useEffect(() => {
    if (loadingInitial) return; // don't start chunking until initial load is done
    if (ioRef.current) ioRef.current.disconnect();

    ioRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;

        const hasMore = visibleCount < categoryEntries.length;
        if (hasMore && !pageLoading) {
          setPageLoading(true);
          // simulate a brief load to show spinner even on fast machines
          const t = setTimeout(() => {
            setVisibleCount((v) => Math.min(v + 3, categoryEntries.length));
            setPageLoading(false);
          }, 550);
          // cleanup that timer if observer disconnects early
          return () => clearTimeout(t);
        }
      },
      { rootMargin: "200px" }
    );

    if (sentinelRef.current) ioRef.current.observe(sentinelRef.current);
    return () => ioRef.current?.disconnect();
  }, [loadingInitial, visibleCount, categoryEntries.length, pageLoading]);

  // ---------- Render ----------
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

      {/* Initial load phase */}
      {loadingInitial && !showError && (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      )}

      {/* Initial error after 10s */}
      {!loadingInitial && showError && loadError && (
        <div className="error-message">
          <p>We couldn't load posts. Please check your connection.</p>
          <button
            onClick={() => {
              fetchAllPosts();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content */}
      {!loadingInitial && !showError && (
        <>
          {categoryEntries.length === 0 ? (
            <div className="no-posts-message">
              <p>No posts available for your search.</p>
            </div>
          ) : (
            categoryEntries
              .slice(0, visibleCount)
              .map(([category, postsInCat]) => (
                <section className="category-block" key={category}>
                  <h2 className="category-title">#{category}</h2>

                  <div className="category-slider">
                    {postsInCat.slice(0, 5).map((post) => {
                      const isLocked =
                        post.isPremium && (!user || !user.isSubscriber);
                      const target = isLocked
                        ? "/subscribe"
                        : `/post/${post._id}`;

                      return (
                        <div className="slider-post-card" key={post._id}>
                          <Link to={target} className="slider-post-card-link">
                            <div className="slider-post-card-inner">
                              {/* Image section */}
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

                              {/* Text content */}
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
              ))
          )}

          {/* Small spinner + sentinel for client "pagination" */}
          {visibleCount < categoryEntries.length && (
            <>
              {pageLoading && (
                <div className="infinite-spinner">
                  <span className="spinner" />
                </div>
              )}
              <div ref={sentinelRef} style={{ height: 1 }} />
            </>
          )}

          {/* Trending inserts after second block (kept from your version) */}
          {categoryEntries.length > 2 && (
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
        </>
      )}

      <BottomNav />
    </div>
  );
}

export default AllCategories;
