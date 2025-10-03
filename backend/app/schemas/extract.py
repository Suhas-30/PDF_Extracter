from fastapi import UploadFile, File, Form

class ExtractRequest:
    def __init__(self, model: str, file: UploadFile):
        self.model = model
        self.file = file

    @classmethod
    async def from_form(cls, 
                        model: str = Form(...), 
                        file: UploadFile = File(...)):
        return cls(model=model, file=file)
