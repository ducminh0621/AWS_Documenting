# AWS Resource Documentation Tool

A web application for documenting AWS infrastructure resources (EC2, S3, Security Groups) across multiple AWS accounts. The tool enables users to **assume roles**, view detailed cloud resource data, and get insight into the state of their AWS environment in an intuitive, interactive dashboard.

## 🚀 Features

- **FastAPI Backend**: Fetches AWS resources (EC2, S3, Security Groups) using Boto3, and displays detailed resource information like **AMI ID**, **Instance Type**, **Region**, **Security Groups**, **Encryption**, **Versioning**, and more.
- **React Frontend**: A dynamic UI for browsing and filtering EC2 instances, S3 buckets, and Security Groups.
- **Role-based Authentication**: Uses **STS AssumeRole** for cross-account access to multiple AWS accounts with temporary credentials.
- **Dockerized Application**: Runs in Docker containers for consistent environments between development, staging, and production.

## 📋 Tech Stack

- **Backend**: Python, FastAPI, Boto3
- **Frontend**: React, Axios
- **Deployment**: Docker, EC2, NGINX
- **Authentication**: AWS STS, IAM roles
- **Version Control**: GitHub

## 🌐 Demo
Login Page:
<img width="1660" height="767" alt="image" src="https://github.com/user-attachments/assets/2e0cd3ed-fe7f-4ede-8b34-6669c8167d3e" />
Security Group:
<img width="3425" height="403" alt="image" src="https://github.com/user-attachments/assets/38f89f2f-868c-4e13-96c0-ad134985d40a" />
EC2 Instances:
<img width="3419" height="272" alt="image" src="https://github.com/user-attachments/assets/d181a7d0-4a61-4f45-8758-658f2739dec3" />
S3 Buckets:
<img width="3415" height="202" alt="image" src="https://github.com/user-attachments/assets/64e25114-3663-469a-aa3d-c8403c90a612" />

## 💻 Local Deployment Setup

### 1. Clone the repository

```bash
git clone https://github.com/ducminh0621/AWS_Documenting.git
cd AWS_Documenting
run docker-compose up --build

**🛠️ Usage

Login with your AWS role ARN.**

Once authenticated, the application will show you:

EC2 Instances: List and filter EC2 instances across regions.

S3 Buckets: View bucket names, region, encryption, public access settings.

Security Groups: View security rules and associated instances.




