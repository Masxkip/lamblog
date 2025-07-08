import React from "react";
import { FaHourglassHalf } from "react-icons/fa";

function LoadingButton({
  isLoading,
  onClick,
  children,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`loading-btn ${isLoading ? "loading" : ""} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            gap: "8px",
          }}
        >
          <FaHourglassHalf color="white" size={16} />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

export default LoadingButton;
