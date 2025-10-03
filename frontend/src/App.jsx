import { Routes, Route, Link } from "react-router-dom";
import SecurityGroupsPage from "./pages/SecurityGroupsPage";
import EC2Page from "./pages/EC2Page";
import HomePage from "./pages/HomePage";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/" style={{ marginRight: "10px" }}>Home</Link>
        <Link to="/security-groups" style={{ marginRight: "10px" }}>Security Groups</Link>
        <Link to="/ec2">EC2</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/security-groups" element={<SecurityGroupsPage />} />
        <Route path="/ec2" element={<EC2Page />} />
      </Routes>
    </div>
  );
  // const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("session_id"));
  // return loggedIn ? (
  //   <SecurityGroupsPage />
  // ) : (
  //   <HomePage onLogin={() => setLoggedIn(true)} />
  // );
}

export default App;
