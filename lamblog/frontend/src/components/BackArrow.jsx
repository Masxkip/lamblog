// components/BackArrow.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; // You can switch icons if you want;

function BackArrow() {
  const navigate = useNavigate();

  return (
    <button className="back-circle" onClick={() => navigate(-1)}>
      <ArrowLeft size={18} />
    </button>
  );
}

export default BackArrow;
