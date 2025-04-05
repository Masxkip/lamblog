import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NewPost from "./pages/NewPost";
import SinglePost from "./pages/SinglePost";
import EditPost from "./pages/EditPost";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./context/ProtectedRoute";
import VerifyEmail from "./pages/VerifyEmail";
import AllCategories from "./pages/AllCategories";
import CategoryPosts from "./pages/CategoryPosts";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0); // Always scroll to top on route change
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
       <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

         {/* Protect Routes */}
         <Route 
          path="/profile/:id" 
          element={<ProtectedRoute><Profile /></ProtectedRoute>} 
        />
        <Route 
          path="/edit-profile/:id" 
          element={<ProtectedRoute><EditProfile /></ProtectedRoute>} 
        />
        <Route 
          path="/new-post" 
          element={<ProtectedRoute><NewPost /></ProtectedRoute>} 
        />
        <Route 
          path="/post/:id" 
          element={<ProtectedRoute><SinglePost /></ProtectedRoute>} 
        />
        <Route 
          path="/edit-post/:id" 
          element={<ProtectedRoute><EditPost /></ProtectedRoute>} 
        />
        <Route 
          path="/category/:name" 
          element={<ProtectedRoute><CategoryPosts /></ProtectedRoute>} 
        />
        <Route 
          path="/categories" 
          element={<ProtectedRoute><AllCategories /></ProtectedRoute>} 
        />
      </Routes>
    </Router>
  );
}

export default App;
