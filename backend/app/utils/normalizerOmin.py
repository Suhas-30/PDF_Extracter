import json
import re
from typing import Any, Dict, List, Optional


def normalizeOmnidocsResult(rawResult: Dict[str, Any]) -> Dict:
    """
    Normalize Omnidocs output format with text blocks and tables.
    
    Args:
        rawResult: Dictionary with 'text' and 'tables' keys from Omnidocs
        
    Returns:
        Normalized dictionary matching the standard format
    """
    normalized = {
        "model": "omnidocs",
        "text_blocks": [],
        "tables": [],
        "lines": [],
        "metadata": {
            "total_pages": 0,
            "total_text_blocks": 0,
            "total_tables": 0,
            "total_lines": 0
        }
    }

    def clean_text(text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Remove excessive pipe characters but preserve single ones
        text = re.sub(r'\|{2,}', ' | ', text)
        
        # Add space after email addresses before capital letters
        text = re.sub(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})([A-Z])', r'\1 \2', text)
        
        # Add space after phone numbers before letters
        text = re.sub(r'(\+\d{10,15})([A-Za-z])', r'\1 \2', text)
        
        # Add space between lowercase and uppercase (camelCase splitting)
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
        
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()

    def convert_bbox_format(bbox: List[float]) -> Dict:
        """
        Convert [x0, y0, x1, y1] bbox to standard format.
        
        Args:
            bbox: [left, top, right, bottom] coordinates
        """
        if not bbox or len(bbox) < 4:
            return None
        
        return {
            "l": bbox[0],
            "t": bbox[1],
            "r": bbox[2],
            "b": bbox[3],
            "width": bbox[2] - bbox[0],
            "height": bbox[3] - bbox[1],
            "coord_origin": "TOPLEFT"
        }

    # Process text blocks
    text_data = rawResult.get("text", {})
    text_blocks = text_data.get("text_blocks", [])
    
    page_numbers = set()
    
    for block in text_blocks:
        text_content = block.get("text", "")
        if not text_content or not text_content.strip():
            continue
        
        cleaned_text = clean_text(text_content)
        if not cleaned_text:
            continue
        
        page_num = block.get("page_num", 1)
        page_numbers.add(page_num)
        
        # Extract font information
        font_info = block.get("font_info", {})
        
        # Build normalized text block
        text_block = {
            "page": page_num,
            "content": cleaned_text,
            "bbox": convert_bbox_format(block.get("bbox")),
            "block_type": block.get("block_type", "paragraph"),
            "confidence": block.get("confidence", 1.0),
            "reading_order": block.get("reading_order"),
            "font_info": {
                "font_name": font_info.get("font_name"),
                "font_size": font_info.get("font_size"),
                "bold": font_info.get("bold", False),
                "italic": font_info.get("italic", False),
                "color": font_info.get("color")
            },
            "language": block.get("language")
        }
        
        normalized["text_blocks"].append(text_block)
        normalized["lines"].append(cleaned_text)

    # Process tables
    tables_data = rawResult.get("tables", {})
    
    if isinstance(tables_data, dict):
        tables_list = tables_data.get("tables", [])
    elif isinstance(tables_data, list):
        tables_list = tables_data
    else:
        tables_list = []
    
    for table in tables_list:
        page_num = table.get("page_num", 1)
        page_numbers.add(page_num)
        
        # Extract table data
        table_data = table.get("data", [])
        
        # Clean table cells
        cleaned_rows = []
        for row in table_data:
            if isinstance(row, list):
                cleaned_row = [clean_text(str(cell)) if cell else "" for cell in row]
                cleaned_rows.append(cleaned_row)
            else:
                cleaned_rows.append([str(row)])
        
        # Calculate dimensions
        num_rows = len(cleaned_rows)
        num_cols = max((len(row) for row in cleaned_rows), default=0)
        
        # Build normalized table
        table_block = {
            "page": page_num,
            "rows": cleaned_rows,
            "num_rows": num_rows,
            "num_cols": num_cols,
            "bbox": convert_bbox_format(table.get("bbox")),
            "confidence": table.get("confidence"),
            "table_type": table.get("table_type", "standard"),
            "has_header": table.get("has_header", False)
        }
        
        normalized["tables"].append(table_block)

    # Sort text blocks by page and reading order
    normalized["text_blocks"].sort(
        key=lambda x: (x["page"], x.get("reading_order", 999999))
    )
    
    # Sort tables by page
    normalized["tables"].sort(key=lambda x: x["page"])

    # Update metadata
    normalized["metadata"]["total_pages"] = len(page_numbers) if page_numbers else 1
    normalized["metadata"]["total_text_blocks"] = len(normalized["text_blocks"])
    normalized["metadata"]["total_tables"] = len(normalized["tables"])
    normalized["metadata"]["total_lines"] = len(normalized["lines"])

    # Write to file
    try:
        with open("normalized_omnidocs_output.json", "w", encoding="utf-8") as f:
            json.dump(normalized, f, indent=2, ensure_ascii=False)
        print(f"✓ Normalized Omnidocs result written to normalized_omnidocs_output.json")
        print(f"  Pages: {normalized['metadata']['total_pages']}")
        print(f"  Text blocks: {normalized['metadata']['total_text_blocks']}")
        print(f"  Tables: {normalized['metadata']['total_tables']}")
        print(f"  Lines: {normalized['metadata']['total_lines']}")
    except Exception as e:
        print(f"✗ Failed to write normalized result: {e}")

    return normalized

