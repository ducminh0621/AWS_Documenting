import React, { useState, useEffect } from "react";
import axios from "axios";

function HomePage({ onLogin }) {
  const [roleArn, setRoleArn] = useState("");
  const [region, setRegion] = useState("ap-northeast-2");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const sessionId = localStorage.getItem("x_session_id");
    if (sessionId) setLoggedIn(true);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/backend-home/", {
        role_arn: roleArn,
        region: region,
      });
      const { session_id } = res.data;
      localStorage.setItem("x_session_id", session_id);
      setLoggedIn(true);
      onLogin && onLogin();
    } catch (err) {
      console.error("Login failed", err);
      alert("Failed to assume role.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("x_session_id");
    setLoggedIn(false);
  };

  // If logged in → show navigation links
  if (loggedIn) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Welcome to AWS Management Console</h2>
        <p>You are logged in with an assumed role.</p>
        <div style={{ marginTop: "30px" }}>
          <a href="/security-groups" style={linkStyle}>
            🔒 Security Groups
          </a>
          <a href="/ec2" style={linkStyle}>
            💻 EC2 Instances
          </a>
        </div>
        <button onClick={handleLogout} style={logoutButtonStyle}>
          Logout
        </button>
      </div>
    );
  }

  // Otherwise → show login form
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ textAlign: "center" }}>Login with AWS Role</h2>
        <div style={{ marginBottom: "15px" }}>
          <label>Role ARN: </label>
          <input
            type="text"
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label>Region: </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={inputStyle}
          />
        </div>
        <button onClick={handleLogin} disabled={loading} style={buttonStyle}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p style={{ textAlign: "center", marginTop: "15px" }}>
          Don't know how to login?{" "}
          <a href="/guidance" style={{ color: "#1976d2", textDecoration: "underline" }}>
            Follow this guidance
          </a>
        </p>
      </div>
    </div>
  );
}

export default HomePage;

// --- Inline styles for quick beautification ---
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e3f2fd, #fce4ec)",
};

const cardStyle = {
  padding: "30px 40px",
  borderRadius: "12px",
  backgroundColor: "#fff",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  width: "400px",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginTop: "5px",
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
};

const linkStyle = {
  margin: "0 20px",
  textDecoration: "none",
  color: "#1976d2",
  fontSize: "18px",
};

const logoutButtonStyle = {
  marginTop: "40px",
  padding: "8px 16px",
  backgroundColor: "#b71c1c",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};