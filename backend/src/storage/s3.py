import boto3
from types_boto3_s3 import Client

from src.config import settings


class S3Storage:
    def __init__(self):
        """
        Initialize S3 storage client with configuration from settings.
        
        :raises ValueError: If required S3 bucket name is not configured.
        """
        self.bucket_name = settings.s3.bucket_name
        self.region = settings.s3.region

        if not self.bucket_name:
            raise ValueError("AWS_S3_BUCKET_NAME environment variable is required")

        client_kwargs = {
            'region_name': self.region,
            'aws_access_key_id': settings.s3.access_key_id,
            'aws_secret_access_key': settings.s3.secret_access_key,
        }

        if settings.s3.endpoint_url:
            client_kwargs['endpoint_url'] = settings.s3.endpoint_url

        self.client = boto3.client('s3', **client_kwargs)

    def get_client(self) -> boto3.client:
        """
        Get the S3 client instance.

        :return: The S3 client instance.
        :rtype: boto3.client
        """
        return self.client


s3_storage = S3Storage()
storage_client: Client = s3_storage.get_client()
bucket_name = s3_storage.bucket_name
