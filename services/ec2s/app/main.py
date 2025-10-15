# app/main.py
from fastapi import FastAPI, Query, Body
from pydantic import BaseModel
from typing import List, Optional
import boto3
from fastapi.middleware.cors import CORSMiddleware

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

class Volume(BaseModel):
    volume_id: str
    size_gb: Optional[int]
    type: Optional[str]
    kms_key_id: Optional[str]

class EC2InstanceModel(BaseModel):
    instance_id: str
    name: Optional[str] = None
    instance_type: str
    os: Optional[str] = None
    state: str
    vpc_id: Optional[str] = None
    az: str
    subnet_id: Optional[str] = None
    private_ip: Optional[str] = None
    public_ip: Optional[str] = None
    security_groups: List[SecurityGroupModel]
    key_pair: Optional[str] = None
    ami_id: Optional[str] = None
    kms_key_id: Optional[str] = None
    root_volume_id: Optional[str] = None
    root_volume_type: Optional[str] = None
    root_volume_size: Optional[int] = None
    data_volumes: List[Volume] = []
    

class ExportRequest(BaseModel):
    region: str = "ap-northeast-2"
    account: Optional[str] = None

# ---------- Endpoints ----------
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ec2-listing"}

@app.get("/", response_model=List[EC2InstanceModel])
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

            # Volumes

            root_volume = {}
            data_volumes = []
            try:
                for bd in inst.get("BlockDeviceMappings", []):
                    vol_id = bd.get("Ebs", {}).get("VolumeId")
                    if not vol_id:
                        continue
                    vol_resp = ec2.describe_volumes(VolumeIds=[vol_id])
                    vol = vol_resp["Volumes"][0]
                    vol_info = {
                        "volume_id": vol_id,
                        "size_gb": vol.get("Size"),
                        "type": vol.get("VolumeType"),
                        "kms_key_id": vol.get("KmsKeyId"),
                    }

                    if bd.get("DeviceName") == inst.get("RootDeviceName"):
                        root_volume = vol_info
                    else:
                        data_volumes.append(vol_info)
            except Exception:
                pass

            os_info = inst.get("PlatformDetails")

            instances.append({
                "instance_id": inst.get("InstanceId"),
                "name": name_tag,
                "instance_type": inst.get("InstanceType"),
                "os": os_info,
                "state": inst.get("State", {}).get("Name"),
                "vpc_id": inst.get("VpcId"),
                "az": inst.get("Placement", {}).get("AvailabilityZone"),
                "subnet_id": inst.get("SubnetId"),
                "private_ip": inst.get("PrivateIpAddress"),
                "public_ip": inst.get("PublicIpAddress"),
                "security_groups": sgs,
                "key_pair": inst.get("KeyName"),
                "ami_id": inst.get("ImageId"),
                "kms_key_id": inst.get("KmsKeyId"),
                "root_volume_id": root_volume.get("volume_id"),
                "root_volume_type": root_volume.get("type"),
                "root_volume_size": root_volume.get("size_gb"),
                "data_volumes": data_volumes             
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
