import modal
import sys

app = modal.App("nxtGen-PDF-Extracter-Backend")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install([
        "poppler-utils",
        "tesseract-ocr",
        "libgl1",
        "libglib2.0-0",
        "libtesseract-dev",
        "libsm6",
        "libxrender1",
        "libxext6",
        "ffmpeg",
        "libssl-dev",
        "g++",
        "make",
        "cmake",
        "git",
        "wget",
        "curl",
    ])
    .pip_install([
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "python-multipart==0.0.6",
        "pydantic==2.11.9",
        "numpy==1.26.4",
        "pillow==10.4.0",
        "pypdf==3.17.4",
        "pdf2image==1.17.0",
        "pytesseract==0.3.13",
        "opencv-python-headless==4.11.0.86",
        "pdfplumber==0.11.7",
        "PyMuPDF==1.26.3",
        "easyocr==1.7.2",
        "paddleocr==2.8.1",
        "torch==2.7.1",
        "torchvision==0.22.1",
        "transformers==4.53.2",
        "safetensors==0.6.2",
        "requests==2.32.5",
        "pandas==2.3.3",
        "scipy==1.16.2",
        "scikit-image==0.25.2",
        "matplotlib==3.10.6",
        "seaborn==0.13.2",

        # 🔑 Docling packages
        "docling==2.41.0",
        "docling-core==2.48.4",
        "docling-parse==4.5.0",
        "docling-ibm-models==3.9.1",
        "omnidocs==0.1.5",
    ])
    .run_commands([
        "mkdir -p /root/uploads",
        "mkdir -p /root/.cache"
    ])
    .add_local_dir("app", "/root/app")
)


@app.function(
    image=image,
    gpu="A10G",
    timeout=600,
    memory=2048
)
@modal.asgi_app()
def create_app():
    sys.path.insert(0, "/root/app")
    from app.main import app as fastapi_app
    return fastapi_app