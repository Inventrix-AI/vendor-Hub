import os
import boto3
import aiofiles
from fastapi import UploadFile
from typing import Optional
from dotenv import load_dotenv
import uuid

load_dotenv()

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("S3_BUCKET")

# Local storage configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

async def upload_file(file: UploadFile, folder: str = "documents") -> str:
    """
    Upload file to configured storage (S3 or local)
    Returns the file path/URL
    """
    file_extension = file.filename.split(".")[-1] if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    if S3_BUCKET and AWS_ACCESS_KEY_ID:
        # Upload to S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        s3_key = f"{folder}/{unique_filename}"
        
        try:
            content = await file.read()
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=content,
                ContentType=file.content_type
            )
            return f"s3://{S3_BUCKET}/{s3_key}"
        except Exception as e:
            raise Exception(f"Failed to upload to S3: {str(e)}")
    
    else:
        # Upload to local storage
        os.makedirs(f"{UPLOAD_DIR}/{folder}", exist_ok=True)
        file_path = f"{UPLOAD_DIR}/{folder}/{unique_filename}"
        
        try:
            content = await file.read()
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            return file_path
        except Exception as e:
            raise Exception(f"Failed to upload file locally: {str(e)}")

def get_file_url(file_path: str) -> str:
    """
    Generate public URL for file access
    """
    if file_path.startswith("s3://"):
        # Generate S3 presigned URL
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        bucket, key = file_path.replace("s3://", "").split("/", 1)
        
        try:
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': key},
                ExpiresIn=3600  # URL expires in 1 hour
            )
            return url
        except Exception as e:
            raise Exception(f"Failed to generate S3 URL: {str(e)}")
    
    else:
        # Return local file path (in production, this should be served by nginx or similar)
        return f"/uploads/{file_path.replace(UPLOAD_DIR + '/', '')}"