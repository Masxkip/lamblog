import { Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { Menu, MoreVertical, FilePlus2 } from "lucide-react";
import AuthContext from "../context/AuthContext";
import MobileSidebar from "./MobileSidebar";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 🔔 auto-close kebab when viewport size changes
  useEffect(() => {
    const handleResize = () => setShowMenu(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar  = () => setSidebarOpen(false);

  return (
    <nav className="navbar">
      {/* Hamburger (mobile) */}
      <button className="hamburger-icon" onClick={toggleSidebar}>
        <Menu size={35} />
      </button>

      {/* Logo – flex-ordered via CSS */}
      <Link to="/" className="logo">SLEEK</Link>

      {/* Right-side icons */}
      <div className="nav-links">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
           <Link to="/new-post" className="nav-icon create-post" title="Create Post">
  <FilePlus2 size={22} />
</Link>

            <button
              className="nav-icon kebab-btn"
              onClick={() => setShowMenu((prev) => !prev)}
              title="Menu"
            >
              <MoreVertical size={26} />
            </button>

            {showMenu && (
              <div
                className="kebab-dropdown"
                onClick={() => setShowMenu(false)}
              >
                <Link to={`/profile/${user._id}`}>Profile</Link>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile sidebar drawer */}
      <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
    </nav>
  );
}

export default Navbar;
