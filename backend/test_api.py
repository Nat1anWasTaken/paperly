#!/usr/bin/env python3
"""
Test script to verify the paperly API workflow.

This script tests the complete workflow:
1. Get a pre-signed upload URL from GET /papers/upload_url
2. Upload a PDF file to the presigned URL
3. Create an analysis task at POST /analyses/
4. Poll the analysis status every 5 seconds until status becomes "markdown_extracted"
"""

import time
import requests
import sys
from pathlib import Path
from typing import Dict, Any


BASE_URL = "http://localhost:8000"
PDF_FILE = "attention_is_all_you_need.pdf"


def get_presigned_upload_url() -> Dict[str, Any]:
    """
    Get a pre-signed upload URL from the API.
    
    :return: Response containing paper_id, upload_url, and key
    :rtype: Dict[str, Any]
    """
    print("Step 1: Getting presigned upload URL...")
    
    response = requests.get(f"{BASE_URL}/papers/upload_url")
    response.raise_for_status()
    
    data = response.json()
    print(f"✓ Upload key: {data['key']}")
    
    return data


def upload_pdf_to_presigned_url(upload_url: str, file_path: str) -> None:
    """
    Upload the PDF file to the presigned URL.
    
    :param upload_url: Pre-signed S3 URL for upload
    :param file_path: Path to the PDF file to upload
    """
    print("\nStep 2: Uploading PDF to presigned URL...")
    
    if not Path(file_path).exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")
    
    with open(file_path, "rb") as file:
        headers = {"Content-Type": "application/pdf"}
        response = requests.put(upload_url, data=file, headers=headers)
        response.raise_for_status()
    
    print(f"✓ Successfully uploaded {file_path}")


def create_analysis_task(file_key: str) -> str:
    """
    Create an analysis task for the uploaded file.
    
    :param file_key: S3 key of the uploaded file
    :return: Analysis ID
    :rtype: str
    """
    print("\nStep 3: Creating analysis task...")
    
    payload = {"file_key": file_key}
    response = requests.post(f"{BASE_URL}/analyses/", json=payload)
    response.raise_for_status()
    
    data = response.json()
    analysis_id = data["analysis_id"]
    print(f"✓ Created analysis task with ID: {analysis_id}")
    print(f"✓ Initial status: {data['status']}")
    
    return analysis_id


def poll_analysis_status(analysis_id: str) -> None:
    """
    Poll the analysis status every 5 seconds until it reaches "markdown_extracted".
    
    :param analysis_id: ID of the analysis task to monitor
    """
    print("\nStep 4: Polling analysis status...")
    
    target_status = "markdown_extracted"
    poll_interval = 5  # seconds
    
    while True:
        response = requests.get(f"{BASE_URL}/analyses/{analysis_id}")
        response.raise_for_status()
        
        data = response.json()
        status = data["status"]
        
        print(f"Current status: {status}")
        
        if status == target_status:
            print(f"✓ Analysis reached target status: {target_status}")
            break
        elif status == "errored":
            print(f"✗ Analysis failed with error status")
            break
        
        print(f"Waiting {poll_interval} seconds before next check...")
        time.sleep(poll_interval)


def main():
    """
    Main function to run the complete API test workflow.
    """
    try:
        # Step 1: Get presigned upload URL
        upload_data = get_presigned_upload_url()
        upload_url = upload_data["upload_url"]
        file_key = upload_data["key"]
        
        # Step 2: Upload PDF file
        upload_pdf_to_presigned_url(upload_url, PDF_FILE)
        
        # Step 3: Create analysis task
        analysis_id = create_analysis_task(file_key)
        
        # Step 4: Poll analysis status
        poll_analysis_status(analysis_id)
        
        print("\n🎉 API test workflow completed successfully!")
        
    except FileNotFoundError as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"✗ API request failed: {e}")
        sys.exit(1)
    except KeyError as e:
        print(f"✗ Unexpected API response format - missing key: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()