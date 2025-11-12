// src/mockData.js
export const mockS3BucketsData = [
  {
    name: "bucket1",
    region: "us-east-1",
    static_website: true,
    versioning_enabled: true,
    mfa_delete: false,
    lifecycle_rules: 3,
    replication_enabled: true,
    copy_settings_enabled: true,
    encrypted: true,
    kms_key_id: "kms-1234",
    block_public_access: true,
    tags: [
      { Key: "Environment", Value: "Production" },
      { Key: "Project", Value: "WebApp" }
    ]
  },
  {
    name: "bucket2",
    region: "us-west-2",
    static_website: false,
    versioning_enabled: false,
    mfa_delete: false,
    lifecycle_rules: 1,
    replication_enabled: false,
    copy_settings_enabled: false,
    encrypted: false,
    kms_key_id: null,
    block_public_access: false,
    tags: [
      { Key: "Environment", Value: "Development" },
      { Key: "Project", Value: "API" }
    ]
  },
  // Add more mock buckets as needed
];



