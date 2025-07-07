import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import DynamicArrow from "../components/DynamicArrow";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryPosts() {
  const { name } = useParams(); 
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizedCategory = name
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts?category=${encodeURIComponent(normalizedCategory)}`);

           // Sort by createdAt (newest first)
           const sortedPosts = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
           setPosts(sortedPosts);

      } catch (err) {
        console.error("Failed to fetch posts by category", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [normalizedCategory]);

  return (
    <div className="category-posts-page">
      <div className="category-header-row">
  <BackArrow />
  <h2 className="category-title-text">
    All Posts in <span style={{ color: "#6a1bbd" }}>#{normalizedCategory}</span>
  </h2>
  <DynamicArrow />
</div>


      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts found under this category.</p>
      ) : (
        <div className="category-posts-container">
          {posts.map((post) => (
            <div key={post._id} className="category-post-card">
              <Link to={`/post/${post._id}`}>
                <Link to={`/profile/${post.author._id}`} className="category-profile-link">
                  @{post.author.username}
                </Link>
                <br />
{post.image && (
  <div className="fixed-image-wrapper2">
    <img
      src={post.image}
      alt="Post"
      className="fixed-image2"
    />
  </div>
)}
                <h3>#{post.title}</h3>
                <p>{post.content.substring(0, 100)}...</p>
              </Link>
              <p><strong>Category:</strong> {post.category}</p>
              <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}

export default CategoryPosts;
