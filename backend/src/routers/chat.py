import os
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.models.paper import Paper
from src.models.translation import LanguageCode
from src.openai import client, model
from src.routers.summaries import format_block_content
from src.utils.blocks import get_blocks_in_order
from src.utils.object_id import validate_object_id_or_raise_http_exception

router = APIRouter(prefix="/chat")


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    language: Optional[LanguageCode] = "en"


async def generate_chat_stream(paper_content: str, message: str, history: List[ChatMessage],
                               language: LanguageCode = "en"):
    """
    Generate a streaming chat response using OpenAI client with paper context.

    :param paper_content: The formatted content of all paper blocks.
    :param message: The user's current message.
    :param history: Previous conversation history.
    :param language: The language code for the chat response (e.g., 'zh_traditional', 'en').
    :yields: Streaming response chunks in Server-Sent Events format.
    """
    # Read the prompt template
    current_dir = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    prompt_path = os.path.join(current_dir, "prompts", "chat_with_paper.txt")

    try:
        with open(prompt_path, "r") as f:
            prompt_template = f.read()
    except FileNotFoundError:
        yield "event: error\ndata: Chat prompt template not found\n\n"
        return

    # Format the system prompt with paper content
    try:
        system_prompt = prompt_template.format(paper_content=paper_content, language=language)
    except KeyError as e:
        yield f"event: error\ndata: Template formatting error - missing parameter: {e}\n\n"
        return

    # Build conversation messages
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    # Add current user message
    messages.append({"role": "user", "content": message})

    # Send initial event to indicate streaming has started
    yield "event: start\ndata: Starting chat response...\n\n"

    try:
        # Create streaming response from OpenAI
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            temperature=0.7,
            max_tokens=2000,
        )

        for chunk in response:
            if chunk.choices and len(chunk.choices) > 0:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    # Escape newlines in content for SSE format
                    escaped_content = content.replace("\n", "\\n").replace("\r", "\\r")
                    yield f"event: chunk\ndata: {escaped_content}\n\n"

        # Send completion event
        yield "event: complete\ndata: Chat response completed\n\n"

    except Exception as e:
        # Send error event
        yield f"event: error\ndata: Error generating chat response: {str(e)}\n\n"


@router.post("/{paper_id}")
async def chat_with_paper(paper_id: str, request: ChatRequest):
    """
    Chat with a paper using its content as context.

    Takes a paper ID, user message, and conversation history, then generates
    a streaming AI response using the paper's content as context.

    :param paper_id: The ID of the paper to chat about.
    :param request: Request containing the user message and conversation history.
    :return: StreamingResponse with the generated chat response.
    :raises HTTPException: If paper is not found or an error occurs during processing.
    """
    paper_object_id = validate_object_id_or_raise_http_exception(paper_id)

    try:
        # Fetch the paper
        paper = await Paper.get(paper_object_id)
        if not paper:
            raise HTTPException(
                status_code=404, detail="Paper not found"
            )

        # Get all blocks for the paper in order
        blocks = await get_blocks_in_order(paper_object_id)

        if not blocks:
            raise HTTPException(
                status_code=404, detail="No blocks found for this paper"
            )

        # Format all blocks content for the prompt
        formatted_blocks = []
        for block in blocks:
            formatted_content = format_block_content(block)
            formatted_blocks.append(formatted_content)

        paper_content = "\n\n---\n\n".join(formatted_blocks)

        # Return streaming response
        return StreamingResponse(
            generate_chat_stream(paper_content, request.message, request.history, request.language or "en"),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating chat response: {str(e)}"
        )
