import { Routes, Route, Link } from "react-router-dom";
import SecurityGroupsPage from "./pages/SecurityGroupsPage";
import EC2Page from "./pages/EC2Page";
import HomePage from "./pages/HomePage";
import GuidancePage from "./pages/GuidancePage";
import S3Page from "./pages/S3Page";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/security-groups" element={<SecurityGroupsPage />} />
      <Route path="/ec2" element={<EC2Page />} />
      <Route path="/guidance" element={<GuidancePage />} />
      <Route path="/s3" element={<S3Page />} />
    </Routes>
);
}

export default App;
