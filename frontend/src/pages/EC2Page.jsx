import React, { useEffect, useState } from "react";
import axios from "axios";

function EC2Page() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const backendUrl = "/api/backend-ec2/";

  // useEffect(() => {
  //   fetchInstances();
  // }, []);

  const fetchInstances = async () => {
    setLoading(true);
    setError("");
    try {
      const sessionId = localStorage.getItem("x_session_id");
      if (!sessionId) {
        setError("You must log in first.");
        setLoading(false);
        return;
      }

      const res = await axios.get(backendUrl, {
        headers: { "x-session-ID": sessionId },
      });
      setInstances(res.data);
      setFetched(true);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch EC2 instances.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h2>AWS EC2 Instances</h2>

    <div style={{ marginBottom: "10px" }}>
      <button onClick={fetchInstances} disabled={loading}>
        {loading ? "Loading..." : "Fetch EC2 Instances"}
      </button>
    </div>

    {!fetched ? (
      <p>Click "Fetch EC2 Instances" to load data.</p>
    ) : (
      <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th>Instance ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>OS</th>
            <th>State</th>
            <th>VPC ID</th>
            <th>AZ</th>
            <th>Subnet ID</th>
            <th>Private IP</th>
            <th>Public IP</th>
            <th>Security Groups</th>
            <th>Key Pair</th>
            <th>AMI ID</th>
            <th>KMS Key</th>
            <th>Root Volume ID</th>
            <th>Root Volume Type</th>
            <th>Root Volume Size (GB)</th>
            <th>Data Volume ID</th>
            <th>Data Volume Types</th>
            <th>Data Volume Sizes (GB)</th>
          </tr>
        </thead>
        <tbody>
          {instances.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                No instances found.
              </td>
            </tr>
          ) : (
            instances.map((inst) => (
              <tr key={inst.instance_id}>
                <td>{inst.instance_id}</td>
                <td>{inst.name || "-"}</td>
                <td>{inst.type}</td>
                <td>{inst.os}</td>
                <td>
                  <span style={getStateStyle(inst.state)}>{inst.state}</span>
                </td>
                <td>{inst.vpc_id || "-"}</td>
                <td>{inst.az}</td>
                <td>{inst.subnet_id || "-"}</td>
                <td>{inst.private_ip || "-"}</td>
                <td>{inst.public_ip || "-"}</td>
                <td>
                  {inst.security_groups.map((sg) => (
                    <div key={sg.group_id}>
                      {sg.group_name} ({sg.group_id})
                    </div>
                  ))}
                </td>
                <td>{inst.key_pair || "-"}</td>
                <td>{inst.ami_id || "-"}</td>
                <td>{inst.kms_key_id || "-"}</td>
                <td>{inst.root_volume_id || "-"}</td>
                <td>{inst.root_volume_type || "-"}</td>
                <td>{inst.root_volume_size || "-"}</td>
                <td>
                  {inst.data_volumes && inst.data_volumes.length > 0
                    ? inst.data_volumes.map((v) => v.volume_id).join(", ")
                    : "-"}
                </td>
                <td>
                  {inst.data_volumes && inst.data_volumes.length > 0
                    ? inst.data_volumes.map((v) => v.type).join(", ")
                    : "-"}
                </td>
                <td>
                  {inst.data_volumes && inst.data_volumes.length > 0
                    ? inst.data_volumes.map((v) => v.size_gb).join(", ")
                    : "-"}
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




    
    /* <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>EC2 Instances</h2>
      </div>

      {loading && <p>Loading EC2 instances...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Instance ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>State</th>
              <th>Private IP</th>
              <th>Public IP</th>
              <th>AZ</th>
              <th>Security Groups</th>
              <th>Launch Time</th>
            </tr>
          </thead>
          <tbody>
            {instances.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No instances found.
                </td>
              </tr>
            ) : (
              instances.map((inst) => (
                <tr key={inst.instance_id}>
                  <td>{inst.instance_id}</td>
                  <td>{inst.name || "-"}</td>
                  <td>{inst.type}</td>
                  <td>
                    <span style={getStateStyle(inst.state)}>{inst.state}</span>
                  </td>
                  <td>{inst.private_ip || "-"}</td>
                  <td>{inst.public_ip || "-"}</td>
                  <td>{inst.az}</td>
                  <td>
                    {inst.security_groups.map((sg) => (
                      <div key={sg.group_id}>
                        {sg.group_name} ({sg.group_id})
                      </div>
                    ))}
                  </td>
                  <td>
                    {inst.launch_time
                      ? new Date(inst.launch_time).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div> */


export default EC2Page;

// ---------- Inline Styles ----------
const containerStyle = {
  padding: "40px",
  fontFamily: "Segoe UI, sans-serif",
  backgroundColor: "#fafafa",
  minHeight: "100vh",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const regionInputStyle = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginRight: "8px",
};

const refreshButtonStyle = {
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

const getStateStyle = (state) => ({
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "8px",
  color: "white",
  backgroundColor:
    state === "running"
      ? "#2e7d32"
      : state === "stopped"
      ? "#c62828"
      : "#757575",
});

tableStyle.th = {
  backgroundColor: "#1976d2",
  color: "white",
  padding: "10px",
};

tableStyle.td = {
  borderBottom: "1px solid #ddd",
  padding: "10px",
};
