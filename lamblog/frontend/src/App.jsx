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

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;
