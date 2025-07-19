#!/usr/bin/env python3
"""
Standalone PDF processing script for marker conversion.
This script runs in a separate process to avoid segmentation faults.
"""
import argparse
import json
import pickle
import sys
from io import BytesIO

from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered


def process_pdf(input_path: str, output_path: str) -> None:
    """
    Process a PDF file and save the results to output files.
    
    :param input_path: Path to the input PDF file
    :param output_path: Base path for output files (without extension)
    """
    try:
        # Initialize converter
        converter = PdfConverter(artifact_dict=create_model_dict())
        
        # Read PDF file
        with open(input_path, 'rb') as f:
            file_content = f.read()
        file_object = BytesIO(file_content)
        
        # Convert PDF to rendered format
        rendered = converter(file_object)
        
        # Extract text and images
        markdown_content, _, images = text_from_rendered(rendered)
        
        # Save markdown content
        with open(f"{output_path}.md", 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        # Save images data (pickled for complex objects)
        with open(f"{output_path}_images.pkl", 'wb') as f:
            pickle.dump(images, f)
        
        # Save metadata as JSON
        metadata = {
            'success': True,
            'markdown_length': len(markdown_content) if markdown_content else 0,
            'image_count': len(images) if images else 0
        }
        with open(f"{output_path}_metadata.json", 'w') as f:
            json.dump(metadata, f)
            
        print(f"Successfully processed PDF: {metadata['markdown_length']} characters, {metadata['image_count']} images")
        
    except Exception as e:
        # Save error metadata
        error_metadata = {
            'success': False,
            'error': str(e)
        }
        with open(f"{output_path}_metadata.json", 'w') as f:
            json.dump(error_metadata, f)
        
        print(f"Error processing PDF: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process PDF file with marker")
    parser.add_argument("input_path", help="Path to input PDF file")
    parser.add_argument("output_path", help="Base path for output files")
    
    args = parser.parse_args()
    process_pdf(args.input_path, args.output_path)