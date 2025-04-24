import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

const SinglePost = ({ user }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [replies, setReplies] = useState({});
  const [openReplies, setOpenReplies] = useState({});

  // Fetch Post
  useEffect(() => {
    const fetchPost = async () => {
      const res = await axios.get(`/api/posts/${id}`);
      setPost(res.data);
      setComments(res.data.comments || []);
    };
    fetchPost();
  }, [id]);

  // Add a comment
  const handleComment = async () => {
    if (!newComment.trim()) return;

    const res = await axios.post(`/api/posts/${id}/comments`, {
      text: newComment,
      author: user._id,
    });

    setComments([...comments, res.data]);
    setNewComment("");
  };

  // Add a reply
  const handleReply = async (commentId) => {
    const replyText = replies[commentId];
    if (!replyText?.trim()) return;

    const res = await axios.post(`/api/posts/${id}/comments/${commentId}/replies`, {
      text: replyText,
      author: user._id,
    });

    setComments((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? { ...comment, replies: [...(comment.replies || []), res.data] }
          : comment
      )
    );

    setReplies({ ...replies, [commentId]: "" });
  };

  // Toggle reply section
  const toggleReplies = (commentId) => {
    setOpenReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    await axios.delete(`/api/posts/${id}/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  // Delete reply
  const handleDeleteReply = async (commentId, replyId) => {
    await axios.delete(`/api/posts/${id}/comments/${commentId}/replies/${replyId}`);
    setComments((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? {
              ...comment,
              replies: comment.replies.filter((r) => r._id !== replyId),
            }
          : comment
      )
    );
  };

  if (!post) return <p>Loading...</p>;

  return (
    <div className="single-post-container">
      <Link to="/" className="back-btn">← Back to Home</Link>

      <div className="single-post-header">
        <h2>{post.title}</h2>
      </div>

      {post.image && (
        <img src={post.image} alt="Post" className="single-post-image" />
      )}

      <p className="post-timestamp">
        Posted on: {new Date(post.createdAt).toLocaleString()}
      </p>

      <p>{post.content}</p>

      <div className="comment-section">
        <h3>Comments</h3>

        {/* New Comment Input */}
        {user && (
          <div className="add-comment">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleComment}>Post</button>
          </div>
        )}

        {/* List of Comments */}
        {comments.map((comment) => (
          <div className="comment" key={comment._id}>
            <p>
              <strong>@{comment.author?.username || "Unknown"}:</strong>{" "}
              {comment.text}
            </p>
            <small>
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleString()
                : "Unknown Date"}
            </small>

            {user && user._id === comment.author?._id && (
              <button onClick={() => handleDeleteComment(comment._id)}>
                Delete
              </button>
            )}

            {/* Reply Input */}
            {user && (
              <div className="reply-box">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replies[comment._id] || ""}
                  onChange={(e) =>
                    setReplies({ ...replies, [comment._id]: e.target.value })
                  }
                />
                <button onClick={() => handleReply(comment._id)}>Reply</button>
              </div>
            )}

            {/* Toggle Button */}
            {comment.replies?.length > 0 && (
              <p
                className="toggle-replies-btn"
                onClick={() => toggleReplies(comment._id)}
              >
                {openReplies[comment._id]
                  ? "Hide Replies"
                  : `View Replies (${comment.replies.length})`}
              </p>
            )}

            {/* Reply List */}
            {openReplies[comment._id] && (
              <div className="replies">
                {comment.replies.map((reply) => (
                  <div key={reply._id} className="reply">
                    <p>
                      <strong>@{reply.author?.username || "Unknown"}:</strong>{" "}
                      {reply.text}
                    </p>
                    <small>
                      {reply.createdAt
                        ? new Date(reply.createdAt).toLocaleString()
                        : "Unknown Date"}
                    </small>
                    {user && user._id === reply.author?._id && (
                      <button
                        onClick={() =>
                          handleDeleteReply(comment._id, reply._id)
                        }
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SinglePost;
