from beanie import PydanticObjectId
from fastapi import HTTPException


def validate_object_id(object_id: str) -> PydanticObjectId:
    """
    Validate and convert a string to a PydanticObjectId.

    :param object_id: The string representation of the object ID.
    :return: A PydanticObjectId if valid, otherwise raises ValueError.
    :raises ValueError: If the provided string is not a valid ObjectId.
    """
    try:
        return PydanticObjectId(object_id)
    except ValueError as e:
        raise ValueError(f"Invalid ObjectId: {object_id}") from e


def validate_object_id_or_raise_http_exception(object_id: str) -> PydanticObjectId:
    """
    Validate a string as a PydanticObjectId and raise HTTPException if invalid.

    :param object_id: The string representation of the object ID.
    :return: A PydanticObjectId if valid.
    :raises HTTPException: If the provided string is not a valid ObjectId.
    """
    try:
        return validate_object_id(object_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
