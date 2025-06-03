import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { FaStar } from "react-icons/fa";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function SinglePost() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState({});
  const [message, setMessage] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [averageRating, setAverageRating] = useState(0);
const [userRating, setUserRating] = useState(null);
const [error, setError] = useState(null);


  // Fetch comments
  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const postResponse = await axios.get(`${API_URL}/api/posts/${id}`);
        setPost(postResponse.data);

        const commentsResponse = await axios.get(`${API_URL}/api/comments/${id}/comments`);
        setComments(commentsResponse.data || []);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id]);


  // Fetch post ratings
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ratingsResponse = await axios.get(`${API_URL}/api/posts/${id}/ratings`);
        setAverageRating(ratingsResponse.data.averageRating);
        
        if (user) {
          const userRatingResponse = await axios.get(`${API_URL}/api/posts/${id}/my-rating`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          setUserRating(userRatingResponse.data.rating);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
      }
    };
  
    fetchRatings();
  }, [id, user]);


    // Fetch post
    useEffect(() => {
      const fetchPost = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/posts/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const fetchedPost = response.data;

          // Redirect if it's premium and user is not subscribed
          if (fetchedPost.isPremium && (!user || !user.isSubscriber)) {
            navigate("/subscribe");
            return; // ❌ Don't continue
          }

          setPost(fetchedPost);
          setAuthorized(true); // ✅ Allow render only after all checks
        } catch {
          setError("Error fetching post");
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }, [id, user, navigate]);
      

  // Handle Deleting a Post
  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/api/posts/${id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      setMessage("Post deleted successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // Handle Adding a Comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/comments/${id}`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments([...comments, {
        ...response.data.comment,
        author: { _id: user._id, username: user.username }, // Ensure author ID is included
      }]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Handle Editing a Comment
  const handleEditComment = async (commentId) => {
    if (!editedCommentText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/comments/${id}/comments/${commentId}`,
        { text: editedCommentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(
        comments.map((comment) =>
          comment._id === commentId ? { ...comment, text: editedCommentText } : comment
        )
      );

      setEditingCommentId(null);
      setEditedCommentText("");
    } catch (err) {
      console.error("Error updating comment:", err);
    }
  };

  // Handle Deleting a Comment
  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/comments/${id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments(comments.filter((comment) => comment._id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Handle Adding a Reply
  const handleAddReply = async (commentId) => {
    if (!replyText[commentId]?.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/api/comments/${id}/comments/${commentId}/reply`,
        { text: replyText[commentId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments(
        comments.map((comment) =>
          comment._id === commentId
            ? { ...comment, replies: [...comment.replies, { ...response.data.reply, author: { _id: user._id, username: user.username } }] }
            : comment
        )
      );

      setReplyText({ ...replyText, [commentId]: "" });
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };


  const handleDeleteReply = async (commentId, replyId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/comments/${id}/comments/${commentId}/replies/${replyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Remove reply from state
      setComments(
        comments.map((comment) =>
          comment._id === commentId
            ? { ...comment, replies: comment.replies.filter((reply) => reply._id !== replyId) }
            : comment
        )
      );
    } catch (err) {
      console.error("Error deleting reply:", err);
    }
  };
  

  
  const handleRatePost = async (rating) => {
    try {
      const token = localStorage.getItem("token");
  
      await axios.post(
        `${API_URL}/api/posts/${id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setUserRating(rating); // Save user rating locally
  
      // Re-fetch updated average rating from backend
      const ratingsResponse = await axios.get(`${API_URL}/api/posts/${id}/ratings`);
      setAverageRating(ratingsResponse.data.averageRating);
  
    } catch (err) {
      console.error("Error submitting rating:", err);
    }
  };
  
  if (loading || !authorized) return null;
  if (error) return <p className="error-message">{error}</p>;


  return (
    <div className="single-post-container">
      <BackArrow />
      <h2># {post.title}</h2>
      {post.image && (
        <img src={post.image} alt="Post" className="single-post-image" />
      )}
      
      <p>{post.content}</p>
      <p>
      <strong>@</strong> 
      <Link to={`/profile/${post.author._id}`} className="profile-link">
        {post.author.username}
      </Link>
    </p>
      <p><strong>Date:</strong> {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown"}</p>

      {user && user._id === post.author?._id && (
        <div className="post-actions">
          <Link to={`/edit-post/${post._id}`} className="edit-btn">Edit</Link>
          <button onClick={handleDelete} className="delete-btn">Delete</button>
        </div>
      )}

{post.music && user && (
  <>
    {user.isSubscriber ? (
      <div className="music-player">
        <audio controls src={post.music}>
          Your browser does not support the audio element.
        </audio>
        <a
          href={`${API_URL}/api/posts/download-music/${post._id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="download-music-btn">⬇️ Download Music</button>
        </a>
      </div>
    ) : (
      <div className="subscribe-download-notice">
        <p>🎶 This post includes audio content. Subscribe to listen & download.</p>
        <Link to="/subscribe">
          <button className="subscribe-btn">Subscribe Now</button>
        </Link>
      </div>
    )}
  </>
)}




      {/* Post Rating Section (Above Comments) */}
      <div className="post-rating">
            <h3>
        Post Rating:{" "}
        <FaStar
          color="#8a2be2"
          size={24}
          style={{ position: "relative", top: "3.8px" }}
        />{" "}
        {averageRating} / 5
      </h3>
        {/* Hide stars if user has already rated */}
        {userRating === null && user ? (
        <div className="rating-buttons">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={30}
            color={userRating >= star ? "#8a2be2" : "lightgray"}
            onClick={() => handleRatePost(star)}
            style={{ cursor: "pointer", marginRight: "5px" }}
          />
        ))}
      </div>
        ) : (
          <p>
          You rated this post {userRating}{" "}
          <FaStar
            color="#8a2be2"
            size={24}
            style={{ position: "relative", top: "3.9px" }}
          />
        </p>
        )}
      </div>

      {/* Comment Section */}
      <div className="comment-section">
        <h3>Comments</h3>

        {comments.map((comment) => (
          <div key={comment._id} className="comment">
            {editingCommentId === comment._id ? (
              <>
                <input 
                type="text"
                className="edit-comment-input"
                value={editedCommentText}
                onChange={(e) => setEditedCommentText(e.target.value)}
              />
                <button onClick={() => handleEditComment(comment._id)}>Save</button>
                <button onClick={() => setEditingCommentId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <p><strong>@{comment.author?.username || "Unknown"}:</strong> {comment.text}</p>
                <small>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown Date"}</small>
                {user && user._id === comment.author?._id && (
                  <>
                    <button onClick={() => { 
                      setEditingCommentId(comment._id);
                      setEditedCommentText(comment.text);
                    }}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteComment(comment._id)}>Delete</button>
                  </>
                )}
              </>
            )}

            {/* Display Replies & Add Reply Input */}
            <div className="replies">
              {comment.replies?.map((reply) => (
                <div key={reply._id} className="reply">
                  <p><strong>@{reply.author?.username || "Unknown"}:</strong> {reply.text}</p>
                  <small>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : "Unknown Date"}</small>
                   {/* Show Delete Button for Reply Owner Only */}
                  {user && user._id === reply.author?._id && (
                    <button onClick={() => handleDeleteReply(comment._id, reply._id)}>Delete</button>
                  )}
                </div>
              ))}

              {user && (
                <div className="reply-box">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText[comment._id] || ""}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [comment._id]: e.target.value })
                    }
                  />
                  <button onClick={() => handleAddReply(comment._id)}>Reply</button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Comment Input */}
{user ? (
  <div className="add-comment">
    <input
      type="text"
      placeholder="Write a comment..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
    />
    <button onClick={handleAddComment}>Comment</button>
  </div>
) : (
  <p>Please <Link to="/login">login</Link> to comment.</p>
)}

        {message && <p className="success-message">{message}</p>}
      </div>
      <BottomNav />
    </div>
  );
}

export default SinglePost;
