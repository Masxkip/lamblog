import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";// Import profile icon
import AuthContext from "../context/AuthContext";
import { Menu, UserCircle } from "lucide-react"; // ✅ Menu icon for hamburger
import MobileSidebar from "./MobileSidebar";     // ✅ Import our sidebar
import { useState } from "react";                // ✅ To track sidebar open/close


function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <nav className="navbar">
  {/* ✅ Hamburger Icon (Mobile Only) */}
  <button className="hamburger-icon" onClick={toggleSidebar}>
    <Menu size={33} />
  </button>

  {/* ✅ Centered Logo */}
  <Link to="/" className="logo">SLXXK</Link>

  {/* ✅ Right-side Profile Icon */}
  <div className="nav-links">
    {!user ? (
      <>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </>
    ) : (
      <>
        <Link to="/new-post" >Create a Post</Link>
        <Link to={`/profile/${user._id}`} className="profile-link">
          {user.profilePicture ? (
            <img
              src={user.profilePicture.startsWith("http") ? user.profilePicture : `${import.meta.env.VITE_BACKEND_URL}${user.profilePicture}`}
              alt="Profile"
              className="nav-profile-pic"
            />
          ) : (
            <UserCircle className="default-profile-icon" size={32} />
          )}
        </Link>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </>
    )}
  </div>

  {/* ✅ Mobile Sidebar Drawer */}
  <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
</nav>

  );
}

export default Navbar;
