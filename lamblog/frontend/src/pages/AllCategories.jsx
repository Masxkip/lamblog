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
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const observer = useRef();

  const navigate = useNavigate();

useEffect(() => {
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts?page=1&limit=50`);
      setPosts(res.data.posts || []); // ✅ use array from backend
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };
  fetchPosts();
}, []);


  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts/trending/posts`);
        setTrendingPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch trending posts", err);
      }
    };
    fetchTrending();
  }, []);

  const filteredPosts = posts.filter(
    (post) =>
      post.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPosts = filteredPosts.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const postsByCategory = {};
  sortedPosts.forEach((post) => {
    const formattedCategory = post.category
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (!postsByCategory[formattedCategory]) postsByCategory[formattedCategory] = [];
    postsByCategory[formattedCategory].push(post);
  });

  const categoryEntries = Object.entries(postsByCategory);

  const lastCategoryRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < categoryEntries.length) {
        setTimeout(() => {
          setVisibleCount((prev) => prev + 3);
        }, 800);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, visibleCount, categoryEntries.length]);

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

      {loading ? (
           <div className="full-page-spinner">
    <span className="spinner1" />
  </div>
      ) : categoryEntries.length === 0 ? (
        <div className="no-posts-message">
          <p>No posts available for your search.</p>
        </div>
      ) : (
        categoryEntries.slice(0, visibleCount).map(([category, posts], index) => {
          const isLast = index === visibleCount - 1;

          return (
            <React.Fragment key={category}>
              <section
                className="category-block"
                ref={isLast ? lastCategoryRef : null}
              >
                <h2 className="category-title">#{category}</h2>

                <div className="category-slider">
                  {posts.slice(0, 5).map((post) => {
                    const isLocked = post.isPremium && (!user || !user.isSubscriber);
                    const target = isLocked ? "/subscribe" : `/post/${post._id}`;

                    return (
                      <div className="slider-post-card" key={post._id}>
                        <Link to={target} className="slider-post-card-link">
                          <div className="slider-post-card-inner">
                            {/* Image section */}
                            {post.image && (
                              <div className={`fixed-image-wrapper1 ${isLocked ? "premium-locked" : ""}`}>
                                <img
                                  src={post.image.startsWith("http") ? post.image : `${API_URL}/${post.image}`}
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

                            {/* Text content */}
                            <div className="slider-post-card-content">
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
                              <h3 className="slider-post-card-title">#{post.title}</h3>
                              <p className="slider-post-card-snippet">
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

              {index === 1 && (
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
                            ? post.views.toLocaleString() + " views"
                            : "Popular post"}
                        </small>
                      </div>
                      <MoreHorizontal size={18} />
                    </Link>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })
      )}

      {visibleCount < categoryEntries.length && (
        <div className="infinite-spinner">
          <span className="spinner" />
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default AllCategories;
