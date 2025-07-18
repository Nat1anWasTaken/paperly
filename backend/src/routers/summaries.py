from typing import List, Optional

from beanie import PydanticObjectId
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from src.models.block import Block
from src.openai import client, model
from src.utils.object_id import validate_object_id_or_raise_http_exception

router = APIRouter(prefix="/summaries")


class SummaryRequest(BaseModel):
    block_ids: List[str]
    language: Optional[str] = "en_US"  # Default to English (US)


async def generate_summary_stream(blocks_content: str, language: str = "en_US"):
    """
    Generate a streaming summary using OpenAI client with proper SSE format.

    :param blocks_content: The formatted content of all blocks to summarize.
    :param language: The ISO language code for the summary (e.g., 'zh_TW', 'en_US').
    :yields: Streaming response chunks in Server-Sent Events format.
    """

    # Read the prompt template
    import os

    current_dir = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    prompt_path = os.path.join(current_dir, "prompts", "generate_summary_for_block.txt")
    with open(prompt_path, "r") as f:
        prompt_template = f.read()

    # Format the prompt with the blocks content and language
    try:
        prompt = prompt_template.format(
            blocks_content=blocks_content, language=language
        )
    except KeyError as e:
        yield f"event: error\ndata: Template formatting error - missing parameter: {e}\n\n"
        yield f"event: error\ndata: Available parameters: blocks_content={len(blocks_content)} chars, language={language}\n\n"
        return

    # Send initial event to indicate streaming has started
    yield "event: start\ndata: Starting summary generation...\n\n"

    try:
        # Create streaming response from OpenAI
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            temperature=0.7,
            max_tokens=1000,
        )

        for chunk in response:
            if chunk.choices and len(chunk.choices) > 0:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    # Escape newlines in content for SSE format
                    escaped_content = content.replace("\n", "\\n").replace("\r", "\\r")
                    yield f"event: chunk\ndata: {escaped_content}\n\n"

        # Send completion event
        yield "event: complete\ndata: Summary generation completed\n\n"

    except Exception as e:
        # Send error event
        yield f"event: error\ndata: Error generating summary: {str(e)}\n\n"


def format_block_content(block: Block) -> str:
    """
    Format a block's content for inclusion in the summary prompt.

    :param block: The block to format.
    :return: Formatted string representation of the block.
    :rtype: str
    """
    if hasattr(block, "text"):
        if hasattr(block, "level"):  # Header
            return f"## {block.text}"
        elif hasattr(block, "title") and block.title:  # Paragraph with title
            return f"**{block.title}**\n{block.text}"
        else:  # Paragraph, Quote, Callout
            return block.text
    elif hasattr(block, "code"):  # CodeBlock
        lang = f" ({block.language})" if block.language else ""
        return f"```{lang}\n{block.code}\n```"
    elif hasattr(block, "equation"):  # Equation
        caption = f"Caption: {block.caption}\n" if block.caption else ""
        return f"{caption}Equation: {block.equation}"
    elif hasattr(block, "image_url"):  # Figure
        caption = f"Caption: {block.caption}\n" if block.caption else ""
        fig_num = f"Figure {block.figure_number}: " if block.figure_number else ""
        return f"{caption}{fig_num}[Image: {block.image_url}]"
    elif hasattr(block, "columns"):  # Table
        caption = f"Caption: {block.caption}\n" if block.caption else ""
        title = f"Title: {block.title}\n" if block.title else ""
        table_content = f"Columns: {', '.join(block.columns)}\n"
        table_content += "Data:\n" + "\n".join([", ".join(row) for row in block.rows])
        return f"{caption}{title}{table_content}"
    elif hasattr(block, "question"):  # Quiz
        options = "\n".join([f"- {opt}" for opt in block.options])
        explanation = f"\nExplanation: {block.explanation}" if block.explanation else ""
        return f"Question: {block.question}\nOptions:\n{options}\nCorrect Answer: {block.correct_answer}{explanation}"
    elif hasattr(block, "title") and hasattr(block, "authors"):  # Reference
        authors = ", ".join(block.authors)
        year = f" ({block.publication_year})" if block.publication_year else ""
        journal = f" {block.journal}" if block.journal else ""
        return f"Reference: {block.title} by {authors}{year}{journal}"
    elif hasattr(block, "reference_number"):  # Footnote
        return f"Footnote {block.reference_number}: {block.text}"
    else:
        return str(block)


@router.post("/")
async def create_summary(request: SummaryRequest):
    """
    Create a streaming summary for a list of block IDs.

    Takes a list of block IDs and generates a comprehensive summary of their content
    using AI. The response is streamed back to the client for real-time display.

    :param request: Request containing the list of block IDs to summarize and optional language.
    :return: StreamingResponse with the generated summary.
    :raises HTTPException: If blocks are not found or an error occurs during processing.
    """
    block_ids: List[PydanticObjectId] = []

    for block_id in request.block_ids:
        block_ids.append(validate_object_id_or_raise_http_exception(block_id))

    try:
        # Fetch all blocks from the database
        blocks = await Block.find({"_id": {"$in": block_ids}}).to_list()

        if not blocks:
            raise HTTPException(
                status_code=404, detail="No blocks found with the provided IDs"
            )

        # Format all blocks content for the prompt
        formatted_blocks = []
        for block in blocks:
            formatted_content = format_block_content(block)
            formatted_blocks.append(formatted_content)

        blocks_content = "\n\n---\n\n".join(formatted_blocks)

        # Return streaming response with language support
        return StreamingResponse(
            generate_summary_stream(blocks_content, request.language or "en_US"),
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
            status_code=500, detail=f"Error generating summary: {str(e)}"
        )
