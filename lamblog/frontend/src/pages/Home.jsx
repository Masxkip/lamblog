import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  UserCircle,
  Home as HomeIcon,
  FileText,
  MoreHorizontal,
  Check,
  Lock,
} from "lucide-react";
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
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [subscriptionExpiresSoon, setSubscriptionExpiresSoon] = useState(false);
  const [expiryDateFormatted, setExpiryDateFormatted] = useState("");
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(10);
  const observer = useRef();

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && visibleCount < posts.length) {
          setTimeout(() => {
            setVisibleCount((prev) => prev + 10);
          }, 800);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, visibleCount, posts.length]
  );

  // Fetch post
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = [];
      if (search) queryParams.push(`search=${search}`);
      if (category) queryParams.push(`category=${category}`);
      const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";

      const response = await axios.get(`${API_URL}/api/posts${queryString}`);
      const sortedPosts = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPosts(sortedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
    setLoading(false);
  }, [search, category]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/posts`);
      const uniqueCategories = [
        ...new Set(response.data.map((post) => post.category).filter(Boolean)),
      ];
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
        const res = await axios.get(`${API_URL}/api/posts/premium/posts`);
        setPremiumPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch premium posts", err);
      }
    };
    fetchPremium();
  }, [posts]);

  useEffect(() => {
    const wasJustSubscribed = localStorage.getItem("justSubscribedHome") === "true";
    if (wasJustSubscribed) {
      setJustSubscribed(true);
      localStorage.removeItem("justSubscribedHome");
      setTimeout(() => setJustSubscribed(false), 5000);
    }
  }, []);

  useEffect(() => {
    if (user?.isSubscriber && user?.subscriptionStart) {
      const startDate = new Date(user.subscriptionStart);
      const expiryDate = new Date(startDate);
      expiryDate.setDate(startDate.getDate() + 30);

      const today = new Date();
      const timeDiff = expiryDate - today;
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (daysLeft <= 5 && daysLeft >= 0) {
        setSubscriptionExpiresSoon(true);
        setExpiryDateFormatted(expiryDate.toDateString());
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && !user.isSubscriber && user.subscriptionStart) {
      const startDate = new Date(user.subscriptionStart);
      const expiryDate = new Date(startDate);
      expiryDate.setDate(startDate.getDate() + 30);

      const today = new Date();
      if (today > expiryDate) {
        setSubscriptionExpired(true);
      }
    }
  }, [user]);

  const displayedPosts = posts.slice(0, visibleCount);

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
            <Link to={`/post/${post._id}`} key={post._id} className="sidebar-item">
              <div className="item-text">
                <small className="item-meta">
                  {post.category || "General"} · Trending
                </small>
                <span className="item-title">#{post.title}</span>
                <small className="item-meta">
                  {post.views ? post.views.toLocaleString() + " views" : "Popular post"}
                </small>
              </div>
              <MoreHorizontal size={18} />
            </Link>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {justSubscribed && (
          <div className="subscription-success-banner">
            Welcome to SLXXK Premium! Enjoy your exclusive content.
          </div>
        )}

        {subscriptionExpiresSoon && (
          <div className="subscription-warning-banner">
             Your SLXXK Premium subscription will expire on{" "}
            <strong>{expiryDateFormatted}</strong>. Please renew to continue enjoying premium features.
          </div>
        )}

        {subscriptionExpired && (
          <div className="subscription-expired-banner">
           Your SLXXK Premium subscription has expired. Please renew to access premium features.
          </div>
        )}

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
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="User" className="user-avatar" />
              ) : (
                <UserCircle className="default-profile-icon" size={32} />
              )}
            </div>
          )}
        </header>

        <h2>#SEEK Latest!</h2>

        {loading ? (
          <div className="full-page-spinner">
    <span className="spinner1" />
  </div>
        ) : displayedPosts.length === 0 ? (
          <div className="no-posts-message">
            <p>No posts available for your search.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {displayedPosts.map((post, index) => {
              const isLocked = post.isPremium && (!user || !user.isSubscriber);
              const postLink = isLocked ? "/subscribe" : `/post/${post._id}`;
              const isLast = index === displayedPosts.length - 1;

              return (
                <Link
                  to={postLink}
                  key={post._id}
                  className="post-card-link"
                  ref={isLast ? lastPostRef : null}
                >
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
                              <Lock
                                size={14}
                                style={{ marginRight: "6px", verticalAlign: "middle" }}
                              />
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

        {visibleCount < posts.length && (
          <div className="infinite-spinner">
            <span className="spinner" />
          </div>
        )}
      </main>

      {/* Premium Sidebar Section */}
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

        {user?.isSubscriber && <h2>Latest on SEEK Premium</h2>}

        <div className="premium-grid">
          {premiumPosts.slice(0, 3).map((post) => {
            const isLocked = !user?.isSubscriber;
            const target = isLocked ? "/subscribe" : `/post/${post._id}`;

            return (
              <Link to={target} key={post._id} className="premium-card-link">
                <div className="premium-card">
                  <div className="profile-link verified-user">
                    <span className="slider-post-card-author">@{post.author.username}</span>
                    {post.author?.isSubscriber && (
                      <span className="verified-circle">
                        <Check size={12} color="white" strokeWidth={3} />
                      </span>
                    )}
                  </div>

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
                    {isLocked && (
                      <div className="locked-banner small">
                        <Lock size={14} style={{ marginRight: "6px", marginBottom: "3px", verticalAlign: "middle" }} />
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

        <Link to="/premium" className="view-all-premium-btn">
          View all premium posts →
        </Link>
      </aside>

      <BottomNav />
    </div>
  );
}

export default Home;
