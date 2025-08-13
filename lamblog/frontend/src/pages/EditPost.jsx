import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import LoadingButton from "../components/LoadingButton";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [message, setMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(true); 
  const [saving, setSaving] = useState(false);          

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setPageLoading(true);
        const { data } = await axios.get(`${API_URL}/api/posts/${id}`);
        setPost(data);
        setTitle(data.title || "");
        setContent(data.content || "");
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    if (saving) return; // prevent double submit
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/api/posts/${id}`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Post updated successfully!");
      setTimeout(() => navigate(`/post/${id}`), 1500);
    } catch (err) {
      console.error("Error updating post:", err);
      setSaving(false); // re-enable on error
    }
  };

  if (pageLoading) return <p>Loading post...</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="post-container">
      <BackArrow />
      <h2>Edit Post</h2>

      {message && <p className="success-message">{message}</p>}

      <form onSubmit={handleEdit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={saving}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={saving}
        />
        <LoadingButton
          isLoading={saving}
          type="submit"
          className={`submit-btn ${saving ? "loading" : ""}`}
          disabled={saving}
        >
          Update Post
        </LoadingButton>
      </form>

      <BottomNav />
    </div>
  );
}

export default EditPost;
