# Google Cloud CLI Quick Reference (gcloud + gsutil)

## Prerequisites
- Install: google-cloud-cli, google-cloud-sdk, and gsutil
- Ensure you have access to project `mod-shop-472410`

## Verify Installation
```bash
gcloud --version
gsutil version -l
```

## Authenticate (User Account)
```bash
gcloud auth login
```
- Follow the browser flow and choose the account with access to `mod-shop-472410`.

## Set Active Project
```bash
gcloud config set project mod-shop-472410
gcloud config list
```

## Verify Bucket Access
```bash
gsutil ls -b gs://mod-shop-library
```

## Apply GCS CORS
Assumes `cors.json` exists at repo root (e.g., `mod-shop-admin/cors.json`).
```bash
cd /home/jarhead/Documents/coDocs/mod-shop-mocha/mod-shop-admin
# View the file
cat cors.json
# Apply to bucket
gsutil cors set cors.json gs://mod-shop-library
# Verify applied
gsutil cors get gs://mod-shop-library
```

Example `cors.json` (edit origins to match your domains):
```json
[
  {
    "origin": [
      "https://mod-shop-admin.vercel.app",
      "http://localhost:4000",
      "http://localhost:3000"
    ],
    "method": ["PUT", "GET", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  }
]
```

## Alternative: Authenticate with Service Account
If your user account lacks permissions, use a service account key with Storage Admin:
```bash
# Activate service account (replace with your key path)
gcloud auth activate-service-account \
  mod-shop-file-management@mod-shop-472410.iam.gserviceaccount.com \
  --key-file=/path/to/key.json

# Ensure project is set
gcloud config set project mod-shop-472410

# Verify and apply CORS again
gsutil ls -b gs://mod-shop-library
gsutil cors set cors.json gs://mod-shop-library
gsutil cors get gs://mod-shop-library
```

## Useful Diagnostics
```bash
# Show current auth identity
gcloud auth list

# Show current configuration
gcloud config list --all

# List buckets in project
gsutil ls

# Get bucket metadata (including CORS)
gsutil ls -L -b gs://mod-shop-library
```

## Notes
- On Vercel Production, set `STORAGE_PROXY_UPLOADS=false` to use direct-to-GCS uploads and avoid 413 limits.
- Ensure GCS CORS origins exactly match your admin origins (scheme + host + port).
- After updating CORS, allow 1–2 minutes for propagation before testing uploads.
