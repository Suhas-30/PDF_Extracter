from docling.document_converter import DocumentConverter
from threading import Lock

class SingletonDocling:
    doclingInstance = None
    lock = Lock()
    
    def __new__(cls):
        with cls.lock:
            if cls.doclingInstance is None:
                cls.doclingInstance = super(SingletonDocling, cls).__new__(cls)
                cls.doclingInstance.converter = DocumentConverter()
            return cls.doclingInstance
        
    def convert(self, source):
        return self.converter.convert(source)