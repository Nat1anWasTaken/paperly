import asyncio
import re

from beanie import WriteRules

from src.logging import get_logger
from src.models.analysis import Analysis, AnalysisStatus
from src.models.paper import Paper
from src.worker.base import BaseWorker

logger = get_logger(__name__)


def extract_first_biggest_heading(markdown_content: str) -> str:
    """
    Extract the first, biggest heading from markdown content.

    Prioritizes headings by size (# > ## > ### etc.) and returns the first one found
    at the highest level.
    
    :param markdown_content: The markdown content to parse.
    :return: The extracted heading text without the # symbols.
    :rtype: str
    """
    if not markdown_content:
        return "Untitled Paper"

    heading_pattern = r'^(#{1,6})\s+(.+)$'
    headings = []
    
    for line in markdown_content.split('\n'):
        match = re.match(heading_pattern, line.strip())
        if match:
            level = len(match.group(1))  # Number of # symbols
            text = match.group(2).strip()
            headings.append((level, text))
    
    if not headings:
        return "Untitled Paper"

    min_level = min(heading[0] for heading in headings)

    for level, text in headings:
        if level == min_level:
            return text
    
    return "Untitled Paper"


class MetadataGeneratorWorker(BaseWorker):
    """
    A worker class that processes markdown texts to generate metadata.
    """

    def __init__(self):
        super().__init__()

    def get_target_status(self) -> AnalysisStatus:
        """
        Get the status of analyses this worker should process.
        
        :return: AnalysisStatus.MARKDOWN_EXTRACTED
        :rtype: AnalysisStatus
        """
        return AnalysisStatus.MARKDOWN_EXTRACTED

    async def process_analysis(self, analysis: Analysis):
        """
        Process a single analysis by generating metadata from the markdown.
        
        :param analysis: The analysis to process.
        """
        logger.info(f"Starting metadata generation for analysis {analysis.id}")
        logger.debug(f"Processing markdown for analysis {analysis.id}")

        analysis.status = AnalysisStatus.GENERATING_METADATA
        await analysis.save(link_rule=WriteRules.WRITE)

        # Extract title from the first, biggest heading
        title = extract_first_biggest_heading(analysis.processed_markdown)
        logger.info(f"Extracted title: '{title}' for analysis {analysis.id}")

        # Create a Paper object for the uploaded paper
        paper = Paper(
            title=title
        )
        
        # Save the paper to the database
        await paper.insert()
        logger.info(f"Created paper {paper.id} with title '{title}'")

        # Update the analysis with the paper ID and status
        # noinspection PyTypeChecker
        analysis.paper = paper
        analysis.status = AnalysisStatus.METADATA_GENERATED
        await analysis.save(link_rule=WriteRules.WRITE)

        logger.info(
            f"Analysis {analysis.id} updated with paper_id {paper.id} and status changed to METADATA_GENERATED")
