import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function NewPost() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [music, setMusic] = useState(null);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState(""); 
  const [message, setMessage] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  const categories = ["Technology", "Health", "Lifestyle", "Education", "Business", "Other"];

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Unauthorized: No token found.");
      return;
    }

    // ✅ Normalize custom category if used
    let finalCategory = category === "Other"
      ? customCategory.trim().toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : category;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("author", user._id);
    formData.append("category", finalCategory);
    formData.append("isPremium", isPremium);
    if (image) formData.append("image", image);
    if (music) formData.append("music", music);

    try {
      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Post created successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create post.");
    }
  };

  return (
    <div className="post-container">
      <BackArrow />
      <h2>Create New Post</h2>
      {message && <p className="success-message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Title" 
          required 
        />
        
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="Content" 
          required 
        />

        {/* Category Selection */}
        <div className="file-upload-section">
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">-- Choose a Category --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Custom Category Input */}
        {category === "Other" && (
          <div className="file-upload-section">
            <label>Enter Custom Category:</label>
            <input 
              type="text" 
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Type category..."
              required 
            />
          </div>
        )}

         {/* Premium Post Toggle */}
        {user.isSubscriber ? (
          <div className="file-upload-section">
            <label>
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
              />
              Mark this post as Premium
            </label>
          </div>
        ) : (
          <div className="file-upload-section">
            <label>
              <input type="checkbox" disabled />
              Mark this post as Premium
            </label>
            <p className="subscribe-notice">
              🔒 Subscribe to unlock premium posting and reach wider audiences.
              <Link to="/subscribe">
                <button className="subscribe-btn">Subscribe Now</button>
              </Link>
            </p>
          </div>
        )}

        {/* Image Upload */}
        <div className="file-upload-section">
          <label>📷 Add an Image:</label>
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        </div>

        {/* Music Upload */}
        {user.isSubscriber ? (
          <div className="file-upload-section">
            <label>🎵 Add Music:</label>
            <input type="file" accept="audio/*" onChange={(e) => setMusic(e.target.files[0])} />
          </div>
        ) : (
          <div className="file-upload-section">
            <label>🎵 Add Music:</label>
            <input type="file" disabled />
            <p className="subscribe-notice">Subscribe to upload music 🎶</p>
            <Link to="/subscribe">
              <button className="subscribe-btn">Subscribe Now</button>
            </Link>
          </div>
        )}

        <button type="submit">Publish</button>
      </form>
      <BottomNav />
    </div>
  );
}

export default NewPost;
