import React, { useEffect, useState } from "react";
import '../styles/Header.css';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

const Toast = ({ type, message, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Handle the progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    // Handle the toast visibility
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Allow time for exit animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle />;
      case "error":
        return <FaExclamationTriangle />;
      case "info":
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <div className={`toast ${type} ${isVisible ? "show" : "hide"}`}>
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-message">{message}</div>
      </div>
      <div className="toast-progress" style={{ width: `${progress}%` }}></div>
    </div>
  );
};

export default Toast;