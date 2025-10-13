import React from "react";

function GuidancePage() {
    return (
        <div style={containerStyle}>
        <div style={cardStyle}>
            <h2>How to Set Up IAM Role for AWS Management Tool</h2>
            <p>
            This page will guide you to create an IAM Role that allows our tool to
            temporarily assume your AWS credentials and list EC2 and Security Group
            information.
            </p>

            <h3>Step 1. Create a New IAM Role</h3>
            <p>
            Go to <b>AWS Console → IAM → Roles → Create role</b>.  
            Choose <b>Trusted entity type = Another AWS account</b> and paste this
            ARN into the <b>Account ID or ARN</b> field:
            </p>
            <pre style={codeBox}>
    {`arn:aws:iam::651706784929:role/LG_aws_documenting_ec2_role`}
            </pre>

            <p>
            Or you can manually use the <b>Trust Policy</b> below (replace any
            existing trust relationship with this JSON):
            </p>

            <pre style={codeBox}>
    {`{
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::651706784929:role/LG_aws_documenting_ec2_role"
        },
        "Action": "sts:AssumeRole"
        }
    ]
    }`}
            </pre>

            <h3>Step 2. Attach Permissions Policy</h3>
            <p>
            Next, attach a policy that lets the tool read your AWS resources.  
            You can create a new inline policy using this JSON:
            </p>

            <pre style={codeBox}>
    {`{
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Action": [
            "ec2:DescribeInstances",
            "ec2:DescribeSecurityGroups",
            "ec2:DescribeRegions",
            "ec2:DescribeVpcs",
            "ec2:DescribeSubnets",
            "iam:GetRole",
            "iam:ListRoles",
            "sts:GetCallerIdentity"
        ],
        "Resource": "*"
        }
    ]
    }`}
            </pre>

            <h3>Step 3. Copy the Role ARN</h3>
            <p>
            After the role is created, copy its <b>Role ARN</b> — it will look like:
            </p>
            <pre style={codeBox}>
    arn:aws:iam::<i>YOUR_ACCOUNT_ID</i>:role/<i>aws_documenting</i>
            </pre>

            <p>Then go back to the Login page and paste this Role ARN.</p>

            <button style={buttonStyle} onClick={() => (window.location.href = "/")}>
            ← Back to Login
            </button>
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
  background: "linear-gradient(135deg, #f3e5f5, #e3f2fd)",
  padding: "20px",
};

const cardStyle = {
  backgroundColor: "#fff",
  padding: "30px 40px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  maxWidth: "800px",
  lineHeight: "1.6",
};

const codeBox = {
  backgroundColor: "#f5f5f5",
  padding: "12px",
  borderRadius: "8px",
  fontFamily: "monospace",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  marginBottom: "15px",
};

const buttonStyle = {
  backgroundColor: "#1976d2",
  color: "white",
  padding: "10px 16px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "20px",
};
