import React from "react";
import { FaHourglassHalf } from "react-icons/fa";

function LoadingButton({ isLoading, onClick, children, className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`loading-btn ${className}`}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaHourglassHalf color="white" size={16} />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default LoadingButton;
