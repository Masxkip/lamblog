import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";

// Get the backend URL from environment variables
const API_URL = import.meta.env.VITE_BACKEND_URL;

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/${id}`);
        setPost(response.data);
        setTitle(response.data.title);
        setContent(response.data.content);
      } catch (err) {
        console.error("Error fetching post:", err);
      }
    };

    fetchPost();
  }, [id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        `${API_URL}/api/posts/${id}`,
        { title, content },
        { headers: { "Authorization": `Bearer ${token}` } }
      );

      setMessage("Post updated successfully!");
      setTimeout(() => navigate(`/post/${id}`), 2000);
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  if (!post) return <p>Loading post...</p>;

  return (
    <div className="edit-post-container">
      <h2>Edit Post</h2>
      {message && <p className="success-message">{message}</p>}
      <form onSubmit={handleEdit}>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} required />
        <button type="submit">Update Post</button>
      </form>
      <BottomNav />
    </div>
  );
}

export default EditPost;
