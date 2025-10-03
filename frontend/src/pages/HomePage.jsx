import { useState } from "react";
import axios from "axios";

function HomePage({ onLogin }) {
  const [roleArn, setRoleArn] = useState("");
  const [region, setRegion] = useState("ap-northeast-2");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8001/auth/assume-role", {
        role_arn: roleArn,
        region: region
      });
      const { session_id } = res.data;
      localStorage.setItem("session_id", session_id);
      onLogin();
    } catch (err) {
      console.error("Login failed", err);
      alert("Failed to assume role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login with AWS Role</h2>
      <div>
        <label>Role ARN: </label>
        <input
          type="text"
          value={roleArn}
          onChange={(e) => setRoleArn(e.target.value)}
          style={{ width: "400px" }}
        />
      </div>
      <div style={{ marginTop: "10px" }}>
        <label>Region: </label>
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </div>
      <button onClick={handleLogin} disabled={loading} style={{ marginTop: "15px" }}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}

export default HomePage;
