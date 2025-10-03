from .extractor_factory import ExtractorFactory
from .utils.normalizerDoc import normalizeResultEnhanced
from .utils.normalizerOmin import normalizeOmnidocsResult
import json


class PDFExtractorFacade:
    def __init__(self):
        pass

    async def extract(self, model: str, file_path: str):
        extractorModel = ExtractorFactory.getExtractor(model)
        model_lower = model.lower()

        if model_lower == "docling":
            # --- Docling part ---
            rawResultObj = extractorModel.convert(file_path) 
            
            # Save raw Docling output
            try:
                raw_str = json.dumps(rawResultObj, default=lambda o: o.__dict__, indent=2)
            except Exception:
                raw_str = str(rawResultObj)
            
            with open("raw_docling_output.txt", "w", encoding="utf-8") as f:
                f.write(raw_str)
            print("Raw Docling result written to raw_docling_output.txt")

            # Normalize Docling output
            normalized = normalizeResultEnhanced(model, rawResultObj)
            return normalized

        elif model_lower == "omnidocs":
            # --- OmniDocs part ---
            # Extract text and tables
            text_output = extractorModel.extract_text(file_path)
            tables_output = extractorModel.extract_tables(file_path)
            
            # Convert Pydantic models to dictionaries
            # TextOutput likely has attributes like 'text_blocks', 'metadata', etc.
            if hasattr(text_output, 'model_dump'):
                # Pydantic v2
                text_dict = text_output.model_dump()
            elif hasattr(text_output, 'dict'):
                # Pydantic v1
                text_dict = text_output.dict()
            else:
                # Fallback: try to convert to dict manually
                text_dict = text_output.__dict__
            
            if hasattr(tables_output, 'model_dump'):
                tables_dict = tables_output.model_dump()
            elif hasattr(tables_output, 'dict'):
                tables_dict = tables_output.dict()
            else:
                tables_dict = tables_output.__dict__
            
            # Build raw result structure
            rawResult = {
                "text": text_dict,
                "tables": tables_dict
            }
            
            # Save raw OmniDocs output
            try:
                raw_str = json.dumps(rawResult, indent=2, ensure_ascii=False)
                with open("raw_omnidocs_output.json", "w", encoding="utf-8") as f:
                    f.write(raw_str)
                print("Raw OmniDocs result written to raw_omnidocs_output.json")
            except Exception as e:
                print(f"Warning: Could not save raw output: {e}")
            
            # Normalize OmniDocs output
            normalized = normalizeOmnidocsResult(rawResult)
            return normalized

        else:
            raise ValueError(f"Unsupported model: {model}")