from fastapi import FastAPI, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.schemas.extract import ExtractRequest
from app.facade import PDFExtractorFacade
import os
import uvicorn

app = FastAPI()
facade = PDFExtractorFacade()

@app.get("/health")
async def healthCheck():
    return {"message": "I'm alive"}

@app.post("/extract")
async def processJson(req: ExtractRequest = Depends(ExtractRequest.from_form)):
    model = req.model
    file = req.file
    
    uploadDir = "./uploads"
    os.makedirs(uploadDir, exist_ok=True)
    
    filePath = os.path.join(uploadDir, file.filename)
    pdfBytes = await file.read()
    with open(filePath, "wb") as f:
        f.write(pdfBytes)
    
    normalized = await facade.extract(model, filePath)

    response = {
        "success": True,
        "data": {
            "model": normalized.get("model", model),
            "filename": file.filename,
            "metadata": normalized.get("metadata", {
                "total_pages": normalized.get("metadata", {}).get("total_pages", 0),
                "total_text_blocks": normalized.get("metadata", {}).get("total_text_blocks", 0),
                "total_tables": normalized.get("metadata", {}).get("total_tables", 0),
                "total_lines": len(normalized.get("lines", []))
            }),
            "content": {
                "text_blocks": normalized.get("text_blocks", []),
                "lines": normalized.get("lines", []),
                "tables": normalized.get("tables", [])
            }
        },
        "message": f"Successfully extracted content from {file.filename}"
    }
    return JSONResponse(content=response, status_code=200)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080)