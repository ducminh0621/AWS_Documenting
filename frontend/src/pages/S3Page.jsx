import { useState } from "react";
import axios from "axios";

function S3BucketsPage() {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const sessionId = localStorage.getItem("x_session_id");

  const backendUrl = "/api/backend-s3/";

  const fetchBuckets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(backendUrl, {
        headers: { "x-session-ID": sessionId },
      });
      setBuckets(res.data);
      setFetched(true);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.error("Backend error:", err.response.data);
        alert("Unauthorized. Please login again.");
        localStorage.removeItem("x_session_id");
        window.location.href = "/";
      } else if (err.request) {
        console.error("No response from backend:", err.request);
        alert("No response from backend service.");
        window.location.href = "/";
      } else {
        console.error("Error fetching S3 data:", err.message);
        alert("Error fetching bucket data.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>AWS S3 Buckets</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={fetchBuckets} disabled={loading}>
          {loading ? "Loading..." : "Fetch S3 Buckets"}
        </button>
      </div>

      {!fetched ? (
        <p>Click "Fetch S3 Buckets" to load data.</p>
      ) : (
        <table
          border="1"
          cellPadding="5"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th>Bucket Name</th>
              <th>Region</th>
              <th>Static Website Hosting</th>
              <th>Versioning Enabled</th>
              <th>MFA Delete</th>
              <th>Lifecycle Rules</th>
              <th>Replication Enabled</th>
              <th>Copy Settings</th>
              <th>Encrypted</th>
              <th>KMS Key ID</th>
              <th>Block Public Access</th>
            </tr>
          </thead>
          <tbody>
            {buckets.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", padding: "15px" }}>
                  No buckets found.
                </td>
              </tr>
            ) : (
              buckets.map((bkt) => (
                <tr key={bkt.name}>
                  <td>{bkt.name}</td>
                  <td>{bkt.region || "—"}</td>
                  <td style={{ color: bkt.static_website ? "green" : "red" }}>
                    {bkt.static_website ? "Enabled" : "Disabled"}
                  </td>
                  <td style={{ color: bkt.versioning_enabled ? "green" : "red" }}>
                    {bkt.versioning_enabled ? "Enabled" : "Disabled"}
                  </td>
                  <td>{bkt.mfa_delete ? "Enabled" : "Disabled"}</td>
                  <td>{bkt.lifecycle_rules || 0}</td>
                  <td style={{ color: bkt.replication_enabled ? "green" : "red" }}>
                    {bkt.replication_enabled ? "Yes" : "No"}
                  </td>
                  <td>{bkt.copy_settings_enabled ? "True" : "False"}</td>
                  <td style={{ color: bkt.encrypted ? "green" : "red" }}>
                    {bkt.encrypted ? "Yes" : "No"}
                  </td>
                  <td style={{ fontSize: "12px", maxWidth: "250px", wordWrap: "break-word" }}>
                    {bkt.kms_key_id || "—"}
                  </td>
                  <td style={{ color: bkt.block_public_access ? "green" : "red" }}>
                    {bkt.block_public_access ? "True" : "False"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default S3BucketsPage;