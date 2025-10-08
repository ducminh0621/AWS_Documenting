# app/main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi import Body
from pydantic import BaseModel
from typing import List, Optional, Dict
import boto3
import io
import datetime
import logging
from botocore.exceptions import ClientError, NoCredentialsError, EndpointConnectionError
import openpyxl
import tempfile
import os
import botocore
import uuid

logger = logging.getLogger(__name__)

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

# class SecurityGroupModel(BaseModel):
#     sg_id: str
#     sg_name: str
#     vpc_id: str
#     region: str
#     direction: str            # inbound | outbound
#     protocol: str
#     port: str
#     cidr: str
#     instance_id: Optional[str] = None
#     instance_name: Optional[str] = None
#     private_ip: Optional[str] = None
#     public_ip: Optional[str] = None

class RuleModel(BaseModel):
    protocol: str
    port: str
    cidr: str
    instance_id: Optional[str] = None
    instance_name: Optional[str] = None
    private_ip: Optional[str] = None
    public_ip: Optional[str] = None

class GroupedSecurityGroupModel(BaseModel):
    sg_id: str
    sg_name: str
    vpc_id: str
    region: str
    inbound_rules: List[RuleModel] = []
    outbound_rules: List[RuleModel] = []


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




@app.get("/", response_model=Dict[str, GroupedSecurityGroupModel])
def list_security_groups(region: str = Query("ap-northeast-2")):
    try:
        ec2 = boto3.client("ec2", region_name=region)

        # Describe SGs
        try:
            sg_resp = ec2.describe_security_groups()
        except ClientError as e:
            logger.error(f"Error describing security groups: {e}")
            raise HTTPException(status_code=500, detail="Failed to describe security groups from AWS.")

        # Describe EC2 instances
        try:
            instance_resp = ec2.describe_instances()
        except ClientError as e:
            logger.error(f"Error describing instances: {e}")
            raise HTTPException(status_code=500, detail="Failed to describe EC2 instances from AWS.")

        # Map SG → instances
        sg_to_instances = {}
        for reservation in instance_resp.get("Reservations", []):
            for inst in reservation.get("Instances", []):
                name_tag = next(
                    (t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"),
                    None
                )
                for sg in inst.get("SecurityGroups", []):
                    sg_id = sg["GroupId"]
                    sg_to_instances.setdefault(sg_id, []).append({
                        "instance_id": inst.get("InstanceId"),
                        "instance_name": name_tag,
                        "private_ip": inst.get("PrivateIpAddress"),
                        "public_ip": inst.get("PublicIpAddress")
                    })

        # Construct result
        result: Dict[str, dict] = {}
        for sg in sg_resp["SecurityGroups"]:
            sg_id = sg["GroupId"]
            result[sg_id] = {
                "sg_id": sg_id,
                "sg_name": sg.get("GroupName", ""),
                "vpc_id": sg.get("VpcId", ""),
                "region": region,
                "inbound_rules": [],
                "outbound_rules": [],
            }

            # inbound rules
            for rule in sg.get("IpPermissions", []):
                proto = "All" if rule.get("IpProtocol") == "-1" else rule.get("IpProtocol", "All")
                port = str(rule.get("FromPort", "All")) if "FromPort" in rule else "All"
                for ip_range in rule.get("IpRanges", []):
                    cidr = ip_range.get("CidrIp", "")
                    instances = sg_to_instances.get(sg_id, [None]) or [None]
                    for inst in instances:
                        result[sg_id]["inbound_rules"].append({
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
                proto = "All" if rule.get("IpProtocol") == "-1" else rule.get("IpProtocol", "All")
                port = str(rule.get("FromPort", "All")) if "FromPort" in rule else "All"
                for ip_range in rule.get("IpRanges", []):
                    cidr = ip_range.get("CidrIp", "")
                    instances = sg_to_instances.get(sg_id, [None]) or [None]
                    for inst in instances:
                        result[sg_id]["outbound_rules"].append({
                            "protocol": proto,
                            "port": port,
                            "cidr": cidr,
                            "instance_id": inst["instance_id"] if inst else None,
                            "instance_name": inst["instance_name"] if inst else None,
                            "private_ip": inst["private_ip"] if inst else None,
                            "public_ip": inst["public_ip"] if inst else None,
                        })

        return result

    # AWS credential errors
    except NoCredentialsError:
        logger.error("AWS credentials not found.")
        raise HTTPException(status_code=401, detail="AWS credentials not found. Please configure credentials.")

    # AWS endpoint (region/network) issues
    except EndpointConnectionError as e:
        logger.error(f"Endpoint connection error: {e}")
        raise HTTPException(status_code=502, detail="Failed to connect to AWS endpoint.")

    # Any unexpected errors
    except Exception as e:
        logger.exception(f"Unexpected error while listing security groups: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while listing security groups.")

@app.post("/filter")
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

@app.post("/export/csv")
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