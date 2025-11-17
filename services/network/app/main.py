from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import List, Optional
import boto3
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AWS Network Documentation Service",
    version="1.0.0"
)

# Add CORS Middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models for Network Info ----------

class TagModel(BaseModel):
    Key: str
    Value: str

class VPCModel(BaseModel):
    vpc: str
    name: str
    vpc_id: str
    cidr_block: str
    tags: Optional[List[TagModel]] = None


class SubnetModel(BaseModel):
    subnet_name: str
    subnet_id: str
    cidr_block: str
    vpc_id: str
    availability_zone: str
    route_table: Optional[str] = None
    available_ips: Optional[int] = None
    tags: Optional[List[TagModel]] = None

class NATGatewayModel(BaseModel):
    nat_name: Optional[str] = None
    nat_gateway_id: str
    nat_arn: Optional[str] = None
    vpc_id: str
    type: Optional[str] = None
    elastic_ip: str
    subnet_id: str
    private_ip: Optional[str] = None
    network_interface_id: Optional[str] = None
    tags: Optional[List[TagModel]] = None
    

class NetworkDocumentationModel(BaseModel):

    vpcs: List[VPCModel]
    subnets: List[SubnetModel]
    nat_gateways: List[NATGatewayModel]

# ---------- VPC, Subnet, and NAT Gateways Documentation ----------
@app.get("/", response_model=NetworkDocumentationModel)
def list_network_info(region: str = Query("ap-northeast-2")):
    ec2 = boto3.client("ec2", region_name=region)
    
    # Fetch VPCs
    vpc_response = ec2.describe_vpcs()
    vpcs = [
        VPCModel(
            vpc=next((tag["Value"] for tag in vpc.get("Tags", []) if tag["Key"] == "Name"), "N/A"),
            name=next((tag["Value"] for tag in vpc.get("Tags", []) if tag["Key"] == "Name"), "N/A"),
            vpc_id=vpc["VpcId"],
            cidr_block=vpc["CidrBlock"],
            tags=[TagModel(**tag) for tag in vpc.get("Tags", [])]
        ) for vpc in vpc_response.get("Vpcs", [])
    ]

    # Fetch Subnets
    subnet_response = ec2.describe_subnets()
    subnets = [
        SubnetModel(
            subnet_name=next((tag["Value"] for tag in subnet.get("Tags", []) if tag["Key"] == "Name"), "N/A"),
            subnet_id=subnet["SubnetId"],
            cidr_block=subnet["CidrBlock"],
            vpc_id=subnet["VpcId"],
            availability_zone=subnet["AvailabilityZone"],
            route_table=None,  # Placeholder, requires additional API calls to fetch route table
            available_ips=subnet.get("AvailableIpAddressCount", 0),
            tags=[TagModel(**tag) for tag in subnet.get("Tags", [])]
        ) for subnet in subnet_response.get("Subnets", [])
    ]

    # Fetch NAT Gateways
    nat_response = ec2.describe_nat_gateways()
    nat_gateways = [
        NATGatewayModel(
            nat_name=next((tag["Value"] for tag in nat.get("Tags", []) if tag["Key"] == "Name"), "N/A"),
            nat_gateway_id=nat["NatGatewayId"],
            nat_arn=nat.get("NatGatewayArn"),
            vpc_id=nat["VpcId"],
            type=nat.get("Type"),
            elastic_ip=nat["NatGatewayAddresses"][0].get("PublicIp", "N/A"),
            subnet_id=nat["SubnetId"],
            private_ip=nat["NatGatewayAddresses"][0].get("PrivateIp", "N/A"),
            network_interface_id=nat["NatGatewayAddresses"][0].get("NetworkInterfaceId", "N/A"),
            tags=[TagModel(**tag) for tag in nat.get("Tags", [])]
            
        ) for nat in nat_response.get("NatGateways", [])
    ]

    return NetworkDocumentationModel(
        vpcs=vpcs,
        subnets=subnets,
        nat_gateways=nat_gateways
    )
