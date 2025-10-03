import json
import re
from collections import defaultdict
from typing import Any, Dict, List, Optional


def normalizeResultEnhanced(modelName: str, rawResult: Any) -> Dict:
    """
    Enhanced normalization with better text segmentation and cleaning for Docling output.
    
    Args:
        modelName: Name of the model used for extraction
        rawResult: Raw result object from Docling with pages, char_cells, and tables
        
    Returns:
        Normalized dictionary with text_blocks, tables, and lines
    """
    normalized = {
        "model": modelName,
        "text_blocks": [],
        "tables": [],
        "lines": [],
        "metadata": {
            "total_pages": 0,
            "total_text_blocks": 0,
            "total_tables": 0
        }
    }

    def clean_text(text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Remove excessive pipe characters
        text = re.sub(r'\|{2,}', ' | ', text)
        
        # Add space after email addresses before capital letters
        text = re.sub(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})([A-Z])', r'\1 \2', text)
        
        # Add space after phone numbers before letters
        text = re.sub(r'(\+\d{10,15})([A-Za-z])', r'\1 \2', text)
        
        # Add space between lowercase and uppercase (camelCase splitting)
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
        
        # Add space after common concatenated words
        text = re.sub(r'(and)([A-Z])', r'\1 \2', text)
        text = re.sub(r'(with)([A-Z])', r'\1 \2', text)
        
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()

    def should_merge_cells(cell1: Dict, cell2: Dict, 
                          max_y_diff: float = 3.0, 
                          max_x_gap: float = 30.0) -> bool:
        """
        Determine if two cells should be merged based on proximity.
        
        Args:
            cell1: First cell with bbox and page info
            cell2: Second cell with bbox and page info
            max_y_diff: Maximum vertical difference to consider same line
            max_x_gap: Maximum horizontal gap to merge
        """
        if cell1["page"] != cell2["page"]:
            return False
        
        # Check if on same horizontal line (similar y-coordinates)
        y_diff = abs(cell1["y_pos"] - cell2["y_pos"])
        if y_diff > max_y_diff:
            return False
        
        # Check horizontal gap
        x_gap = cell2["x_start"] - cell1["x_end"]
        if x_gap > max_x_gap or x_gap < -5:  # Allow small overlap
            return False
            
        return True

    def get_safe_attr(obj: Any, attr: str, default: Any = None) -> Any:
        """Safely get attribute from object"""
        try:
            return getattr(obj, attr, default)
        except (AttributeError, TypeError):
            return default

    def extract_bbox_dict(rect_obj: Any) -> Optional[Dict]:
        """Extract bounding box as dictionary"""
        if not rect_obj:
            return None
        
        try:
            if hasattr(rect_obj, '__dict__'):
                return rect_obj.__dict__
            elif hasattr(rect_obj, 'l') and hasattr(rect_obj, 't'):
                # BoundingBox format
                return {
                    "l": rect_obj.l,
                    "t": rect_obj.t,
                    "r": rect_obj.r,
                    "b": rect_obj.b,
                    "coord_origin": str(get_safe_attr(rect_obj, 'coord_origin', 'TOPLEFT'))
                }
            elif hasattr(rect_obj, 'r_x0'):
                # BoundingRectangle format
                return {
                    "r_x0": rect_obj.r_x0,
                    "r_y0": rect_obj.r_y0,
                    "r_x1": rect_obj.r_x1,
                    "r_y1": rect_obj.r_y1,
                    "r_x2": rect_obj.r_x2,
                    "r_y2": rect_obj.r_y2,
                    "r_x3": rect_obj.r_x3,
                    "r_y3": rect_obj.r_y3,
                    "coord_origin": str(get_safe_attr(rect_obj, 'coord_origin', 'TOPLEFT'))
                }
        except Exception as e:
            print(f"Warning: Failed to extract bbox: {e}")
        
        return None

    # Process pages
    pages = get_safe_attr(rawResult, "pages", [])
    
    for page_idx, page in enumerate(pages, start=1):
        parsed_page = get_safe_attr(page, "parsed_page")
        if not parsed_page:
            continue

        # Extract text cells
        char_cells = get_safe_attr(parsed_page, "char_cells", [])
        
        # Group cells by approximate line (using y-coordinate)
        lines_data = defaultdict(list)
        
        for cell in char_cells:
            text_val = get_safe_attr(cell, "text", "")
            rect = get_safe_attr(cell, "rect")
            
            if not text_val or not rect:
                continue
            
            # Skip whitespace-only cells
            if text_val.strip() == "":
                continue
                
            # Use y-coordinate to group into lines (round to reduce sensitivity)
            y_pos = round(get_safe_attr(rect, "r_y0", 0), 1)
            x_start = get_safe_attr(rect, "r_x0", 0)
            x_end = get_safe_attr(rect, "r_x1", 0)
            
            lines_data[(page_idx, y_pos)].append({
                "text": text_val,
                "x_start": x_start,
                "x_end": x_end,
                "y_pos": y_pos,
                "bbox": extract_bbox_dict(rect),
                "page": page_idx
            })

        # Process and merge cells into text blocks
        all_cells = []
        for cells_group in lines_data.values():
            # Sort by x-position (left to right)
            cells_group.sort(key=lambda c: c["x_start"])
            all_cells.extend(cells_group)
        
        # Sort all cells by y-position (top to bottom) then x-position
        all_cells.sort(key=lambda c: (c["y_pos"], c["x_start"]))
        
        if not all_cells:
            continue
        
        # Merge adjacent cells
        merged_blocks = []
        current_block = all_cells[0].copy()
        
        for next_cell in all_cells[1:]:
            if should_merge_cells(current_block, next_cell):
                # Merge cells
                current_block["text"] += next_cell["text"]
                current_block["x_end"] = max(current_block["x_end"], next_cell["x_end"])
                
                # Expand bounding box
                if current_block["bbox"] and next_cell["bbox"]:
                    bbox = current_block["bbox"]
                    next_bbox = next_cell["bbox"]
                    bbox["r_x1"] = max(bbox.get("r_x1", 0), next_bbox.get("r_x1", 0))
                    bbox["r_x2"] = max(bbox.get("r_x2", 0), next_bbox.get("r_x2", 0))
            else:
                # Save current block and start new one
                merged_blocks.append(current_block)
                current_block = next_cell.copy()
        
        # Add the last block
        merged_blocks.append(current_block)
        
        # Create final text blocks with cleaned content
        for block in merged_blocks:
            cleaned_content = clean_text(block["text"])
            if cleaned_content:  # Only add non-empty blocks
                text_block = {
                    "page": block["page"],
                    "content": cleaned_content,
                    "bbox": block["bbox"]
                }
                normalized["text_blocks"].append(text_block)
                normalized["lines"].append(cleaned_content)

        # Extract tables
        tables = get_safe_attr(page, "tables", [])
        
        for table in tables:
            table_data = get_safe_attr(table, "data")
            if not table_data:
                continue
            
            table_cells = get_safe_attr(table_data, "table_cells", [])
            
            # Organize cells into grid
            row_dict = defaultdict(list)
            max_col = 0
            
            for cell in table_cells:
                row_idx = get_safe_attr(cell, "start_row_offset_idx", 0)
                col_idx = get_safe_attr(cell, "start_col_offset_idx", 0)
                text = get_safe_attr(cell, "text", "")
                
                row_dict[row_idx].append({
                    "col": col_idx,
                    "text": clean_text(text)
                })
                max_col = max(max_col, col_idx)
            
            # Convert to rows array
            rows = []
            for row_idx in sorted(row_dict.keys()):
                # Sort cells by column
                cells = sorted(row_dict[row_idx], key=lambda c: c["col"])
                row = [cell["text"] for cell in cells]
                rows.append(row)
            
            # Get table bounding box
            prov = get_safe_attr(table, "prov", [])
            table_bbox = None
            if prov and len(prov) > 0:
                bbox_obj = get_safe_attr(prov[0], "bbox")
                table_bbox = extract_bbox_dict(bbox_obj)
            
            normalized["tables"].append({
                "page": page_idx,
                "rows": rows,
                "num_rows": len(rows),
                "num_cols": max_col + 1,
                "bbox": table_bbox
            })

    # Update metadata
    normalized["metadata"]["total_pages"] = len(pages)
    normalized["metadata"]["total_text_blocks"] = len(normalized["text_blocks"])
    normalized["metadata"]["total_tables"] = len(normalized["tables"])

    # Write to file
    try:
        with open("normalized_docling_output.json", "w", encoding="utf-8") as f:
            json.dump(normalized, f, indent=2, ensure_ascii=False)
        print(f"✓ Normalized result written to normalized_docling_output.json")
        print(f"  Pages: {normalized['metadata']['total_pages']}")
        print(f"  Text blocks: {normalized['metadata']['total_text_blocks']}")
        print(f"  Tables: {normalized['metadata']['total_tables']}")
    except Exception as e:
        print(f"✗ Failed to write normalized result: {e}")

    return normalized