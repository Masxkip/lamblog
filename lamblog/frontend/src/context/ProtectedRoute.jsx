import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>; // Wait for auth check to complete

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
