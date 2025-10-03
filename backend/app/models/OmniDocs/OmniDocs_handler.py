from omnidocs.tasks.text_extraction.extractors.pymupdf import PyMuPDFTextExtractor
from omnidocs.tasks.table_extraction.extractors.camelot import CamelotExtractor
from omnidocs.tasks.ocr_extraction.extractors.easy_ocr import EasyOCRExtractor
from threading import Lock

class SingletonOmniDocs:
    omnidocsInstance = None
    lock = Lock()
    
    def __new__(cls):
        with cls.lock:
            if cls.omnidocsInstance is None:
                cls.omnidocsInstance = super(SingletonOmniDocs, cls).__new__(cls)
                cls.omnidocsInstance.text_extractor = PyMuPDFTextExtractor()
                cls.omnidocsInstance.table_extractor = CamelotExtractor(flavor='stream')
                cls.omnidocsInstance.ocr_extractor = EasyOCRExtractor(languages=['en'])
            return cls.omnidocsInstance
        
    def extract_text(self, pdf_path):
        return self.text_extractor.extract(pdf_path)
    
    def extract_tables(self, pdf_path):
        return self.table_extractor.extract(pdf_path)
    
    def extract_ocr(self, pdf_path):
        return self.ocr_extractor.extract(pdf_path)