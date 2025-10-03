from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
import boto3
import uuid
import datetime

app = FastAPI(title="Auth Service", version="1.0.0")

# Allow frontend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store for MVP
# In prod → move to Redis or DynamoDB
session_store: Dict[str, dict] = {}

# ---------- Models ----------
class AssumeRoleRequest(BaseModel):
    role_arn: str
    region: str

class AssumeRoleResponse(BaseModel):
    session_id: str
    expiration: str

# ---------- Endpoints ----------
@app.post("/auth/assume-role", response_model=AssumeRoleResponse)
def assume_role(req: AssumeRoleRequest):
    try:
        sts = boto3.client("sts", region_name=req.region)
        resp = sts.assume_role(
            RoleArn=req.role_arn,
            RoleSessionName=f"aws-doc-app-{uuid.uuid4()}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to assume role: {e}")

    creds = resp["Credentials"]
    session_id = str(uuid.uuid4())
    session_store[session_id] = {
        "AccessKeyId": creds["AccessKeyId"],
        "SecretAccessKey": creds["SecretAccessKey"],
        "SessionToken": creds["SessionToken"],
        "Expiration": creds["Expiration"].isoformat(),
        "Region": req.region
    }

    return AssumeRoleResponse(
        session_id=session_id,
        expiration=creds["Expiration"].isoformat()
    )

@app.get("/auth/session/{session_id}")
def get_session(session_id: str):
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session