from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import boto3

app = FastAPI(
    title="AWS S3 Documentation Service",
    version="2.0.0"
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
last_buckets = []

# ---------- Models ----------
class TagModel(BaseModel):
    Key: str
    Value: str


class S3BucketModel(BaseModel):
    name: str
    region: Optional[str] = None
    static_website: Optional[bool] = None
    versioning_enabled: Optional[bool] = None
    mfa_delete: Optional[bool] = None
    lifecycle_rules: Optional[int] = None
    replication_enabled: Optional[bool] = None
    copy_settings_enabled: Optional[bool] = None
    encrypted: Optional[bool] = None
    kms_key_id: Optional[str] = None
    block_public_access: Optional[bool] = None
    tags: Optional[List[TagModel]] = []


# ---------- Health Check ----------
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "s3"}


# ---------- Main Endpoint ----------
@app.get("/", response_model=List[S3BucketModel])
def list_buckets(region: str = Query("ap-northeast-2")):
    global last_buckets
    s3 = boto3.client("s3", region_name=region)

    try:
        resp = s3.list_buckets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list buckets: {e}")

    buckets = resp.get("Buckets", [])
    bucket_details = []

    for bucket in buckets:
        bucket_name = bucket["Name"]
        print(f"Fetching info for bucket: {bucket_name}")
        bucket_info = {"name": bucket_name}

        # --- 1. Region ---
        try:
            loc = s3.get_bucket_location(Bucket=bucket_name)
            bucket_info["region"] = loc.get("LocationConstraint") or "us-east-1"
        except Exception:
            bucket_info["region"] = "Unknown"

        # --- 2. Static Website Hosting ---
        try:
            s3.get_bucket_website(Bucket=bucket_name)
            bucket_info["static_website"] = True
        except Exception:
            bucket_info["static_website"] = False

        # --- 3. Versioning + MFA Delete ---
        try:
            v = s3.get_bucket_versioning(Bucket=bucket_name)
            bucket_info["versioning_enabled"] = v.get("Status") == "Enabled"
            bucket_info["mfa_delete"] = v.get("MFADelete") == "Enabled"
        except Exception:
            bucket_info["versioning_enabled"] = False
            bucket_info["mfa_delete"] = False

        # --- 4. Lifecycle Rules ---
        try:
            lc = s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            bucket_info["lifecycle_rules"] = len(lc.get("Rules", []))
        except Exception:
            bucket_info["lifecycle_rules"] = 0

        # --- 5. Replication ---
        try:
            rep = s3.get_bucket_replication(Bucket=bucket_name)
            bucket_info["replication_enabled"] = "ReplicationConfiguration" in rep
        except Exception:
            bucket_info["replication_enabled"] = False

        # --- 6. Copy settings (replication exists) ---
        bucket_info["copy_settings_enabled"] = bucket_info["replication_enabled"]

        # --- 7. Encryption (KMS Key) ---
        try:
            enc = s3.get_bucket_encryption(Bucket=bucket_name)
            rules = enc["ServerSideEncryptionConfiguration"]["Rules"]
            if rules:
                algo = rules[0]["ApplyServerSideEncryptionByDefault"]
                bucket_info["encrypted"] = True
                bucket_info["kms_key_id"] = algo.get("KMSMasterKeyID")
        except Exception:
            bucket_info["encrypted"] = False
            bucket_info["kms_key_id"] = None

        # --- 8. Block Public Access ---
        try:
            bpa = s3.get_public_access_block(Bucket=bucket_name)
            conf = bpa.get("PublicAccessBlockConfiguration", {})
            bucket_info["block_public_access"] = all(conf.values())
        except Exception:
            bucket_info["block_public_access"] = False
        # --- 9. Tags ---
        try:
            tag_response = s3.get_bucket_tagging(Bucket=bucket_name)
            tags = tag_response.get("TagSet", [])
            bucket_info["tags"] = [{"key": tag["Key"], "value": tag["Value"]} for tag in tags]
        except Exception:
            bucket_info["tags"] = []  # If no tags are found


        # Append model
        bucket_details.append(S3BucketModel(**bucket_info))

    last_buckets = bucket_details
    return bucket_details
