import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle } from "lucide-react"; // switched to Lucide for consistency

function BackArrow() {
  const navigate = useNavigate();

  return (
    <button className="back-circle" onClick={() => navigate(-1)}>
      <ArrowLeftCircle size={32} strokeWidth={2.5} />
    </button>
  );
}

export default BackArrow;
