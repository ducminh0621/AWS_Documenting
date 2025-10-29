import { useState } from "react";
import axios from "axios";

function NetworkPage() {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const sessionId = localStorage.getItem("x_session_id");

  const backendUrl = "/api/backend-network/";

  const fetchNetworkInfo = async () => {
    setLoading(true);
    try {
      const res = await axios.get(backendUrl, {
        headers: { "x-session-ID": sessionId },
      });
      setNetworkData(res.data);
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
        console.error("Error fetching network data:", err.message);
        alert("Error fetching network data.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>AWS Network Documentation</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={fetchNetworkInfo} disabled={loading}>
          {loading ? "Loading..." : "Fetch Network Info"}
        </button>
      </div>

      {!fetched ? (
        <p>Click "Fetch Network Info" to load data.</p>
      ) : !networkData ? (
        <p>No network data found.</p>
      ) : (
        <>
          {/* ---------- VPC TABLE ---------- */}
          <h3>VPC Information</h3>
          <table
            border="1"
            cellPadding="5"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            <thead style={{ background: "#f0f0f0" }}>
              <tr>
                <th>VPC Name</th>
                <th>VPC ID</th>
                <th>CIDR Block</th>
              </tr>
            </thead>
            <tbody>
              {networkData.vpcs.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No VPCs found.
                  </td>
                </tr>
              ) : (
                networkData.vpcs.map((vpc) => (
                  <tr key={vpc.vpc_id}>
                    <td>{vpc.name}</td>
                    <td>{vpc.vpc_id}</td>
                    <td>{vpc.cidr_block}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ---------- SUBNET TABLE ---------- */}
          <h3>Subnet Information</h3>
          <table
            border="1"
            cellPadding="5"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            <thead style={{ background: "#f0f0f0" }}>
              <tr>
                <th>Subnet Name</th>
                <th>Subnet ID</th>
                <th>VPC ID</th>
                <th>CIDR Block</th>
                <th>Availability Zone</th>
                <th>Route Table</th>
                <th>Available IPs</th>
              </tr>
            </thead>
            <tbody>
              {networkData.subnets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No subnets found.
                  </td>
                </tr>
              ) : (
                networkData.subnets.map((sub) => (
                  <tr key={sub.subnet_id}>
                    <td>{sub.subnet_name}</td>
                    <td>{sub.subnet_id}</td>
                    <td>{sub.vpc_id}</td>
                    <td>{sub.cidr_block}</td>
                    <td>{sub.availability_zone}</td>
                    <td>{sub.route_table || "N/A"}</td>
                    <td>{sub.available_ips}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ---------- NAT GATEWAY TABLE ---------- */}
          <h3>NAT Gateway Information</h3>
          <table
            border="1"
            cellPadding="5"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            <thead style={{ background: "#f0f0f0" }}>
              <tr>
                <th>NAT Name</th>
                <th>NAT Gateway ID</th>
                <th>VPC ID</th>
                <th>Type</th>
                <th>Elastic IP</th>
                <th>Private IP</th>
                <th>Subnet ID</th>
                <th>Network Interface ID</th>
                <th>ARN</th>
              </tr>
            </thead>
            <tbody>
              {networkData.nat_gateways.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    No NAT Gateways found.
                  </td>
                </tr>
              ) : (
                networkData.nat_gateways.map((nat) => (
                  <tr key={nat.nat_gateway_id}>
                    <td>{nat.nat_name || "N/A"}</td>
                    <td>{nat.nat_gateway_id}</td>
                    <td>{nat.vpc_id}</td>
                    <td>{nat.type || "N/A"}</td>
                    <td>{nat.elastic_ip}</td>
                    <td>{nat.private_ip || "N/A"}</td>
                    <td>{nat.subnet_id}</td>
                    <td>{nat.network_interface_id || "N/A"}</td>
                    <td
                      style={{
                        maxWidth: "250px",
                        wordBreak: "break-all",
                        fontSize: "12px",
                      }}
                    >
                      {nat.nat_arn || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default NetworkPage;
