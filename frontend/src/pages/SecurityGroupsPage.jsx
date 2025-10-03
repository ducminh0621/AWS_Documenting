// import { useState } from "react";
// import axios from "axios";

// function SecurityGroupsPage() {
//   const [securityGroups, setSecurityGroups] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [fetched, setFetched] = useState(false);

//   const backendUrl = "http://127.0.0.1:8001/security-groups";

//   const fetchSGs = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(backendUrl);
//       setSecurityGroups(res.data);
//       setFetched(true);
//     } catch (err) {
//       console.error("Error fetching SGs", err);
//       alert("Failed to load security groups.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Optional filter state (if you plan to use it later)
//   const [filter, setFilter] = useState({
//     vpc_id: "",
//     protocol: "",
//     port: "",
//   });

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilter((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const fetchFilteredSGs = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.post(`${backendUrl}/filter`, {
//         vpc_id: filter.vpc_id || null,
//         protocol: filter.protocol || null,
//         port: filter.port || null,
//       });
//       setSecurityGroups(res.data);
//       setFetched(true);
//     } catch (err) {
//       console.error("Error filtering SGs", err);
//       alert("Failed to filter security groups.");
//     } finally {
//       setLoading(false);
//     }
//   };

  
// const groupedRows = securityGroups.reduce((acc, row) => {
//   if (!acc[row.sg_id]) acc[row.sg_id] = [];
//   acc[row.sg_id].push(row);
//   return acc;
// }, {});


//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <h2>AWS Security Groups</h2>

//       <div style={{ marginBottom: "10px" }}>
//         <button onClick={fetchSGs} disabled={loading}>
//           {loading ? "Loading..." : "Fetch Security Groups"}
//         </button>
//       </div>

//       {!fetched ? (
//         <p>Click "Fetch Security Groups" to load data.</p>
//       ) : (
//         <table border="1" cellPadding="5" style={{ width: "100%", borderCollapse: "collapse" }}>
//           <thead style={{ background: "#f0f0f0" }}>
//             <tr>
//               <th>SG ID</th>
//               <th>SG Name</th>
//               <th>VPC ID</th>
//               <th>Region</th>
//               <th>Instance ID</th>
//               <th>Instance Name</th>
//               <th>Private IP</th>
//               <th>Public IP</th>
//               <th>Direction</th>
//               <th>Protocol</th>
//               <th>Port</th>
//               <th>Source/Destination</th>
//             </tr>
//           </thead>
//           <tbody>
//             {securityGroups.length === 0 ? (
//               <tr>
//                 <td colSpan="12" style={{ textAlign: "center" }}>No data found.</td>
//               </tr>
//             ) : (
//               securityGroups.map((row, idx) => (
//                 <tr key={idx}>
//                   <td>{row.sg_id}</td>
//                   <td>{row.sg_name}</td>
//                   <td>{row.vpc_id}</td>
//                   <td>{row.region}</td>
//                   <td>{row.instance_id || "—"}</td>
//                   <td>{row.instance_name || "—"}</td>
//                   <td>{row.private_ip || "—"}</td>
//                   <td>{row.public_ip || "—"}</td>
//                   <td>{row.direction}</td>
//                   <td>{row.protocol}</td>
//                   <td>{row.port}</td>
//                   <td>{row.cidr}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }

// export default SecurityGroupsPage;

import { useState } from "react";
import axios from "axios";

function SecurityGroupsPage() {
  const [securityGroups, setSecurityGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const backendUrl = "http://127.0.0.1:8001/security-groups";

  const fetchSGs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(backendUrl);
      setSecurityGroups(res.data);
      setFetched(true);
    } catch (err) {
      console.error("Error fetching SGs", err);
      alert("Failed to load security groups.");
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

                // If no rules at all, display one merged row
                // if (allRules.length === 0) {
                //   return (
                //     <tr key={sg.sg_id}>
                //       <td>
                //         <strong>{sg.sg_id}</strong><br />
                //         {sg.sg_name}<br />
                //         {sg.vpc_id}<br />
                //         {sg.region}<br />
                //         — / —<br />— / —  {/* instance info */}
                //       </td>
                //       <td colSpan="4" style={{ textAlign: "center" }}>No rules</td>
                //     </tr>
                //   );
                // }

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
