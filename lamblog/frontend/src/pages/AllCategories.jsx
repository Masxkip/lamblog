import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function AllCategories() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingPosts, setTrendingPosts] = useState([]);

  // Fetch all posts......
  useEffect(() => {
    const fetchPosts = async () => {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
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

      <BackArrow />

      {/* Category Sections with Trending Inserted After 2nd */}
      {categoryEntries.map(([category, posts], index) => (
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
              <h3># Trending Posts</h3>
              <div className="trending-list">
                {trendingPosts.map((post, i) => (
                  <React.Fragment key={post._id}>
                    <Link to={`/post/${post._id}`} className="trending-item">
                      <span>#{post.title}</span>
                    </Link>
                    {i !== trendingPosts.length - 1 && <hr className="trending-divider" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
      <BottomNav />
    </div>
  );
}

export default AllCategories;
