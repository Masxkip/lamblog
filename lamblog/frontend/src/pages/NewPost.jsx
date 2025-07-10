import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Camera,
  Music2,
  Lock
} from "lucide-react";

import AuthContext from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import LoadingButton from "../components/LoadingButton";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function NewPost() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [music, setMusic] = useState(null);
  const [musicPreview, setMusicPreview] = useState(null);
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = ["Technology", "Health", "Lifestyle", "Education", "Business", "Other"];

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMusicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMusic(file);
      setMusicPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const removeMusic = () => {
    setMusic(null);
    setMusicPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Unauthorized: No token found.");
      return;
    }

    setLoading(true);

    let finalCategory =
      category === "Other"
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-container">
      <BackArrow />
      <h2>Share Your Views with SEEK</h2>
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

        {/* Category Select */}
        <div className="file-upload-section">
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">-- Choose a Category --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Custom Category */}
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

        {/* Premium Toggle */}
{/* --- Premium Toggle (modern switch) --- */}
{user.isSubscriber ? (
  <div className="file-upload-section premium-toggle">
    <label className="toggle">
      <input
        type="checkbox"
        checked={isPremium}
        onChange={(e) => setIsPremium(e.target.checked)}
      />
      <span className="slider"></span>
    </label>
    <span className="toggle-label">Mark this post as Premium</span>
  </div>
) : (
  <div className="file-upload-section premium-toggle">
    <label className="toggle disabled">
      <input type="checkbox" disabled />
      <span className="slider"></span>
    </label>

    <div className="locked-inline">
      <Lock size={14} style={{ marginRight: "6px" }} />
      <span>Subscribe to unlock premium posting</span>
      <Link to="/subscribe">
        <button className="subscribe-btn small">Subscribe Now</button>
      </Link>
    </div>
  </div>
)}


        {/* Image Upload with Preview */}
        <div className="file-upload-section">
          <label>
            <Camera size={16} style={{ marginRight: "6px" }} />
            Add an Image:
          </label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <div className="preview-block">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button type="button" className="remove-btn" onClick={removeImage}>Remove</button>
            </div>
          )}
        </div>

        {/* Music Upload with Preview */}
        {user.isSubscriber ? (
          <div className="file-upload-section">
            <label>
              <Music2 size={16} style={{ marginRight: "6px" }} />
              Add Music:
            </label>
            <input type="file" accept="audio/*" onChange={handleMusicChange} />
            {musicPreview && (
              <div className="preview-block">
                <audio controls src={musicPreview} className="audio-preview" />
                <button type="button" className="remove-btn" onClick={removeMusic}>Remove</button>
              </div>
            )}
          </div>
        ) : (
          <div className="file-upload-section">
            <label>
              <Music2 size={16} style={{ marginRight: "6px" }} />
              Add Music:
            </label>
            <input type="file" disabled />
            <div className="locked-inline">
              <Lock size={14} style={{ marginRight: "6px" }} />
              <span>Subscribe to upload music</span>
            </div>
          </div>
        )}

       <LoadingButton
  isLoading={loading}
  type="submit"
  className={`submit-btn ${loading ? "loading" : ""}`}
>
  Create Post
</LoadingButton>
      </form>

      <BottomNav />
    </div>
  );
}

export default NewPost;
