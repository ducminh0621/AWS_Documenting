# app/main.py
from fastapi import FastAPI, Query, Body
from pydantic import BaseModel
from typing import List, Optional
import boto3
import io
import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import csv

app = FastAPI(
    title="AWS EC2 Documentation Service",
    version="1.0.0"
)

# ---------- Middleware ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- In-memory cache ----------
last_instances = []

# ---------- Models ----------
class SecurityGroupModel(BaseModel):
    group_id: str
    group_name: str

class EC2InstanceModel(BaseModel):
    instance_id: str
    name: Optional[str] = None
    type: str
    state: str
    private_ip: Optional[str] = None
    public_ip: Optional[str] = None
    az: str
    launch_time: Optional[str] = None
    security_groups: List[SecurityGroupModel]

class ExportRequest(BaseModel):
    region: str = "ap-northeast-2"
    account: Optional[str] = None

# ---------- Endpoints ----------
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ec2-listing"}

@app.get("/instances", response_model=List[EC2InstanceModel])
def list_instances(region: str = Query("ap-northeast-2")):
    ec2 = boto3.client("ec2", region_name=region)
    resp = ec2.describe_instances()

    instances = []
    for reservation in resp.get("Reservations", []):
        for inst in reservation.get("Instances", []):
            # Name tag
            name_tag = None
            for t in inst.get("Tags", []):
                if t["Key"] == "Name":
                    name_tag = t["Value"]
                    break

            # Security groups
            sgs = [
                {
                    "group_id": sg.get("GroupId"),
                    "group_name": sg.get("GroupName")
                }
                for sg in inst.get("SecurityGroups", [])
            ]

            instances.append({
                "instance_id": inst.get("InstanceId"),
                "name": name_tag,
                "type": inst.get("InstanceType"),
                "state": inst.get("State", {}).get("Name"),
                "private_ip": inst.get("PrivateIpAddress"),
                "public_ip": inst.get("PublicIpAddress"),
                "az": inst.get("Placement", {}).get("AvailabilityZone"),
                "launch_time": inst.get("LaunchTime").isoformat() if inst.get("LaunchTime") else None,
                "security_groups": sgs
            })

    global last_instances
    last_instances = instances
    return instances

# @app.post("/instances/export/csv")
# def export_instances_csv(req: ExportRequest = Body(...)):
#     region = req.region
#     ec2 = boto3.client("ec2", region_name=region)
#     resp = ec2.describe_instances()

#     output = io.StringIO()
#     writer = csv.writer(output)
#     writer.writerow([
#         "instance_id", "name", "type", "state", "private_ip", "public_ip", "az", "launch_time", "security_groups"
#     ])

#     for reservation in resp.get("Reservations", []):
#         for inst in reservation.get("Instances", []):
#             name_tag = None
#             for t in inst.get("Tags", []):
#                 if t["Key"] == "Name":
#                     name_tag = t["Value"]
#                     break

#             sgs = ", ".join([sg["GroupName"] for sg in inst.get("SecurityGroups", [])])

#             writer.writerow([
#                 inst.get("InstanceId"),
#                 name_tag or "",
#                 inst.get("InstanceType"),
#                 inst.get("State", {}).get("Name"),
#                 inst.get("PrivateIpAddress", ""),
#                 inst.get("PublicIpAddress", ""),
#                 inst.get("Placement", {}).get("AvailabilityZone"),
#                 inst.get("LaunchTime").isoformat() if inst.get("LaunchTime") else "",
#                 sgs
#             ])

#     output.seek(0)
#     filename = f"ec2_instances_{region}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
#     return StreamingResponse(
#         output,
#         media_type="text/csv",
#         headers={"Content-Disposition": f"attachment; filename={filename}"}
#     )
