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

def upload_file(file_bytes: bytes, minio_key: str, content_type: str) -> bool:
    """Uploads a file to MinIO, returns True if successful"""
    try:
        client = get_minio_client()
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