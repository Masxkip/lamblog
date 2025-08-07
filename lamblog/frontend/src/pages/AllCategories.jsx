// AllCategories.jsx with paginated post fetching and category block pagination (3-category batches)

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);        // network loading
  const [batchLoading, setBatchLoading] = useState(false); // UI spinner for 3-category reveal
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [visibleCategories, setVisibleCategories] = useState(3); // show 3 category sections at a time
  const observer = useRef();
  const navigate = useNavigate();

  // Fetch posts in pages to build categories client-side
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await axios.get(`${API_URL}/api/posts?page=${page}&limit=60`);
        setPosts((prev) => [...prev, ...res.data.posts]);
        setHasMore(res.data.hasMore);
      } catch (err) {
        setError(true);
        console.error("Failed to fetch posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [page]);

  // Trending sidebar
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

  // Filter & group posts into categories
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
    if (!formattedCategory) return;
    if (!postsByCategory[formattedCategory]) postsByCategory[formattedCategory] = [];
    postsByCategory[formattedCategory].push(post);
  });

  const categoryEntries = Object.entries(postsByCategory);

  // Reset visible groups when search changes
  useEffect(() => {
    setVisibleCategories(3);
  }, [searchTerm]);

  // IO: after the last visible category intersects, reveal 3 more; if we lack data for more groups, fetch next page
  const lastCategoryRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;

          // UI spinner for the next batch reveal, regardless of network fetch
          setBatchLoading(true);
          setTimeout(() => setBatchLoading(false), 700); // tweak duration to taste

          // Reveal next 3 category sections
          const nextVisible = visibleCategories + 3;
          setVisibleCategories(nextVisible);

          // If we won't have enough grouped categories for the *next* slice, fetch another page
          const needMoreGroupsSoon = categoryEntries.length < nextVisible + 3;
          if (needMoreGroupsSoon && hasMore && !loading) {
            setPage((prev) => prev + 1);
          }
        },
        { rootMargin: "200px" } // trigger slightly early for smoother loading
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, visibleCategories, categoryEntries.length]
  );

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
          {filteredPosts.length !== 1 ? "s" : ""} for: <strong>"{searchTerm}"</strong>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="full-page-spinner">
          <span className="spinner1" />
        </div>
      ) : categoryEntries.length === 0 ? (
        <div className="no-posts-message">
          <p>No posts available for your search.</p>
        </div>
      ) : (
        (() => {
          const visibleCategoryEntries = categoryEntries.slice(0, visibleCategories);
          return visibleCategoryEntries.map(([category, posts], index) => {
            const isLastVisible = index === visibleCategoryEntries.length - 1;

            return (
              <React.Fragment key={category}>
                <section
                  className="category-block"
                  ref={isLastVisible ? lastCategoryRef : null}
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
                                <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
                                <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
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
                            {post.views ? post.views.toLocaleString() + " views" : "Popular post"}
                          </small>
                        </div>
                        <MoreHorizontal size={18} />
                      </Link>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          });
        })()
      )}

      {(batchLoading || (loading && posts.length > 0)) && (
        <div className="infinite-spinner">
          <span className="spinner" />
        </div>
      )}

      {error && (
        <div className="error-message">
          Failed to load posts. Please try again later.
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default AllCategories;
