import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Menu, UserCircle } from "lucide-react"; 
import MobileSidebar from "./MobileSidebar";    
import { useState } from "react";                


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

  <button className="hamburger-icon" onClick={toggleSidebar}>
    <Menu size={33} />
  </button>


  <Link to="/" className="logo">SLXXK</Link>


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
  
  <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
</nav>

  );
}

export default Navbar;
