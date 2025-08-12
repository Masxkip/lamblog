import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { FaStar } from "react-icons/fa";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import { FaReply } from "react-icons/fa";
import { MoreVertical } from "lucide-react";

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
  const [openReplies, setOpenReplies] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeReplyMenu, setActiveReplyMenu] = useState(null);
  const [disableButtons, setDisableButtons] = useState({
  deletePost: false,
  addComment: false,
  editComment: false,
  deleteComment: false,
  addReply: {},
  deleteReply: {}
});


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
  

  // Handle Deleting a Post
 const handleDelete = async () => {
  if (disableButtons.deletePost) return; // prevent multiple clicks
  setDisableButtons(prev => ({ ...prev, deletePost: true }));

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
    setDisableButtons(prev => ({ ...prev, deletePost: false }));
  }
};


  // Handle Adding a Comment
 const handleAddComment = async () => {
  if (!newComment.trim() || disableButtons.addComment) return;
  setDisableButtons(prev => ({ ...prev, addComment: true }));

  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/api/comments/${id}`,
      { text: newComment },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setComments([...comments, { ...response.data.comment, author: { _id: user._id, username: user.username } }]);
    setNewComment("");
  } catch (err) {
    console.error("Error adding comment:", err);
  } finally {
    setDisableButtons(prev => ({ ...prev, addComment: false }));
  }
};


  // Handle Editing a Comment
const handleEditComment = async (commentId) => {
  if (!editedCommentText.trim() || disableButtons.editComment[commentId]) return;

  // lock this specific comment's "Save" button
  setDisableButtons(prev => ({
    ...prev,
    editComment: { ...prev.editComment, [commentId]: true }
  }));

  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `${API_URL}/api/comments/${id}/comments/${commentId}`,
      { text: editedCommentText },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setComments(comments.map(c =>
      c._id === commentId ? { ...c, text: editedCommentText } : c
    ));
    setEditingCommentId(null);
    setEditedCommentText("");
  } catch (err) {
    console.error("Error updating comment:", err);
  } finally {
    setDisableButtons(prev => ({
      ...prev,
      editComment: { ...prev.editComment, [commentId]: false }
    }));
  }
};


  // Handle Deleting a Comment
const handleDeleteComment = async (commentId) => {
  if (disableButtons.deleteComment[commentId]) return;

  setDisableButtons(prev => ({
    ...prev,
    deleteComment: { ...prev.deleteComment, [commentId]: true }
  }));

  try {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/api/comments/${id}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setComments(comments.filter(c => c._id !== commentId));
  } catch (err) {
    console.error("Error deleting comment:", err);
  } finally {
    setDisableButtons(prev => ({
      ...prev,
      deleteComment: { ...prev.deleteComment, [commentId]: false }
    }));
  }
};


  // Handle Adding a Reply
const handleAddReply = async (commentId) => {
  if (!replyText[commentId]?.trim() || disableButtons.addReply[commentId]) return;
  setDisableButtons(prev => ({
    ...prev,
    addReply: { ...prev.addReply, [commentId]: true }
  }));

  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/api/comments/${id}/comments/${commentId}/reply`,
      { text: replyText[commentId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setComments(comments.map(c =>
      c._id === commentId
        ? { ...c, replies: [...c.replies, { ...response.data.reply, author: { _id: user._id, username: user.username } }] }
        : c
    ));
    setReplyText({ ...replyText, [commentId]: "" });
  } catch (err) {
    console.error("Error adding reply:", err);
  } finally {
    setDisableButtons(prev => ({
      ...prev,
      addReply: { ...prev.addReply, [commentId]: false }
    }));
  }
};



   // Handle Adding Delete Reply
 const handleDeleteReply = async (commentId, replyId) => {
  if (disableButtons.deleteReply[replyId]) return;

  setDisableButtons(prev => ({
    ...prev,
    deleteReply: { ...prev.deleteReply, [replyId]: true }
  }));

  try {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/api/comments/${id}/comments/${commentId}/replies/${replyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setComments(comments.map(c =>
      c._id === commentId
        ? { ...c, replies: c.replies.filter(r => r._id !== replyId) }
        : c
    ));
  } catch (err) {
    console.error("Error deleting reply:", err);
  } finally {
    setDisableButtons(prev => ({
      ...prev,
      deleteReply: { ...prev.deleteReply, [replyId]: false }
    }));
  }
};

  

   // Handle dropdown Reply
    const toggleReplies = (commentId) => {
  setOpenReplies((prev) => ({
    ...prev,
    [commentId]: !prev[commentId],
  }));
};



 // Handle dot toggle menu Reply
useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".comment-menu-wrapper")) {
      setActiveMenu(null);
    }
    if (!e.target.closest(".reply-menu-wrapper")) {
      setActiveReplyMenu(null);
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, []);



 // Handle Adding ratepost
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
  
  return (
    <div className="single-post-container">
       {loading ? (
      <div className="full-page-spinner">
        <span className="spinner1" />
      </div>
    ) : error ? (
      <p className="error-message">{error}</p>
    ) : (
      <>
      <BackArrow />
      
      {post.image && (
        <img src={post.image} alt="Post" className="single-post-image" />
      )}
      <h2># {post.title}</h2>
      <p>{post.content}</p>
      <p>
      <strong>@
      <Link to={`/profile/${post.author._id}`} className="slider-post-card-author">
        {post.author.username}
      </Link></strong>
    </p>
      <p><strong>Date:</strong> {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown"}</p>

      {user && user._id === post.author?._id && (
        <div className="post-actions">
          <Link to={`/edit-post/${post._id}`} className="edit-btn">Edit</Link>
          <button
  onClick={handleDelete}
  className="delete-btn"
  disabled={disableButtons.deletePost}
>
  {disableButtons.deletePost ? "Deleting..." : "Delete"}
</button>

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
  <div className="comment-menu-wrapper">
<button
  className="menu-toggle-btn"
  style={{
    backgroundColor: "transparent",
    border: "none",
    padding: "4px",
    cursor: "pointer"
  }}
  onClick={(e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === comment._id ? null : comment._id);
  }}
>
  <MoreVertical size={20} />
</button>


    {activeMenu === comment._id && (
      <div className="comment-dropdown-menu">
        <button onClick={() => {
          setEditingCommentId(comment._id);
          setEditedCommentText(comment.text);
          setActiveMenu(null);
        }}>Edit</button>
        <button onClick={() => {
          handleDeleteComment(comment._id);
          setActiveMenu(null);
        }}>Delete</button>
      </div>
    )}
  </div>
)}

              </>
            )}

            {/* Display Replies & Add Reply Input */}
<div className="comment-replies-section">
  {comment.replies?.length > 0 ? (
    <button
      onClick={() => toggleReplies(comment._id)}
      className="toggle-replies-btn"
    >
      {openReplies[comment._id]
        ? "▲ Hide replies"
        : `${comment.replies.length} repl${comment.replies.length > 1 ? "ies" : "y"} ▼`}
    </button>
  ) : (
   <button
  onClick={() => toggleReplies(comment._id)}
  className="toggle-replies-btn"
>
  <FaReply size={14} style={{ marginRight: "5px", position: "relative", top: "1px" }} />
  Reply
</button>

  )}

  {openReplies[comment._id] && (
    <div className="replies">
      {comment.replies?.map((reply) => (
        <div key={reply._id} className="reply">
          <p>
            <strong>@{reply.author?.username || "Unknown"}:</strong> {reply.text}
          </p>
          <small>{new Date(reply.createdAt).toLocaleString()}</small>
        {user && user._id === reply.author?._id && (
  <div className="reply-menu-wrapper">
    <button
      className="menu-toggle-btn"
      style={{
        backgroundColor: "transparent",
        border: "none",
        padding: "4px",
        cursor: "pointer"
      }}
      onClick={(e) => {
        e.stopPropagation();
        setActiveReplyMenu(activeReplyMenu === reply._id ? null : reply._id);
      }}
    >
      <MoreVertical size={18} />
    </button>

    {activeReplyMenu === reply._id && (
      <div className="comment-dropdown-menu">
        <button
  onClick={() => {
    if (!disableButtons.deleteReply[reply._id]) {
      handleDeleteReply(comment._id, reply._id);
      setActiveReplyMenu(null);
    }
  }}
  disabled={!!disableButtons.deleteReply[reply._id]}
>
  {disableButtons.deleteReply[reply._id] ? "Deleting..." : "Delete"}
</button>

      </div>
    )}
  </div>
)}

        </div>
      ))}

      {/* ✅ Reply box always appears if reply toggle is open and user is logged in */}
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
          <button
  onClick={() => handleAddReply(comment._id)}
  disabled={disableButtons.addReply[comment._id]}
>
  {disableButtons.addReply[comment._id] ? "Replying..." : "Reply"}
</button>

        </div>
      )}
    </div>
  )}
</div>

          </div>
        ))}

        {/* Add Comment Input */}

{user && (
  <div className="bottom-comment-bar-wrapper">
    <div className="bottom-comment-bar">
      <input
        type="text"
        placeholder="Add a comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <button
  onClick={handleAddComment}
  disabled={disableButtons.addComment}
>
  {disableButtons.addComment ? "Posting..." : "Comment"}
</button>

    </div>
  </div>

)}


{user && (
  <div className="bottom-comment-bar-m-wrapper">
    <div className="bottom-comment-bar-m">
      <input
        type="text"
        placeholder="Add a comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
         <button
  onClick={handleAddComment}
  disabled={disableButtons.addComment}
>
  {disableButtons.addComment ? "Posting..." : "Comment"}
</button>
    </div>
  </div>

)}

        {message && <p className="success-message">{message}</p>}
      </div>
      <BottomNav />
      </>
    )}
    </div>
  );
}

export default SinglePost;
