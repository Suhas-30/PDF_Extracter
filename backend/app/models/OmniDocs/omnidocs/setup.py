from setuptools import setup, find_packages

setup(
    name="omnidocs_local",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "paddleocr",
        "PyMuPDF",
        "camelot-py[cv]",
        "easyocr"
    ],
)
