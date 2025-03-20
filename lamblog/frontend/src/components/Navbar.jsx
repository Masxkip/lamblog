import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserCircle } from "lucide-react"; // Import profile icon
import AuthContext from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">SLXXK</Link>
      <div className="nav-links">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to={`/profile/${user._id}`} className="profile-link">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="nav-profile-pic" />
              ) : (
                <UserCircle className="default-profile-icon" size={32} />
              )}
            </Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
