from app.models.docling.docling_handler import SingletonDocling
from app.models.OmniDocs.OmniDocs_handler import SingletonOmniDocs

class ExtractorFactory:
    @staticmethod
    def getExtractor(model: str):
        model = model.lower()
        if model == "docling":
            return SingletonDocling()
        elif model == "omnidocs":
            return SingletonOmniDocs()
        else:
            raise ValueError(f"Unknown model: {model}")