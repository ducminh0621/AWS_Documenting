import { useState } from "react";
import axios from "axios";

function SecurityGroupsPage() {
  const [securityGroups, setSecurityGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [filteredSg, setFilteredSg] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
        window.location.href = "/";
      }
      else if (err.request) {
        console.error("No response from backend:", err.request);
        alert("No response from backend service.");
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKey = (e) => {
  if (e.key === "Enter") {
    const value = searchTerm.toLowerCase();

    const filtered = securityGroups.filter((sg) =>
      sg.tags.some(tag =>
        tag.Value?.toLowerCase().includes(value)
      )
    );

    setFilteredSg(filtered);
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
        <div>
          <div style={{ marginTop: "10px" }}>
            <input
              type="text"
              placeholder="Search by tag value..."
              value={searchTerm}
              onChange={handleSearchInput}
              onKeyDown={handleSearchKey}
            />
          </div>
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
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {filteredSg.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", padding: "15px" }}>
                    No Security Group found.
                  </td>
                </tr>
              ) : (
                filteredSg.map((sg) => {
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
                      <td>
                        {sg.tags.length > 0 ? (
                          <div>
                            {sg.tags.map((tag) => (
                              <span key={tag.Key}>
                                {tag.Key}: {tag.Value}
                                <br />
                              </span>
                            ))}
                          </div>
                        ) : (
                          "No Tags"
                        )}
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SecurityGroupsPage;
