import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { UserCircle } from "lucide-react"; // Icon for default profile picture
import BottomNav from "../components/BottomNav";

// Load API URL from .env
const API_URL = import.meta.env.VITE_BACKEND_URL;

function Profile() {
  const { id } = useParams();
  const { user: loggedInUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users/${id}`);
        setUser(response.data);
        setPosts(response.data.posts || []);
        setComments(response.data.comments || []);
        setReplies(response.data.replies || []);
        setRatings(response.data.ratings || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Error fetching profile. Please try again.");
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!user) return <p>User not found.</p>;

  return (
    <div className="profile-container">
      <h2>{user.username}'s Profile</h2>

      {/* Fix Profile Picture Loading */}
      {user.profilePicture ? (
        <img 
          src={`${API_URL}${user.profilePicture}`}
          alt="Profile" 
          className="profile-pic" 
        />
      ) : (
        <UserCircle className="default-profile-icon" size={50} />
      )}


      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Bio:</strong> {user.bio || "No bio available."}</p>
      <p><strong>Location:</strong> {user.location || "Not set"}</p>
      <p>
        <strong>Website:</strong> 
        {user.website ? (
          <a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a>
        ) : (
          "Not set"
        )}
      </p>

            {/* Edit & Logout Buttons */}
{loggedInUser && loggedInUser._id === user._id && (
  <>
    <button onClick={() => navigate(`/edit-profile/${user._id}`)} className="profile-btn">
      Edit Profile
    </button>
    <button onClick={handleLogout} className="profile-btn">
      Logout
    </button>
  </>
)}

      
           {/* User’s Posts */}
<h3>Posts by {user.username}</h3>
{posts.length > 0 ? (
  <div className="profile-section">
    {posts.map(post => (
      <Link to={`/post/${post._id}`} key={post._id} className="user-post-link">
        <div className="user-post">
          <h4>{post.title}</h4>
          <p>{post.content.substring(0, 100)}...</p>
          <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
        </div>
      </Link>
    ))}
  </div>
) : (
  <p>No posts yet.</p>
)}

      {/* Comments by the User */}
<h3>Comments by {user.username}</h3>
{comments.length > 0 ? (
  <div className="profile-section">
    {comments.map(comment => (
      <Link to={`/post/${comment.postId}`} key={comment.postId} className="user-comment-link">
        <div className="user-comment">
          <p><strong>On Post:</strong> {comment.postTitle}</p>
          <p>{comment.commentText}</p>
          <small>{new Date(comment.createdAt).toLocaleString()}</small>
        </div>
      </Link>
    ))}
  </div>
) : (
  <p>No comments yet.</p>
)}


     {/* Replies by the User */}
<h3>Replies by {user.username}</h3>
{replies.length > 0 ? (
  <div className="profile-section">
    {replies.map(reply => (
      <Link to={`/post/${reply.postId}`} key={reply.postId} className="user-reply-link">
        <div className="user-reply">
          <p><strong>On Post:</strong> {reply.postTitle}</p>
          <p><strong>Replied to:</strong> {reply.commentText}</p>
          <p>{reply.replyText}</p>
          <small>{new Date(reply.createdAt).toLocaleString()}</small>
        </div>
      </Link>
    ))}
  </div>
) : (
  <p>No replies yet.</p>
)}

      {/* Ratings Given by the User */}
<h3>Ratings Given by {user.username}</h3>
{ratings.length > 0 ? (
  <div className="profile-section">
    {ratings.map(rating => (
      <Link to={`/post/${rating.postId}`} key={rating.postId} className="user-rating-link">
        <div className="user-rating">
          <p><strong>On Post:</strong> {rating.postTitle}</p>
          <p>Rated: ⭐ {rating.ratingValue} / 5</p>
        </div>
      </Link>
    ))}
  </div>
) : (
  <p>No ratings given yet.</p>
)}
<BottomNav />
    </div>
  );
}

export default Profile;
