import React from "react";

function GuidancePage() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ textAlign: "center", color: "#1976d2" }}>
          How to Create an IAM Role for This Console
        </h2>

        <ol style={listStyle}>
          <li>
            Go to the{" "}
            <a
              href="https://console.aws.amazon.com/iam/"
              target="_blank"
              rel="noopener noreferrer"
            >
              AWS IAM Console
            </a>.
          </li>
          <li>In the sidebar, select <b>Roles → Create role</b>.</li>
          <li>
            Choose <b>AWS account</b> as the trusted entity type.
          </li>
          <li>
            Under “An AWS account”, select <b>Another AWS account</b> and enter
            your Account ID.
          </li>
          <li>
            Attach policies that allow access to EC2 and Security Groups (for example:
            <code>AmazonEC2ReadOnlyAccess</code>).
          </li>
          <li>Give the role a name, such as <code>MyCrossAccountRole</code>.</li>
          <li>After creation, copy the <b>Role ARN</b>.</li>
        </ol>

        <p style={{ marginTop: "20px", textAlign: "center" }}>
          Now you can return to the <a href="/">Login page</a> and paste the Role ARN
          to access EC2 and Security Groups.
        </p>
      </div>
    </div>
  );
}

export default GuidancePage;

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #fce4ec, #e3f2fd)",
  padding: "20px",
};

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "30px 40px",
  maxWidth: "700px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  lineHeight: "1.6",
};

const listStyle = {
  marginTop: "15px",
  textAlign: "left",
  lineHeight: "1.8",
};
