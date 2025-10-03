# app/main.py
from fastapi import FastAPI, Query
from fastapi import Body
from pydantic import BaseModel
from typing import List, Optional
import boto3
import io
import datetime
import openpyxl
import tempfile
import os
import botocore
import uuid


app = FastAPI(
    title="AWS Resource Documentation Service",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import csv

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

last_security_groups = []

# ---------- Models ----------
class InboundRule(BaseModel):
    protocol: str
    port: str
    source: str

class OutboundRule(BaseModel):
    protocol: str
    port: str
    destination: str

class InstanceInfo(BaseModel):
    instance_id: str
    instance_name: Optional[str] = None
    private_ip: Optional[str] = None
    public_ip: Optional[str] = None

class SecurityGroupModel(BaseModel):
    sg_id: str
    sg_name: str
    vpc_id: str
    region: str
    direction: str            # inbound | outbound
    protocol: str
    port: str
    cidr: str
    instance_id: Optional[str] = None
    instance_name: Optional[str] = None
    private_ip: Optional[str] = None
    public_ip: Optional[str] = None

class ExportRequest(BaseModel):
    region: str = "ap-northeast-2"
    account: Optional[str] = None  # for multi-account later


class FilterRequest(BaseModel):
    vpc_id: Optional[str] = None
    protocol: Optional[str] = None
    port: Optional[str] = None


# ---------- Endpoints ----------
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "aws-doc-backend"}


@app.get("/security-groups", response_model=List[SecurityGroupModel])
def list_security_groups(region: str = Query("ap-northeast-2")):
    ec2 = boto3.client("ec2", region_name=region)

    # 1️⃣ Get SGs
    sg_resp = ec2.describe_security_groups()

    # 2️⃣ Get EC2 instances to map SG → instance info
    instance_resp = ec2.describe_instances()
    sg_to_instances = {}
    for reservation in instance_resp.get("Reservations", []):
        for inst in reservation.get("Instances", []):
            # Find Name tag
            name_tag = None
            for t in inst.get("Tags", []):
                if t["Key"] == "Name":
                    name_tag = t["Value"]
                    break

            for sg in inst.get("SecurityGroups", []):
                sg_id = sg["GroupId"]
                if sg_id not in sg_to_instances:
                    sg_to_instances[sg_id] = []
                sg_to_instances[sg_id].append({
                    "instance_id": inst.get("InstanceId"),
                    "instance_name": name_tag,
                    "private_ip": inst.get("PrivateIpAddress"),
                    "public_ip": inst.get("PublicIpAddress")
                })

    # 3️⃣ Flatten everything
    result = []

    for sg in sg_resp["SecurityGroups"]:
        sg_id = sg["GroupId"]
        sg_name = sg.get("GroupName", "")
        vpc_id = sg.get("VpcId", "")

        # inbound rules
        for rule in sg.get("IpPermissions", []):
            proto = rule.get("IpProtocol", "All")
            if proto == "-1":
                proto = "All"
            port = str(rule.get("FromPort", "All")) if "FromPort" in rule else "All"
            for ip_range in rule.get("IpRanges", []):
                cidr = ip_range.get("CidrIp", "")
                instances = sg_to_instances.get(sg_id, [None]) or [None]
                for inst in instances:
                    result.append({
                        "sg_id": sg_id,
                        "sg_name": sg_name,
                        "vpc_id": vpc_id,
                        "region": region,
                        "direction": "inbound",
                        "protocol": proto,
                        "port": port,
                        "cidr": cidr,
                        "instance_id": inst["instance_id"] if inst else None,
                        "instance_name": inst["instance_name"] if inst else None,
                        "private_ip": inst["private_ip"] if inst else None,
                        "public_ip": inst["public_ip"] if inst else None,
                    })

        # outbound rules
        for rule in sg.get("IpPermissionsEgress", []):
            proto = rule.get("IpProtocol", "All")
            if proto == "-1":
                proto = "All"
            port = str(rule.get("FromPort", "All")) if "FromPort" in rule else "All"
            for ip_range in rule.get("IpRanges", []):
                cidr = ip_range.get("CidrIp", "")
                instances = sg_to_instances.get(sg_id, [None]) or [None]
                for inst in instances:
                    result.append({
                        "sg_id": sg_id,
                        "sg_name": sg_name,
                        "vpc_id": vpc_id,
                        "region": region,
                        "direction": "outbound",
                        "protocol": proto,
                        "port": port,
                        "cidr": cidr,
                        "instance_id": inst["instance_id"] if inst else None,
                        "instance_name": inst["instance_name"] if inst else None,
                        "private_ip": inst["private_ip"] if inst else None,
                        "public_ip": inst["public_ip"] if inst else None,
                    })

    return result


@app.post("/security-groups/filter")
def filter_security_groups( req: FilterRequest):
    global last_security_groups
    if not last_security_groups:
        return {"error": "No security groups data available. Please call /security-groups first."}
    vpc_id = req.vpc_id
    protocol = req.protocol
    port = req.port
    
    filtered = last_security_groups
    if vpc_id:
        filtered = [sg for sg in filtered if sg["vpc_id"] == vpc_id]
    if protocol:
        filtered = [
            sg for sg in filtered
            if any(rule["protocol"] == protocol for rule in sg["inbound_rules"] + sg["outbound_rules"])
        ]
    if port:
        filtered = [
            sg for sg in filtered
            if any(rule["port"] == port for rule in sg["inbound_rules"] + sg["outbound_rules"])
        ]
    return filtered

@app.post("/security-groups/export/csv")
def export_security_groups_csv(req: ExportRequest = Body(...)):
    region = req.region
    ec2 = boto3.client("ec2", region_name=region)
    resp = ec2.describe_security_groups()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "sg_id", "name", "vpc_id", "region", "direction", "protocol", "port", "cidr"
    ])

    for sg in resp["SecurityGroups"]:
        sg_id = sg["GroupId"]
        name = sg.get("GroupName", "")
        vpc_id = sg.get("VpcId", "")
        # Inbound rules
        for rule in sg.get("IpPermissions", []):
            proto = rule.get("IpProtocol", "All")
            if proto == "-1":
                proto = "All"
            from_port = rule.get("FromPort", "All") if "FromPort" in rule else "All"
            for ip_range in rule.get("IpRanges", []):
                writer.writerow([
                    sg_id, name, vpc_id, region, "inbound", proto, str(from_port), ip_range.get("CidrIp", "")
                ])
        # Outbound rules
        for rule in sg.get("IpPermissionsEgress", []):
            proto = rule.get("IpProtocol", "All")
            if proto == "-1":
                proto = "All"
            from_port = rule.get("FromPort", "All") if "FromPort" in rule else "All"
            for ip_range in rule.get("IpRanges", []):
                writer.writerow([
                    sg_id, name, vpc_id, region, "outbound", proto, str(from_port), ip_range.get("CidrIp", "")
                ])

    output.seek(0)
    filename = f"security_groups_{region}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )