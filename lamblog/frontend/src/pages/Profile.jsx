import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { UserCircle } from "lucide-react"; // Icon for default profile picture

// ✅ Load API URL from .env
const API_URL = import.meta.env.VITE_BACKEND_URL;

function Profile() {
  const { id } = useParams();
  const { user: loggedInUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      {/* ✅ Fix Profile Picture Loading */}
      {user.profilePicture ? (
        <img 
          src={`${API_URL}${user.profilePicture}`}  // ✅ Fix: API_URL + relative path
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

      {/* ✅ Show Edit Profile button only for the logged-in user */}
      {loggedInUser && loggedInUser._id === user._id && (
        <button onClick={() => navigate(`/edit-profile/${user._id}`)}>Edit Profile</button>
      )}
      
      {/* ✅ User’s Posts */}
      <h3>Posts by {user.username}</h3>
      {posts.length > 0 ? (
        <div className="profile-section">
          {posts.map(post => (
            <div key={post._id} className="user-post">
              <h4>
                <Link to={`/post/${post._id}`}>{post.title}</Link>
              </h4>
              <p>{post.content.substring(0, 100)}...</p>
              <p><strong>Published:</strong> {new Date(post.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No posts yet.</p>
      )}

      {/* ✅ Comments by the User */}
      <h3>Comments by {user.username}</h3>
      {comments.length > 0 ? (
        <div className="profile-section">
          {comments.map(comment => (
            <div key={comment.postId} className="user-comment">
              <p><strong>On Post:</strong> <Link to={`/post/${comment.postId}`}>{comment.postTitle}</Link></p>
              <p>{comment.commentText}</p>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>No comments yet.</p>
      )}

      {/* ✅ Replies by the User */}
      <h3>Replies by {user.username}</h3>
      {replies.length > 0 ? (
        <div className="profile-section">
          {replies.map(reply => (
            <div key={reply.postId} className="user-reply">
              <p><strong>On Post:</strong> <Link to={`/post/${reply.postId}`}>{reply.postTitle}</Link></p>
              <p><strong>Replied to:</strong> {reply.commentText}</p>
              <p>{reply.replyText}</p>
              <small>{new Date(reply.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>No replies yet.</p>
      )}

      {/* ✅ Ratings Given by the User */}
      <h3>Ratings Given by {user.username}</h3>
      {ratings.length > 0 ? (
        <div className="profile-section">
          {ratings.map(rating => (
            <div key={rating.postId} className="user-rating">
              <p><strong>On Post:</strong> <Link to={`/post/${rating.postId}`}>{rating.postTitle}</Link></p>
              <p>Rated: ⭐ {rating.ratingValue} / 5</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No ratings given yet.</p>
      )}
    </div>
  );
}

export default Profile;
