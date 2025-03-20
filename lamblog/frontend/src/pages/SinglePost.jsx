import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function SinglePost() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState({});
  const [message, setMessage] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [averageRating, setAverageRating] = useState(0);
const [userRating, setUserRating] = useState(null);
const [error, setError] = useState(null);


  // ✅ Fetch comments
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


  // ✅ Fetch post ratings
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


  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/${id}`);
        setPost(response.data);
      } catch (err) {
        setError(`Error: ${err.message || "Failed to fetch post. Please try again later."}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);
  

  // ✅ Handle Deleting a Post
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

  // ✅ Handle Adding a Comment
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
        author: { _id: user._id, username: user.username }, // ✅ Ensure author ID is included
      }]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // ✅ Handle Editing a Comment
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

  // ✅ Handle Deleting a Comment
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

  // ✅ Handle Adding a Reply
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
  
      // ✅ Remove reply from state
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
  
      setUserRating(rating); // ✅ Save user rating locally
  
      // ✅ Update UI with new average rating
      setAverageRating((prevAvg) => ((prevAvg * comments.length + rating) / (comments.length + 1)).toFixed(1));
    } catch (err) {
      console.error("Error submitting rating:", err);
    }
  };
  


  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="single-post-container">
      <h2>#{post.title}</h2>
      {post.image && (
      <img src={`${API_URL}${post.image}`} alt="Post" className="single-post-image" />
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

       {/* ✅ Display Music Player if Music is Available */}
       {post.music && (
        <div className="music-player">
          <h4>🎵 Listen to Attached Music</h4>
          <audio controls>
          <source src={`${API_URL}${post.music}`} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* ✅ Post Rating Section (Above Comments) */}
      <div className="post-rating">
        <h3>Post Rating: ⭐ {averageRating} / 5</h3>
        
        {/* ✅ Hide stars if user has already rated */}
        {userRating === null && user ? (
          <div className="rating-buttons">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => handleRatePost(star)}>⭐ {star}</button>
            ))}
          </div>
        ) : (
          <p>You rated this post {userRating} ⭐</p>
        )}
      </div>


      {/* ✅ Comment Section */}
      <div className="comment-section">
        <h3>Comments</h3>

        {comments.map((comment) => (
          <div key={comment._id} className="comment">
            {editingCommentId === comment._id ? (
              <>
                <input 
                  type="text" 
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

            {/* ✅ Display Replies & Add Reply Input */}
            <div className="replies">
              {comment.replies?.map((reply) => (
                <div key={reply._id} className="reply">
                  <p><strong>@{reply.author?.username || "Unknown"}:</strong> {reply.text}</p>
                  <small>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : "Unknown Date"}</small>
                   {/* ✅ Show Delete Button for Reply Owner Only */}
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

        {/* ✅ Add Comment Input */}
{user ? (
  <div className="add-comment">
    <input
      type="text"
      placeholder="Write a comment..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
    />
    <button onClick={handleAddComment}>Post Comment</button> {/* ✅ Fix: Ensure function is used */}
  </div>
) : (
  <p>Please <Link to="/login">login</Link> to comment.</p>
)}

        {message && <p className="success-message">{message}</p>}
        <Link to="/" className="back-btn">← Back to Home</Link>
      </div>
    </div>
  );
}

export default SinglePost;
