// components/HotToast.jsx
import { Toaster } from 'react-hot-toast';

const HotToast = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: "#363636",
          color: "#fff",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          fontSize: "14px",
          fontWeight: "500",
        },
        // Success toast options
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#4ade80",
            secondary: "#fff",
          },
          style: {
            background: "#065f46",
            border: "1px solid #34d399",
          },
        },
        // Error toast options
        error: {
          duration: 4000,
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
          style: {
            background: "#7f1d1d",
            border: "1px solid #f87171",
          },
        },
        // Loading toast options
        loading: {
          duration: Infinity,
          style: {
            background: "#1e293b",
            border: "1px solid #60a5fa",
          },
        },
      }}
    />
  );
};

export default HotToast;