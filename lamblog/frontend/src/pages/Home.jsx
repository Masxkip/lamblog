import { useEffect, useState, useContext, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { UserCircle, Home as HomeIcon, FileText, MoreHorizontal, Check, Lock } from "lucide-react";
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
  const [premiumPosts, setPremiumPosts] = useState([]);
  const location = useLocation();
const [subSuccess, setSubSuccess] = useState(false);
const [justSubscribed, setJustSubscribed] = useState(false);

  // Fetch post
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


    useEffect(() => {
  const fetchPremium = async () => {
    try {
      // If you added the route:
      const res = await axios.get(`${API_URL}/api/posts/premium/posts`);
      // If you DIDN’T add the route, comment the line above and use:
      // const res = { data: posts.filter(p => p.isPremium).slice(0, 3) };
      setPremiumPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch premium posts", err);
    }
  };
  fetchPremium();
}, [posts]);   // <- re-run if the main feed changes


useEffect(() => {
  const params = new URLSearchParams(location.search);
  if (params.get("subscribed") === "1") {
    setSubSuccess(true);
    setTimeout(() => setSubSuccess(false), 5000); // Hide after 5s
  }
}, [location.search]);




useEffect(() => {
  const wasSubscribed = localStorage.getItem("justSubscribed") === "true";
  if (wasSubscribed) {
    setJustSubscribed(true);
    localStorage.removeItem("justSubscribed"); // ✅ Clear it immediately
    setTimeout(() => setJustSubscribed(false), 5000); // Hide after 5s
  }
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

<div className="trending-section1">
  <h3 className="premium-heading">Trending Posts</h3>
  {trendingPosts.map((post) => (
              <Link
              to={`/post/${post._id}`}
              key={post._id}
              className="sidebar-item"
            >
              <div className="item-text">
                <small className="item-meta">
                  {post.category || "General"} · Trending
                </small>
                <span className="item-title">#{post.title}</span>
                <small className="item-meta">
                  {post.views
                    ? post.views.toLocaleString() + " views"
                    : "Popular post"}
                </small>
              </div>
              <MoreHorizontal size={18} />
            </Link>
  ))}
</div>
      </aside>
      {/* Main Content */}
      <main className="main-content">

        {subSuccess && (
  <div className="subscription-success-banner">
    Subscription successful! You now have access to all premium content.
  </div>
)}


{justSubscribed && (
  <div className="subscription-success-banner">
    🎉 Congratulations! You’re now a SLXXK Premium member. Enjoy exclusive content.
  </div>
)}



  <header className="header">
  {/* Search bars */}
  <input
    type="text"
    placeholder="Search posts..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-bar"
  />

  {user && (
    <div className="user-info">
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


       <h2>#SEEK Latest!</h2>
{loading ? (
  <p>Loading posts...</p>
) : posts.length === 0 ? (
  <div className="no-posts-message">
    <p>No posts available for your search.</p>
  </div>
) : (
  <div className="posts-grid">
{posts.map((post) => {
  const isLocked = post.isPremium && (!user || !user.isSubscriber);
  const postLink = isLocked ? "/subscribe" : `/post/${post._id}`;

  return (
    <Link to={postLink} key={post._id} className="post-card-link">
      <div className="post-card">
<Link to={`/profile/${post.author._id}`} className="profile-link verified-user">
  <span className="profile-link">@{post.author.username}</span>
  {post.author?.isSubscriber && (
  <span className="verified-circle">
    <Check size={12} color="white" strokeWidth={3} />
  </span>
)}
</Link>
        <br />

        {isLocked ? (
          <>
            <div className="post-image-wrapper premium-locked">
              {post.image && (
                <img src={post.image} alt="Premium" className="post-image" />
              )}
              <div className="locked-banner">
         <p className="locked-text">
  <Lock size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
  Premium content. Subscribe to view.
</p>
                <Link
                  to="/subscribe"
                  onClick={(e) => e.stopPropagation()}
                  className="locked-sub-btn"
                >
                  Subscribe
                </Link>
              </div>
            </div>
            <h3>#{post.title}</h3>
            <p>{post.content.substring(0, 100)}...</p>
          </>
        ) : (
          <>
            {post.image && (
              <img src={post.image} alt="Post" className="post-image" />
            )}
            <h3>#{post.title}</h3>
            <p>{post.content.substring(0, 100)}...</p>
          </>
        )}

        <p><strong>Category:</strong> {post.category || "Uncategorized"}</p>
        <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
      </div>
    </Link>
  );
})}

  </div>
)}
      </main>

  {/* Premium Section (Subscribe + 3 cards OR just 3 cards) */}
<aside className="subscription-section">
  {!user?.isSubscriber && (
    <>
      <h2>Subscribe for SLXXK Premium Content</h2>
      <p>Unlock exclusive posts and features by subscribing.</p>

      <Link to="/subscribe">
        <button className="subscribe-btn">Subscribe</button>
      </Link>
    </>
  )}

  {/* ✅ Only show heading if user is a subscriber */}
  {user?.isSubscriber && <h2>Latest on SEEK Premium</h2>}



<div className="premium-grid">
   {premiumPosts.slice(0, 3).map((post) => {
    const isLocked = !user?.isSubscriber;            // they’re all premium
    const target   = isLocked ? "/subscribe" : `/post/${post._id}`;

    return (
      <Link to={target} key={post._id} className="premium-card-link">
        <div className="premium-card">
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

          {/* ---- Image (blur if locked) ---- */}
          <div className={`premium-img-wrapper ${isLocked ? "premium-locked" : ""}`}>
            {post.image && (
              <img
                src={
                  post.image.startsWith("http")
                    ? post.image
                    : `${API_URL}/${post.image}`
                }
                alt={post.title}
                className="post-image"
              />
            )}

            {/* center call-out on locked card */}
            {isLocked && (
           <div className="locked-banner small">
  <Lock size={14} style={{ marginRight: "6px", marginBottom: "3px",verticalAlign: "middle" }} />
  Premium — subscribe to view
</div>
            )}
          </div>

          <h3>#{post.title}</h3>
        </div>
      </Link>
    );
  })}
</div>

   <Link
    to="/premium"
    className="view-all-premium-btn"
  >
    View all premium posts →
  </Link>
</aside>



      <BottomNav />
     
    </div>
  );
}

export default Home;
