import { useState, useEffect, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import BackArrow from "../components/BackArrow";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function Premium() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ⛔ Guard: if somehow a non-subscriber lands here, boot them out
  useEffect(() => {
    if (!user?.isSubscriber) {
      navigate("/subscribe");
    }
  }, [user, navigate]);

  const [premiumPosts, setPremiumPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch premium posts (only once)
  const fetchPremium = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/posts/premium/posts`);
      setPremiumPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch premium posts", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPremium();
  }, [fetchPremium]);

  // Client-side search filter
  const filteredPosts = premiumPosts.filter((post) => {
    const needle = search.toLowerCase();
    return (
      post.title.toLowerCase().includes(needle) ||
      post.content.toLowerCase().includes(needle) ||
      post.category?.toLowerCase().includes(needle) ||
      post.author.username.toLowerCase().includes(needle)
    );
  });

  return (
<div className="premium-page-container">
  {/* Sticky Back Arrow + Search Bar */}
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
    <p className="premium-page-status">Loading premium content…</p>
  ) : filteredPosts.length === 0 ? (
    <p className="premium-page-status">No premium posts found for your search.</p>
  ) : (
    <>
      {/* ✅ Optional Search Summary Row */}
      {search && (
        <div className="search-results-heading">
          Showing {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""} for: <strong>"{search}"</strong>
        </div>
      )}

      {/* ✅ Consistent 3-Column Grid Layout */}
      <div className="premium-page-grid">
        {filteredPosts.map((post) => (
          <Link
            to={`/post/${post._id}`}
            key={post._id}
            className="premium-page-card-link"
          >
            <div className="premium-page-card">
              {post.image && (
                <div className="premium-page-image-wrapper">
                  <img
                    src={
                      post.image.startsWith("http")
                        ? post.image
                        : `${API_URL}/${post.image}`
                    }
                    alt={post.title}
                    className="premium-page-image"
                  />
                </div>
              )}

              <div className="premium-page-card-content">
                <p className="premium-page-author">@{post.author.username}</p>
                <h3 className="premium-page-title">#{post.title}</h3>
                <p className="premium-page-snippet">
                  {post.content.substring(0, 80)}...
                </p>
                <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
                <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )}
</div>

  );
}

export default Premium;
