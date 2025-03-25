import { Link } from "react-router-dom";
import { UserCircle, Home as HomeIcon, FileText } from "lucide-react";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

function BottomNav() {
  const { user } = useContext(AuthContext);
  
  return (
    <nav className="bottom-nav">
      <Link to="/" className="sidebar-icon">
        <HomeIcon className="icon" size={21} />
      </Link>
      <Link to="/new-post" className="sidebar-icon">
        <FileText className="icon" size={21} />
      </Link>
      <Link to={user ? `/profile/${user._id}` : "/login"} className="sidebar-icon">
        <UserCircle className="default-profile-icon" size={24} />
      </Link>
    </nav>
  );
}

export default BottomNav;
