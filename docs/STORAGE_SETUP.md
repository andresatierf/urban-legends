# Storage Setup Guide

This document explains how to configure S3 storage for submission image uploads.

## Overview

The application uses a storage abstraction layer that supports multiple providers:
- **AWS S3** (default, production-ready)
- **Cloudflare R2** (S3-compatible, cost-effective alternative)
- **Vercel Blob** (future support planned)

## Quick Start (AWS S3)

### 1. Create an S3 Bucket

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Configure:
   - **Bucket name**: `urban-legends-submissions` (or your preferred name)
   - **Region**: `us-east-1` (or your preferred region)
   - **Block all public access**: ✅ Enabled (bucket should be private)
4. Click "Create bucket"

### 2. Configure CORS

S3 needs CORS configuration to allow browser uploads:

1. Open your bucket
2. Go to "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Important**: Replace `https://yourdomain.com` with your actual production domain.

### 3. Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. User name: `convex-backend` (or your preferred name)
4. Click "Next"
5. Select "Attach policies directly"
6. Click "Create policy" → JSON tab:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::urban-legends-submissions/*"
    }
  ]
}
```

7. Name the policy: `S3SubmissionImagesAccess`
8. Attach the policy to your user
9. Go to "Security credentials" tab
10. Click "Create access key" → "Application running outside AWS"
11. Save the **Access key ID** and **Secret access key**

### 4. Configure Environment Variables

Add to your `.env.local`:

```bash
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=urban-legends-submissions
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### 5. Test the Setup

1. Start your dev servers:
   ```bash
   bun run dev
   bunx convex dev
   ```

2. Create a submission and try uploading an image

3. Check CloudWatch logs if there are errors

## Alternative: Cloudflare R2 Setup

R2 is S3-compatible and more cost-effective (~10x cheaper):

### 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2
3. Click "Create bucket"
4. Name: `urban-legends-submissions`

### 2. Create API Token

1. Go to R2 → "Manage R2 API Tokens"
2. Click "Create API token"
3. Permissions: "Read & Write"
4. Buckets: Select your bucket
5. Save the **Access Key ID** and **Secret Access Key**
6. Note your **Account ID** from the R2 overview page

### 3. Configure CORS

1. Open your bucket
2. Go to "Settings" tab
3. Add CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 4. Configure Environment Variables

Add to your `.env.local`:

```bash
STORAGE_PROVIDER=r2
R2_BUCKET=urban-legends-submissions
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
```

The endpoint is auto-generated: `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`

## File Specifications

**Allowed formats:**
- JPEG (image/jpeg)
- PNG (image/png)
- WebP (image/webp)
- HEIC (image/heic)

**Size limits:**
- Per image: 10MB maximum
- Per submission: 25MB total (3 × 10MB conservative)

**Count limits:**
- Minimum: 1 image required before submission moves to "pending"
- Maximum: 3 images per submission

## Security Notes

- **Bucket is private**: No public access allowed
- **Presigned URLs**: Expire after 15 minutes
- **Signed URLs**: Generated on-demand for viewing (1 hour expiry)
- **Authentication**: All uploads require valid Convex session
- **Permission checks**: Only submission owner, team members, and admins can access images

## Cost Estimation

### AWS S3
- Storage: $0.023 per GB/month
- Requests: $0.005 per 1,000 PUT requests
- Data transfer: $0.09 per GB (first 10TB)

**Example**: 1,000 active users × 3 images × 5MB = 15GB
- Storage: $0.35/month
- Uploads: $0.015/month (3,000 images)
- **Total: ~$0.40/month** (excluding data transfer)

### Cloudflare R2
- Storage: $0.015 per GB/month
- Requests: $0.00036 per 1,000 PUT requests
- Data transfer: **FREE egress**

**Example**: Same 15GB
- Storage: $0.23/month
- Uploads: $0.001/month
- **Total: ~$0.25/month** (10x cheaper!)

## Troubleshooting

### "S3 configuration validation failed"

- Check AWS credentials are correct
- Verify IAM user has S3 permissions
- Ensure bucket exists in specified region

### "Upload failed: 403 Forbidden"

- Check CORS configuration includes your domain
- Verify presigned URL hasn't expired (15 min limit)
- Ensure bucket is in correct region

### "Failed to fetch images"

- Check Convex action logs for errors
- Verify AWS credentials have GetObject permission
- Check browser console for CORS errors

### Images not displaying

- Verify signed URL expiry (1 hour default)
- Check CloudFront/CDN caching if using one
- Ensure GetObject permissions are granted

## Migration Path

To switch providers (e.g., S3 → R2):

1. **Don't delete old storage**: Keep S3 bucket for existing images
2. **Update env vars**: Change `STORAGE_PROVIDER=r2` and add R2 credentials
3. **New uploads go to R2**: Existing images stay in S3
4. **Optional migration**: Use a script to copy old images to R2

The storage abstraction handles both providers seamlessly.

## Advanced Configuration

### Custom S3 Endpoint

For S3-compatible services (MinIO, DigitalOcean Spaces):

```bash
STORAGE_PROVIDER=s3
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### CDN Integration

To use CloudFront in front of S3:

1. Create CloudFront distribution pointing to S3 bucket
2. Update `S3StorageProvider.getPublicUrl()` to return CloudFront URL
3. Configure CloudFront behaviors for signed URLs

## Support

For issues or questions:
- Check [Convex Actions docs](https://docs.convex.dev/functions/actions)
- See [AWS S3 docs](https://docs.aws.amazon.com/s3/)
- Review [Cloudflare R2 docs](https://developers.cloudflare.com/r2/)
