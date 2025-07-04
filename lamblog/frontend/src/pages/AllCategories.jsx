import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import { MoreHorizontal } from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function AllCategories() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all posts......
  useEffect(() => {
    const fetchPosts = async () => {
      try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
      } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false); // ✅ Done loading
     }
    };
    fetchPosts();
  }, []);

  // Fetch trending posts
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

  // Filter posts based on search
  const filteredPosts = posts.filter(post =>
    post.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );


// Sort filtered posts by date (newest first)
const sortedPosts = filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// Group sorted posts by category
const postsByCategory = {};
sortedPosts.forEach(post => {
  const formattedCategory = post.category?.trim().toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  if (!postsByCategory[formattedCategory]) postsByCategory[formattedCategory] = [];
  postsByCategory[formattedCategory].push(post);
});

  const categoryEntries = Object.entries(postsByCategory);

  return (
    <div className="all-categories-page">
      {/* Sticky Search Bar */}
      <div className="sticky-category-search">
        <input
          type="text"
          placeholder="Search categories or titles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="category-search-bar"
        />
      </div>

      {/* Category Se with Trending Inserted After 2nd */}
        {loading ? (
          <div className="loading-posts-message">
            <p>Loading posts...</p>
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
              {posts.slice(0, 5).map((post) => (
                <div className="slider-post-card" key={post._id}>
                  {post.image && (
                    <img
                    src={post.image}
                    alt="Post"
                    className="slider-post-image"
                  />
                  )}

                  <div className="slider-post-content">
                    <Link to={`/profile/${post.author._id}`} className="profile-link">
                      @{post.author.username}
                    </Link>
                    <Link to={`/post/${post._id}`}>
                      <h3>#{post.title}</h3>
                      <p>{post.content.substring(0, 80)}...</p>
                    </Link>
                    <p><strong>Category:</strong> {post.category}</p>
                    <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to={`/category/${encodeURIComponent(category)}`} className="view-all-link">
              View All Posts &rarr;
            </Link>

            <hr className="category-divider" />
          </section>

          {/* Insert Trending After 2nd Category Block */}
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
