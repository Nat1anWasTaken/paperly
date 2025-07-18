## Python Best Practices
- When writing python functions, always write a reStructuredText-style docstring
```py
def get_presigned_upload_url(paper_id: str, content_type: str) -> str:
    """
    Obtain a pre-signed URL for uploading a paper file to the service's storage bucket.

    You must upload the file using this URL before creating or submitting the paper resource.

    :param paper_id: Unique identifier of the paper the file is associated with.
    :param content_type: MIME type of the file to be uploaded (e.g. 'application/pdf').
    :return: A time-limited pre-signed URL for direct file upload to the storage backend.
    :rtype: str
    """
    # implementation here
    ...
```