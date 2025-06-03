import { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { UserCircle, Home as HomeIcon, FileText } from "lucide-react";
import AuthContext from "../context/AuthContext";
import CategoryDropdown from "../components/CategoryDropdown";
import BottomNav from "../components/BottomNav";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function Home() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = [];
      if (search) queryParams.push(`search=${search}`);
      if (category) queryParams.push(`category=${category}`);
      const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";
  
      const response = await axios.get(`${API_URL}/api/posts${queryString}`);
  
      // Sort posts by createdAt (newest first)
      const sortedPosts = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
      setPosts(sortedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
    setLoading(false);
  }, [search, category]);
  

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts`);
      const uniqueCategories = [...new Set(response.data.map((post) => post.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  return (
    <div className="home-layout">
      
      {/* Sidebar */}
      <aside className="sidebar">
      <CategoryDropdown
  categories={categories}
  selectedCategory={category}
  onSelectCategory={setCategory}
/>


<div className="trending-section">
  <h3># Trending Posts</h3>
  {trendingPosts.map((post) => (
    <Link to={`/post/${post._id}`} key={post._id} className="trending-item">
      <p># {post.title}</p>
    </Link>
  ))}
</div>

      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
          {user && (
            <div className="user-info">
              <span>{user.username}</span>
              {user.profilePicture ? (
              <img 
              src={user.profilePicture} 
              alt="User" 
              className="user-avatar" 
            />
            ) : (
              <UserCircle className="default-profile-icon" size={32} />
            )}

            </div>
          )}
        </header>

        <h2># SLXXK'S Latest!</h2>
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post._id} className="post-card">
                <Link to={`/post/${post._id}`}>
                <Link to={`/profile/${post.author._id}`} className="profile-link">@{post.author.username}</Link>
                <br /> 
                {post.image && (
                  <img src={post.image} alt="Post" className="post-image" />
                )}

                <h3>#{post.title}</h3>

                {post.isPremium && (!user || !user.isSubscriber) ? (
                  <div className="premium-overlay">
                    <p className="blurred-content">{post.content.substring(0, 80)}...</p>
                    <div className="locked-banner">
                      🔒 Premium Post — <Link to="/subscribe">Subscribe to Unlock</Link>
                    </div>
                  </div>
                ) : (
                  <p>{post.content.substring(0, 100)}...</p>
                )}
              </Link>
              <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
              <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
            </div>

            ))}
          </div>
        )}
      </main>
      
      {/* Subscription Section */}
      <aside className="subscription-section">
        <h2>Subscribe for SLXXK Premium Content</h2>
        <p>Unlock exclusive posts and features by subscribing.</p>
        <button className="subscribe-btn">Subscribe</button>
        <br /> <br /> <br />
        <h2># Subscription Button Doesn't Work, Due to Prop Maintenance.</h2>
      </aside>

      <BottomNav />
     
    </div>
  );
}

export default Home;
