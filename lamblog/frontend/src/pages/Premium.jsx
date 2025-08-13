// Premium.jsx — indexed pagination (6 per page), dark-theme pager

import { useState, useEffect, useContext, useCallback } from "react";
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

  const [premiumPosts, setPremiumPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // index pagination
  const [page, setPage] = useState(1);

  const fetchPremium = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/posts/premium/posts`, { timeout: 15000 });
      setPremiumPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch premium posts", err);
      setError("Failed to load premium posts. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []); // (intentionally excluding API_URL to avoid ESLint warning)

  useEffect(() => {
    fetchPremium();
  }, [fetchPremium]);

  // Filter
  const needle = search.toLowerCase();
  const filteredPosts = premiumPosts.filter((post) =>
    (post.title || "").toLowerCase().includes(needle) ||
    (post.content || "").toLowerCase().includes(needle) ||
    (post.category || "").toLowerCase().includes(needle) ||
    (post.author?.username || "").toLowerCase().includes(needle)
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Paging math
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PER_PAGE));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * PER_PAGE;
  const current = filteredPosts.slice(start, start + PER_PAGE);

  const go = (n) => setPage(Math.min(Math.max(1, n), totalPages));

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const items = [];

    const pushBtn = (n) =>
      items.push(
        <button
          key={n}
          className={`pager-btn ${n === clampedPage ? "active" : ""}`}
          onClick={() => go(n)}
          disabled={n === clampedPage}
        >
          {n}
        </button>
      );

    const ellipsis = (key) => <span key={key} className="pager-ellipsis">…</span>;

    // compact: 1 … (p-1 p p+1) … last
    pushBtn(1);
    if (clampedPage > 3) items.push(ellipsis("l"));
    for (let n = Math.max(2, clampedPage - 1); n <= Math.min(totalPages - 1, clampedPage + 1); n++) {
      pushBtn(n);
    }
    if (clampedPage < totalPages - 2) items.push(ellipsis("r"));
    if (totalPages > 1) pushBtn(totalPages);

    return (
      <div className="pager">
        <button className="pager-nav" onClick={() => go(clampedPage - 1)} disabled={clampedPage === 1}>
          ← Prev
        </button>
        {items}
        <button className="pager-nav" onClick={() => go(clampedPage + 1)} disabled={clampedPage === totalPages}>
          Next →
        </button>
      </div>
    );
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

      {loading ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : error ? (
        <div className="error-block">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchPremium}>Retry</button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="premium-page-status">No premium posts found{search ? " for your search." : "."}</p>
      ) : (
        <>
          {search && (
            <div className="search-results-heading">
              Showing {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""} for:{" "}
              <strong>"{search}"</strong>
            </div>
          )}

          {/* Top pager */}
          <Pagination />

          <div className="premium-page-grid">
            {current.map((post) => (
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

          {/* Bottom pager */}
          <Pagination />
        </>
      )}
    </div>
  );
}

export default Premium;
