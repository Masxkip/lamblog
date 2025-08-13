import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import { MoreHorizontal, Check, Lock } from "lucide-react";
import AuthContext from "../context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const CATS_PER_PAGE = 6;
const POSTS_PER_CATEGORY = 5;

function AllCategories() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Categories list + loading state ---
  const [categories, setCategories] = useState([]);     // array of strings
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState("");

  // --- UI paging over categories ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- Search filters categories by name ---
  const [searchTerm, setSearchTerm] = useState("");

  // --- Cache posts per category to avoid refetch on page change ---
  const [catPostsCache, setCatPostsCache] = useState({});   // { [category]: Post[] }
  const [catFetchState, setCatFetchState] = useState({});   // { [category]: "idle"|"loading"|"error" }

  // --- Trending (unchanged) ---
  const [trendingPosts, setTrendingPosts] = useState([]);

  // ---------- Fetch categories once ----------
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCatsLoading(true);
      setCatsError("");
      try {
        const res = await axios.get(`${API_URL}/api/posts/categories`, { timeout: 10000 });
        const list = Array.isArray(res.data) ? res.data : [];

        // Normalize to Title Case with single spaces (matches your server normalization)
        const normalized = list
          .filter(Boolean)
          .map((c) =>
            c
              .trim()
              .toLowerCase()
              .replace(/\s+/g, " ")
              .replace(/\b\w/g, (ch) => ch.toUpperCase())
          );

        if (!cancelled) setCategories(normalized);
      } catch (err) {
        if (!cancelled) setCatsError("Failed to load categories.");
        console.error("Categories fetch error:", err);
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Fetch trending (once) ----------
  useEffect(() => {
    let cancelled = false;

    async function loadTrending() {
      try {
        const res = await axios.get(`${API_URL}/api/posts/trending/posts`, { timeout: 10000 });
        if (!cancelled) setTrendingPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch trending posts", err);
        if (!cancelled) setTrendingPosts([]);
      }
    }

    loadTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Filter & paginate categories (client-side) ----------
  const filteredCategories = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return categories;
    return categories.filter((c) => c.toLowerCase().includes(t));
  }, [categories, searchTerm]);

  const totalPages = useMemo(
    () => (filteredCategories.length ? Math.ceil(filteredCategories.length / CATS_PER_PAGE) : 0),
    [filteredCategories.length]
  );

  // Clamp currentPage when search/filter changes
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const pageStart = (Math.max(currentPage, 1) - 1) * CATS_PER_PAGE;
  const pageCategories = filteredCategories.slice(pageStart, pageStart + CATS_PER_PAGE);

  // ---------- Fetch posts for categories visible on the current page ----------
  useEffect(() => {
    let cancelled = false;

    async function fetchCategoryPosts(category) {
      // skip if cached or already loading
      if (catPostsCache[category] || catFetchState[category] === "loading") return;

      setCatFetchState((s) => ({ ...s, [category]: "loading" }));
      try {
        const res = await axios.get(`${API_URL}/api/posts`, {
          params: { category, limit: POSTS_PER_CATEGORY },
          timeout: 10000,
        });

        if (!cancelled) {
          const posts = Array.isArray(res.data?.posts) ? res.data.posts : [];
          setCatPostsCache((cache) => ({ ...cache, [category]: posts }));
          setCatFetchState((s) => ({ ...s, [category]: "idle" }));
        }
      } catch (err) {
        console.error(`Failed to load posts for category "${category}"`, err);
        if (!cancelled) {
          setCatFetchState((s) => ({ ...s, [category]: "error" }));
        }
      }
    }

    // fetch missing categories in parallel
    pageCategories.forEach((cat) => fetchCategoryPosts(cat));

    return () => {
      cancelled = true;
    };
  }, [pageCategories, catPostsCache, catFetchState]);

  // ---------- Pagination controls ----------
  const goToPage = (n) => {
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
    // (optional) scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const PaginationBar = () => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="pagination">
        <button
          className="pg-btn"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          ← Prev
        </button>

        <div className="pg-pages">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`pg-num ${p === currentPage ? "active" : ""}`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          className="pg-btn"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          Next →
        </button>
      </div>
    );
  };

  // ---------- Render ----------
  return (
    <div className="all-categories-page">
      <div className="category-searchbar-wrapper">
        <button className="back-icon" onClick={() => navigate(-1)}>
          <BackArrow />
        </button>

        <input
          type="text"
          placeholder="Search categories…"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset to first page on new search
          }}
          className="category-search-bar"
        />
      </div>

      {searchTerm && (
        <div className="search-results-heading">
          Showing {filteredCategories.length} categor
          {filteredCategories.length === 1 ? "y" : "ies"} for: <strong>"{searchTerm}"</strong>
        </div>
      )}

      {/* Categories list loader / error */}
      {catsLoading ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : catsError ? (
        <div className="error-message">
          {catsError}
          <button onClick={() => {
            // simple retry: re-run mount effect by toggling a local key (or just reload)
            window.location.reload();
          }}>Retry</button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="no-posts-message">
          <p>No categories found.</p>
        </div>
      ) : (
        <>
          {/* Top pager */}
          <PaginationBar />

          {/* Category blocks for current page */}
          {pageCategories.map((category, index) => {
            const postsInCat = catPostsCache[category] || [];
            const state = catFetchState[category] || "idle";
            const isLoading = state === "loading";
            const isError = state === "error";

            return (
              <React.Fragment key={category}>
                <section className="category-block">
                  <h2 className="category-title">#{category}</h2>

                  {/* Posts list or small loader per category */}
                  {isLoading ? (
                    <div className="category-inline-spinner">
                      <span className="spinner" />
                    </div>
                  ) : isError ? (
                    <div className="error-message">
                      Failed to load posts for #{category}.
                      <button
                        onClick={async () => {
                          // force refetch on this category
                          setCatPostsCache((cache) => {
                            const copy = { ...cache };
                            delete copy[category];
                            return copy;
                          });
                          setCatFetchState((s) => ({ ...s, [category]: "idle" }));
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : postsInCat.length === 0 ? (
                    <p className="empty-category">No posts in this category yet.</p>
                  ) : (
                    <div className="category-slider">
                      {postsInCat.slice(0, POSTS_PER_CATEGORY).map((post) => {
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
                                        {/* icon size tiny for consistency */}
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
                  )}

                  <Link
                    to={`/category/${encodeURIComponent(category)}`}
                    className="view-all-premium-btn"
                  >
                    View All Posts →
                  </Link>

                  <hr className="category-divider" />
                </section>

                {/* Keep Trending after the second block as before */}
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
          })}

          {/* Bottom pager */}
          <PaginationBar />
        </>
      )}

      <BottomNav />
    </div>
  );
}

export default AllCategories;
