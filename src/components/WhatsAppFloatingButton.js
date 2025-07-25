import { FaArrowUp } from "react-icons/fa";

function TopScrollButton() {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleScrollToTop}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "10px",
        zIndex: 50,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
      aria-label="Scroll to top"
    >
      <FaArrowUp
        style={{
          width: "40px",
          height: "40px",
          padding: "5px",
          borderRadius: "50%",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          transition: "transform 0.3s ease",
          background: "transparent",
          color: "#000",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      />
    </button>
  );
}

export default TopScrollButton;
