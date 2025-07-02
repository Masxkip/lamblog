// src/pages/Profile.jsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { UserCircle } from "lucide-react";          // fallback avatar
import BottomNav from "../components/BottomNav";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Profile() {
  const { id } = useParams();
  const { user: loggedInUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [posts, setPosts]       = useState([]);
  const [comments, setComments] = useState([]);
  const [replies, setReplies]   = useState([]);
  const [ratings, setRatings]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // active tab
  const [activeTab, setActiveTab] = useState("Posts");
  const tabs = ["Posts", "Comments", "Replies", "Ratings"];

  /* ---------------- FETCH PROFILE ---------------- */
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/users/${id}`);
        setUser(data);
        setPosts(data.posts || []);
        setComments(data.comments || []);
        setReplies(data.replies || []);
        setRatings(data.ratings || []);
      } catch (err) {
        console.error(err);
        setError("Error fetching profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /* ---------------- RENDER HELPERS ---------------- */
  const renderTabContent = () => {
    switch (activeTab) {
      case "Posts":
        return posts.length
          ? posts.map(p => (
              <Link to={`/post/${p._id}`} key={p._id} className="card-link">
                <article className="content-card">
                  <h4>{p.title}</h4>
                  <p>{p.content.slice(0, 120)}…</p>
                  <span className="meta">
                    {new Date(p.createdAt).toLocaleString()}
                  </span>
                </article>
              </Link>
            ))
          : <p className="empty">No posts yet.</p>;

      case "Comments":
        return comments.length
          ? comments.map(c => (
              <Link to={`/post/${c.postId}`} key={c._id} className="card-link">
                <article className="content-card">
                  <p><strong>On:</strong> {c.postTitle}</p>
                  <p>{c.commentText}</p>
                  <span className="meta">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </article>
              </Link>
            ))
          : <p className="empty">No comments yet.</p>;

      case "Replies":
        return replies.length
          ? replies.map(r => (
              <Link to={`/post/${r.postId}`} key={r._id} className="card-link">
                <article className="content-card">
                  <p><strong>On:</strong> {r.postTitle}</p>
                  <p><em>Replying to:</em> {r.commentText}</p>
                  <p>{r.replyText}</p>
                  <span className="meta">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </article>
              </Link>
            ))
          : <p className="empty">No replies yet.</p>;

      case "Ratings":
        return ratings.length
          ? ratings.map(rt => (
              <Link to={`/post/${rt.postId}`} key={rt._id} className="card-link">
                <article className="content-card">
                  <p><strong>On:</strong> {rt.postTitle}</p>
                  <p>⭐ {rt.ratingValue} / 5</p>
                </article>
              </Link>
            ))
          : <p className="empty">No ratings yet.</p>;

      default:
        return null;
    }
  };

  /* ---------------- RENDER ---------------- */
  if (loading) return <p className="loading">Loading profile…</p>;
  if (error)   return <p className="error-message">{error}</p>;
  if (!user)   return <p className="error-message">User not found.</p>;

  return (
    <div className="profile-wrapper">
      {/* -------- Left 70% -------- */}
      <main className="profile-main">

        {/* Banner strip (just a dark bar) */}
        <div className="profile-banner" />

        {/* ---- HEADER ---- */}
        <header className="profile-header">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt="profile" className="avatar" />
          ) : (
            <UserCircle className="avatar default" strokeWidth={1} />
          )}

          <div className="header-details">
          <div className="username-row">
            <h2 className="username">{user.username}</h2>
            {user.isSubscriber ? (
              <span className="subscriber-badge pill premium">SLXXK Premium</span>
            ) : (
              <span className="subscriber-badge pill free">Free User</span>
            )}
          </div>
            <p className="handle">@{user.username?.toLowerCase()}</p>
            <p className="meta">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

      
        </header>

        {/* ---- BIO / LINKS ---- */}
        <section className="bio-section">
          {user.bio && <p>{user.bio}</p>}
         <div className="profile-links-row">
  <div className="profile-links">
    {user.location && <p className="meta">📍 {user.location}</p>}
    {user.website && (
      <a
        href={user.website}
        target="_blank"
        rel="noopener noreferrer"
        className="website-link"
      >
        {user.website.replace(/^https?:\/\//, "")}
      </a>
    )}
  </div>

  {loggedInUser && loggedInUser._id === user._id && (
    <div className="btn-group">
      <button onClick={() => navigate(`/edit-profile/${user._id}`)} className="pill primary">
        Edit profile
      </button>
      <button onClick={handleLogout} className="pill secondary">
        Logout
      </button>
    </div>
  )}
</div>


          {loggedInUser && loggedInUser._id === user._id && user.isSubscriber && (
            <a
              href={`https://paystack.com/pay/${user.paystackCustomerCode}`}
              className="pill update-payment"
              target="_blank"
              rel="noopener noreferrer"
            >
              Update payment method
            </a>
          )}
        </section>

        {/* ---- TAB NAV ---- */}
        <nav className="tabs">
          {tabs.map(t => (
            <button
              key={t}
              className={`tab-item ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>

        {/* ---- CONTENT ---- */}
        <section className="tab-content">{renderTabContent()}</section>
      </main>

      {/* -------- Right 30% -------- */}
      <aside className="profile-sidebar">
        <div className="sidebar-box">
          <h3>Premium Posts</h3>
          <p>…coming soon…</p>
        </div>
        <div className="sidebar-box">
          <h3>Trending</h3>
          <p>…coming soon…</p>
        </div>
      </aside>

      {/* Bottom nav for mobile */}
      <BottomNav />
    </div>
  );
}
