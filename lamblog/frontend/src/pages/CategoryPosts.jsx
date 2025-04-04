import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function CategoryPosts() {
  const { name } = useParams(); // Category from URL
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
        setPosts(res.data);
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
      
      <h2>
        All Posts in <span style={{ color: "#8a2be2" }}>#{normalizedCategory}</span>
      </h2>

      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts found under this category.</p>
      ) : (
        <div className="category-posts-container">
          {posts.map((post) => (
            <div key={post._id} className="category-post-card">
              <Link to={`/profile/${post.author._id}`} className="category-profile-link">
                @{post.author.username}
              </Link>
              <Link to={`/post/${post._id}`}>
                {post.image && (
                  <img
                    src={post.image.startsWith("http") ? post.image : `${API_URL}/${post.image}`}
                    alt="Post"
                    className="category-post-image"
                  />
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
    </div>
  );
}

export default CategoryPosts;
