import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";   // ⬅️ NEW
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import { MoreHorizontal, Lock } from "lucide-react";
import AuthContext from "../context/AuthContext";


const API_URL = import.meta.env.VITE_BACKEND_URL;

function AllCategories() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();                       // ⬅️ NEW

  /* ---------- Fetch all posts ---------- */
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts`);
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  /* ---------- Fetch trending ---------- */
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/posts/trending/posts`
        );
        setTrendingPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch trending posts", err);
      }
    };
    fetchTrending();
  }, []);

  /* ---------- Filtering + grouping ---------- */
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
    if (!postsByCategory[formattedCategory])
      postsByCategory[formattedCategory] = [];
    postsByCategory[formattedCategory].push(post);
  });

  const categoryEntries = Object.entries(postsByCategory);

  /* ---------- JSX ---------- */
  return (
    <div className="all-categories-page">
      {/* STICKY: back arrow + search bar */}
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

      {/* Optional “showing results for” label */}
      {searchTerm && (
        <div className="search-results-heading">
          Showing {filteredPosts.length} result
          {filteredPosts.length !== 1 ? "s" : ""} for:{" "}
          <strong>"{searchTerm}"</strong>
        </div>
      )}

      {/* --------- CONTENT --------- */}
      {loading ? (
        <div className="loading-posts-message">
          <p>Loading posts…</p>
        </div>
      ) : categoryEntries.length === 0 ? (
        <div className="no-posts-message">
          <p>No posts available for your search.</p>
        </div>
      ) : (
        categoryEntries.map(([category, posts], index) => (
          <React.Fragment key={category}>
            <section className="category-block">
              <h2 className="category-title">#{category}</h2>

              <div className="category-slider">
               {posts.slice(0, 5).map((post) => {
  const isLocked = post.isPremium && (!user || !user.isSubscriber);
  const target   = isLocked ? "/subscribe" : `/post/${post._id}`;

  return (
    <Link to={target} key={post._id} className="slider-post-card">
      {/* --- Image / lock overlay --- */}
      {post.image && (
        <div
          className={`fixed-image-wrapper1 ${isLocked ? "premium-locked" : ""}`}
        >
          <img
            src={post.image}
            alt="Post"
            className={`fixed-image1 ${isLocked ? "blurred-content" : ""}`}
          />

          {isLocked && (
            <div className="locked-banner small" onClick={(e) => e.stopPropagation()}>
              <Lock size={14} style={{ marginRight: "6px" }} />
              Subscribe to view
            </div>
          )}
        </div>
      )}

      {/* --- Text --- */}
      <div className="slider-post-content">
        <p className="premium-page-author">@{post.author.username}</p>
        <h3 className="premium-page-title">#{post.title}</h3>
        <p className="premium-page-snippet">
          {post.content.substring(0, 80)}…
        </p>
        <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
        <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
      </div>
    </Link>
  );
})}

              </div>

              <Link
                to={`/category/${encodeURIComponent(category)}`}
                className="view-all-link"
              >
                View All Posts →
              </Link>

              <hr className="category-divider" />
            </section>

            {/* Insert Trending after 2nd category */}
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
                      <span className="premium-title">#{post.title}</span>
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
        ))
      )}

      <BottomNav />
    </div>
  );
}

export default AllCategories;
