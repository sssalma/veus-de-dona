import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.config import settings

# MinIO client using S3-compatible API
def get_minio_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.MINIO_URL,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1"
    )

_bucket_ready = False


def ensure_bucket(client) -> None:
    """MinIO starts with no buckets: create ours the first time we need it."""
    global _bucket_ready
    if _bucket_ready:
        return
    try:
        client.head_bucket(Bucket=settings.MINIO_BUCKET)
    except ClientError:
        client.create_bucket(Bucket=settings.MINIO_BUCKET)
    _bucket_ready = True


def upload_file(file_bytes: bytes, minio_key: str, content_type: str) -> bool:
    """Uploads a file to MinIO, returns True if successful"""
    try:
        client = get_minio_client()
        ensure_bucket(client)
        client.put_object(
            Bucket=settings.MINIO_BUCKET,
            Key=minio_key,
            Body=file_bytes,
            ContentType=content_type
        )
        return True
    except ClientError:
        return False

def delete_file(minio_key: str) -> bool:
    """Deletes a file from MinIO, returns True if successful"""
    try:
        client = get_minio_client()
        client.delete_object(
            Bucket=settings.MINIO_BUCKET,
            Key=minio_key
        )
        return True
    except ClientError:
        return False

def get_file_url(minio_key: str, expires_in: int = 3600) -> str | None:
    """Generates a presigned URL for streaming, valid for 1 hour by default"""
    try:
        client = get_minio_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.MINIO_BUCKET,
                "Key": minio_key
            },
            ExpiresIn=expires_in
        )
        return url
    except ClientError:
        return None