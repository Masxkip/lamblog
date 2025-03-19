# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.





 {user && user._id === post.author?._id && (
        <div className="post-actions">
          <Link to={`/edit-post/${post._id}`} className="edit-btn">Edit</Link>
          <button onClick={handleDelete} className="delete-btn">Delete</button>
        </div>
      )}


      {message && <p className="success-message">{message}</p>}
      <Link to="/" className="back-btn">← Back to Home</Link>
    </div>



    const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(http://localhost:5000/api/posts/${id}, {
        headers: { "Authorization": Bearer ${token} },
      });

      setMessage("Post deleted successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };



  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      setMessage("Post deleted successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };






  import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

function SinglePost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
        setPost(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching post:", err);
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      setMessage("Post deleted successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

 
  if (loading) return <p>Loading post...</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="single-post-container">
      <h2>{post.title}</h2>
      {post.image && <img src={post.image} alt="Post" className="single-post-image" />}
      <p>{post.content}</p>
      <p><strong>Author:</strong> {post.author?.username || "Unknown"}</p>
      <p><strong>Published on:</strong> {new Date(post.createdAt).toLocaleString()}</p>

      {user && user._id === post.author?._id && (
        <div className="post-actions">
          <Link to={`/edit-post/${post._id}`} className="edit-btn">Edit</Link>
          <button onClick={handleDelete} className="delete-btn">Delete</button>
        </div>
      )}

    
      {message && <p className="success-message">{message}</p>}
      <Link to="/" className="back-btn">← Back to Home</Link>
    </div>
  );
}

export default SinglePost;





import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

function SinglePost() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]); // Ensure comments is always an array
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
        setPost(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching post:", err);
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/comments/${id}/comments`);
        setComments(response.data || []); // Ensure comments is always an array
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };

    fetchPost();
    fetchComments();
  }, [id]);


  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      setMessage("Post deleted successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };


  // ✅ Handle Adding a New Comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/comments/${id}`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setComments([...comments, {
        ...response.data.comment,
        author: { username: user.username }, // ✅ Show username immediately
      }]);
      setNewComment(""); // Clear input field
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };
  

  // ✅ Handle Adding a Reply to a Comment
  const handleAddReply = async (commentId) => {
    if (!replyText[commentId]?.trim()) return;
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/comments/${id}/comments/${commentId}/reply`, // ✅ Ensure `/comments/` before `commentId`
        { text: replyText[commentId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
  
      // Update the comment's replies
      setComments(
        comments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                replies: [...comment.replies, {
                  ...response.data.reply,
                  author: { username: user.username }, // ✅ Show username immediately
                }]
              }
            : comment
        )
      );
  
      setReplyText({ ...replyText, [commentId]: "" }); // Clear input field
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };

  
  

  if (loading) return <p>Loading post...</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="single-post-container">
      <h2>{post.title}</h2>
      {post.image && <img src={post.image} alt="Post" className="single-post-image" />}
      <p>{post.content}</p>
      <p><strong>Author:</strong> {post.author?.username || "Unknown"}</p>
      <p><strong>Published on:</strong> {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown"}</p>

      {user && user._id === post.author?._id && (
        <div className="post-actions">
          <Link to={`/edit-post/${post._id}`} className="edit-btn">Edit</Link>
          <button onClick={handleDelete} className="delete-btn">Delete</button>
        </div>
      )}

      {/* ✅ Comment Section */}
      <div className="comment-section">
        <h3>Comments</h3>
        
        {/* ✅ Display Comments */}
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="comment">
              <p><strong>{comment.author?.username || "Unknown"}:</strong> {comment.text}</p>
              <small>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown Date"}</small>

              {/* ✅ Display Replies */}
              {comment.replies?.length > 0 && (
                <div className="replies">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="reply">
                      <p><strong>{reply.author?.username || "Unknown"}:</strong> {reply.text}</p>
                      <small>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : "Unknown Date"}</small>
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ Add Reply Input */}
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
          ))
        ) : (
          <p>No comments yet. Be the first to comment!</p>
        )}

        {/* ✅ Add Comment Input */}
        {user ? (
          <div className="add-comment">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment}>Post Comment</button>
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


