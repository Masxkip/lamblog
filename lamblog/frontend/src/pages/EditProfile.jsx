import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import BackArrow from "../components/BackArrow";
import LoadingButton from "../components/LoadingButton";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function EditProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUserProfile } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
    setBio(user?.bio || "");
    setLocation(user?.location || "");
    setWebsite(user?.website || "");
  }, [user]);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Unauthorized: No token found.");
      return;
    }

    setLoading(true); // 🔥 Start loading

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);
    formData.append("location", location);
    formData.append("website", website);
    if (profilePic) {
      formData.append("profilePic", profilePic);
    }

    try {
      const res = await axios.put(`${API_URL}/api/users/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
      });

      setMessage("Profile updated successfully!");

      // Update AuthContext with new profile picture
      updateUserProfile(res.data.user);

      setTimeout(() => navigate(`/profile/${id}`), 2000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage(err.response?.data?.message || "Profile update failed.");
    }
     finally {
    setLoading(false); // 🔥 End loading
  }
  };

  return (
    <div className="edit-profile-container">
      <br />
      <BackArrow />
      <h2>Edit Profile</h2>
      <form onSubmit={handleEditProfile}>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Enter bio..." />
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" />
        <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} />
        <LoadingButton isLoading={loading} type="submit">
          Save Changes
        </LoadingButton>
        {message && <p className="success-message">{message}</p>}
      </form>
      <BottomNav />
    </div>
  );
}

export default EditProfile;
