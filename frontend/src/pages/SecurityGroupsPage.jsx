import { useState } from "react";
import axios from "axios";

function SecurityGroupsPage() {
  const [securityGroups, setSecurityGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const sessionId = localStorage.getItem("x_session_id");


  const backendUrl = "/api/security-groups/";

  const fetchSGs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(backendUrl, {
        headers: { "x-session-ID": sessionId }
      });
      setSecurityGroups(res.data);
      setFetched(true);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.error("Backend error:", err.response.data);
        alert("Unauthorized. Please login again.");
        localStorage.removeItem("x_session_id");
      }
      else if (err.request) {
        console.error("No response from backend:", err.request);
        alert("No response from backend service.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>AWS Security Groups</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={fetchSGs} disabled={loading}>
          {loading ? "Loading..." : "Fetch Security Groups"}
        </button>
      </div>

      {!fetched ? (
        <p>Click "Fetch Security Groups" to load data.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th>SG ID</th>
              <th>SG Name</th>
              <th>VPC ID</th>
              <th>Region</th>
              <th>Instance ID</th>
              <th>Instance Name</th>
              <th>Private IP</th>
              <th>Public IP</th>
              <th>Direction</th>
              <th>Protocol</th>
              <th>Port</th>
              <th>Source / Destination</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(securityGroups).length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>No data found.</td>
              </tr>
            ) : (
              Object.values(securityGroups).map((sg) => {
                // Flatten inbound + outbound rules, and mark direction
                const allRules = [
                  ...sg.inbound_rules.map((r) => ({ ...r, direction: "Inbound" })),
                  ...sg.outbound_rules.map((r) => ({ ...r, direction: "Outbound" }))
                ];
                return allRules.map((rule, idx) => (
                  <tr key={`${sg.sg_id}-${idx}`}>
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>
                        <div><strong>{sg.sg_id}</strong></div>
                      </td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>{sg.sg_name}</td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>{sg.vpc_id}</td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>{sg.region}</td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>{rule.instance_id || "—"}</td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>{rule.instance_name || "—"}</td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>{rule.private_ip || "—"}</td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={allRules.length}>{rule.public_ip || "—"}</td>
                    )}
                    <td>{rule.direction}</td>
                    <td>{rule.protocol}</td>
                    <td>{rule.port}</td>
                    <td>{rule.cidr}</td>
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SecurityGroupsPage;
