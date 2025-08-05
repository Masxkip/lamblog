import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import BackArrow from "../components/BackArrow";
import { Check } from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function Premium() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ⛔ Redirect if not subscribed
  useEffect(() => {
    if (!user?.isSubscriber) {
      navigate("/subscribe");
    }
  }, [user, navigate]);

  const [premiumPosts, setPremiumPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  const observer = useRef();

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

  const filteredPosts = premiumPosts.filter((post) => {
    const needle = search.toLowerCase();
    return (
      post.title.toLowerCase().includes(needle) ||
      post.content.toLowerCase().includes(needle) ||
      post.category?.toLowerCase().includes(needle) ||
      post.author.username.toLowerCase().includes(needle)
    );
  });

  // Reset on search change
  useEffect(() => {
    setVisibleCount(6);
  }, [search]);

  // Infinite scroll logic
  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredPosts.length) {
          setTimeout(() => {
            setVisibleCount((prev) => prev + 6);
          }, 800);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, visibleCount, filteredPosts.length]
  );

return (
  <div className="premium-page-container">
    {/* Sticky Back + Search */}
    <div className="premium-page-searchbar-wrapper">
      <button className="back-icon">
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
    ) : filteredPosts.length === 0 ? (
      <p className="premium-page-status">No premium posts found for your search.</p>
    ) : (
      <>
        {search && (
          <div className="search-results-heading">
            Showing {filteredPosts.length} result
            {filteredPosts.length !== 1 ? "s" : ""} for:{" "}
            <strong>"{search}"</strong>
          </div>
        )}

        <div className="premium-page-grid">
          {filteredPosts.slice(0, visibleCount).map((post, index) => {
            const isLast = index === visibleCount - 1;

            return (
              <Link
                to={`/post/${post._id}`}
                key={post._id}
                ref={isLast ? lastPostRef : null}
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
                    <div className="profile-link verified-user">
                      <span className="slider-post-card-author">
                        @{post.author.username}
                      </span>
                      {post.author?.isSubscriber && (
                        <span className="verified-circle">
                          <Check size={12} color="white" strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <h3 className="premium-page-title">#{post.title}</h3>
                    <p className="premium-page-snippet">
                      {post.content.substring(0, 80)}...
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
            );
          })}
        </div>

        {/* Infinite scroll spinner */}
        {visibleCount < filteredPosts.length && (
          <div className="infinite-spinner">
            <span className="spinner" />
          </div>
        )}
      </>
    )}
  </div>
);

}

export default Premium;
