"use client";
import Sidebar from "./Sidebar";
import { useSession } from "next-auth/react";
import { useMemo, useRef, useState } from "react";
import { UploadBox, type UploadBoxHandle } from "./UploadBox";
import FileListAndSubmit from "./FileList";
import { Settings, FileText, Upload } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { extractFilesWithModel, type ExtractModel, type ExtractResponseItem } from "@/lib/api";
import LayoutPreview from "./LayoutPreview";
import PDFPreview from "./PDFPreview";
import { blocksToPlainText, type TextBlock } from "@/lib/utils";

export default function ExtractionArea() {
  const { data: session } = useSession();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const uploadBoxRef = useRef<UploadBoxHandle | null>(null);

  // Helper to open the hidden input inside UploadBox
  const openFilePicker = () => {
    uploadBoxRef.current?.open?.();
  };
  const [uploading, setUploading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ExtractModel>("omnidocs");
  const [resultsHistory, setResultsHistory] = useState<{
    id: string;
    timestamp: number;
    model: ExtractModel;
    items: ExtractResponseItem[];
  }[]>([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState<number>(-1);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const currentSubmission = useMemo(() => {
    if (currentSubmissionIndex < 0 || currentSubmissionIndex >= resultsHistory.length) return null;
    return resultsHistory[currentSubmissionIndex];
  }, [currentSubmissionIndex, resultsHistory]);

  const currentItem: ExtractResponseItem | null = useMemo(() => {
    if (!currentSubmission) return null;
    if (currentFileIndex < 0 || currentFileIndex >= currentSubmission.items.length) return null;
    return currentSubmission.items[currentFileIndex];
  }, [currentSubmission, currentFileIndex]);

  // Cache per file name + model to avoid re-requests when navigating
  const [cache, setCache] = useState<Record<string, ExtractResponseItem>>({});

  async function handleSubmit(files: File[]) {
    // Switch to preview mode; do not clear selected files
    setCurrentSubmissionIndex(-1); // not using grouped submissions now
    setCurrentFileIndex(0);
    setHasSubmitted(true);
    setCurrentPage(1);

    // Kick off extraction for the first file immediately; others can be done on-demand when navigated
    if (files[0]) {
      await ensureExtracted(files[0]);
    }
  }

  function cacheKey(file: File) {
    return `${selectedModel}::${file.name}`;
  }

  async function ensureExtracted(file: File) {
    const key = cacheKey(file);
    if (cache[key]) return cache[key];
    const res = await extractFilesWithModel([file], selectedModel);
    const item = res[0];
    setCache((prev) => ({ ...prev, [key]: item }));
    return item;
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Column */}
        <div className="flex-1 flex flex-col items-center justify-start p-12 gap-6">
          <div className="w-full max-w-md flex flex-col items-center gap-8">
            {!hasSubmitted ? (
              <>
                {/* Upload Box */}
                <div className="w-full">
                  {/* Ref is used to open file picker from external button */}
                  <UploadBox ref={uploadBoxRef} onFilesSelect={setSelectedFiles} />
                </div>
                {/* Model Selector (simple mapping to omnidocs/docling) */}
                <div className="w-full p-4 bg-white border rounded shadow">
                  <div className="text-sm font-semibold mb-2">Choose Model</div>
                  <div className="flex gap-3">
                    <button
                      className={`px-3 py-1 rounded border ${selectedModel === "omnidocs" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}
                      onClick={() => setSelectedModel("omnidocs")}
                    >
                      omnidocs
                    </button>
                    <button
                      className={`px-3 py-1 rounded border ${selectedModel === "docling" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}
                      onClick={() => setSelectedModel("docling")}
                    >
                      docling
                    </button>
                  </div>
                </div>
                {/* Allowed File Types & Upload Button */}
                <div className="flex flex-col items-center w-full">
                  <div className="text-center text-gray-400 text-sm mb-2">
                    Allowed files: <span className="font-semibold text-gray-600">PDF, DOCX, JPG, PNG</span>
                  </div>
                  <button onClick={openFilePicker} className="flex items-center gap-2 px-4 py-2 bg-white border rounded shadow hover:bg-gray-50">
                    <Upload className="w-5 h-5 text-gray-500" />
                    Upload Files
                  </button>
                </div>
                {/* File List & Submit */}
                <div className="w-full mt-8">
                  <FileListAndSubmit
                    files={selectedFiles}
                    uploading={uploading}
                    onUploadingChange={setUploading}
                    onShowProgressChange={setShowProgress}
                    onSubmit={handleSubmit}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-full p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded text-sm">
                  {uploading ? "Processing..." : "Previewing document"}
                </div>
                {/* Original PDF left-side preview with navigation */}
                {selectedFiles[currentFileIndex] && (
                  <div className="w-full flex flex-col items-center">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold truncate">{selectedFiles[currentFileIndex].name}</div>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                          onClick={async () => {
                            const idx = Math.max(0, currentFileIndex - 1);
                            setCurrentFileIndex(idx);
                            if (selectedFiles[idx]) await ensureExtracted(selectedFiles[idx]);
                          }}
                          disabled={currentFileIndex <= 0}
                        >
                          Previous
                        </button>
                        <button
                          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                          onClick={async () => {
                            const idx = Math.min(selectedFiles.length - 1, currentFileIndex + 1);
                            setCurrentFileIndex(idx);
                            if (selectedFiles[idx]) await ensureExtracted(selectedFiles[idx]);
                          }}
                          disabled={currentFileIndex >= selectedFiles.length - 1}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                    <PDFPreview file={selectedFiles[currentFileIndex]} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Middle Divider */}
        <div className="w-px bg-gray-200 mx-2" />
        {/* Right Column */}
        <div className="flex-1 flex flex-col items-center justify-start p-12 overflow-hidden">
          <div className="w-full max-w-3xl flex flex-col items-stretch gap-4">
            {/* Removed right-side duplicate preview; results replace this space now */}

            {!currentItem && Object.keys(cache).length === 0 ? (
              <>
                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                <div className="text-lg text-gray-400 mb-2">No content extracted yet</div>
                <div className="text-sm text-gray-400 mb-6 text-center">
                  Upload files, choose a model, and click &quot;Submit&quot; to view extracted content here.
                </div>
                <div className="flex flex-col gap-3 w-full items-center">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded shadow hover:bg-gray-50">
                    <Settings className="w-5 h-5 text-gray-500" />
                    Configure Processing Settings
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded shadow hover:bg-gray-50">
                    <FileText className="w-5 h-5 text-gray-500" />
                    Schema Editor
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded shadow p-6 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Results</h2>
                  <div className="text-sm text-gray-500">Model: <span className="font-semibold">{currentSubmission?.model}</span></div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium">{selectedFiles[currentFileIndex]?.name || currentItem?.fileName}</div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                      onClick={async () => {
                        const idx = Math.max(0, currentFileIndex - 1);
                        setCurrentFileIndex(idx);
                        setCurrentPage(1);
                        if (selectedFiles[idx]) await ensureExtracted(selectedFiles[idx]);
                      }}
                      disabled={currentFileIndex <= 0}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                      onClick={async () => {
                        const idx = Math.min(selectedFiles.length - 1, currentFileIndex + 1);
                        setCurrentFileIndex(idx);
                        setCurrentPage(1);
                        if (selectedFiles[idx]) await ensureExtracted(selectedFiles[idx]);
                      }}
                      disabled={currentFileIndex >= selectedFiles.length - 1}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Decide current result from cache or submission list */}
                {(() => {
                  type ExtractionData = {
                    model?: string;
                    metadata?: { total_pages?: number; total_text_blocks?: number; total_tables?: number };
                    content?: { text_blocks?: Array<Record<string, unknown>> };
                  };

                  function unwrapData(value: unknown): unknown {
                    if (value && typeof value === "object" && "data" in value) {
                      return (value as { data: unknown }).data;
                    }
                    return value;
                  }

                  const file = selectedFiles[currentFileIndex];
                  const key = file ? `${selectedModel}::${file.name}` : undefined;
                  const item = key ? cache[key] : currentItem;
                  if (!item) return <div className="text-sm text-gray-500">No result yet. Click Submit if not started.</div>;
                  if (!item.ok) return <div className="text-red-600 text-sm">{item.error || "Extraction failed"}</div>;
                  const unwrapped = unwrapData(item.data) as ExtractionData | undefined;
                  const allBlocks = (unwrapped?.content?.text_blocks || []) as Array<Record<string, unknown>>;
                  const toTextBlocks = (blocks: Array<Record<string, unknown>>): TextBlock[] =>
                    blocks.map((b) => ({
                      page: typeof (b as Record<string, unknown>).page === "number" ? (b as Record<string, number>).page : 1,
                      content:
                        typeof (b as Record<string, unknown>).content === "string"
                          ? ((b as Record<string, string>).content)
                          : String((b as Record<string, unknown>).content ?? ""),
                      bbox: undefined,
                      reading_order:
                        typeof (b as Record<string, unknown>).reading_order === "number"
                          ? (b as Record<string, number>).reading_order
                          : undefined,
                    }));
                  const filtered = allBlocks.filter((b) => (typeof (b as Record<string, unknown>).page === 'number' ? (b as Record<string, number>).page : 1) === currentPage);
                  const totalPages = unwrapped?.metadata?.total_pages || 1;
                  return (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">
                        <div className="mb-1">Pages: <span className="font-semibold">{totalPages}</span>
                          {" "}| Text blocks: <span className="font-semibold">{unwrapped?.metadata?.total_text_blocks}</span>
                          {" "}| Tables: <span className="font-semibold">{unwrapped?.metadata?.total_tables}</span>
                        </div>
                        <div className="text-xs text-gray-500">Model: {unwrapped?.model}</div>
                      </div>
                      {/* Export buttons */}
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 border rounded text-sm"
                          onClick={() => {
                            const text = blocksToPlainText(toTextBlocks(allBlocks));
                            const blob = new Blob([text], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${(selectedFiles[currentFileIndex]?.name || "document").replace(/\.[^.]+$/, "")}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Export Text
                        </button>
                        <button
                          className="px-3 py-1 border rounded text-sm"
                          onClick={async () => {
                            const { jsPDF } = await import("jspdf");
                            const doc = new jsPDF({ unit: "pt", format: "a4" });
                            const text = blocksToPlainText(toTextBlocks(allBlocks), "\n\n--- Page Break ---\n\n");
                            const margin = 40;
                            const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
                            const lines = doc.splitTextToSize(text, maxWidth);
                            let y = margin;
                            const lineHeight = 14;
                            lines.forEach((line: string) => {
                              if (line === "--- Page Break ---") {
                                doc.addPage();
                                y = margin;
                                return;
                              }
                              if (y > doc.internal.pageSize.getHeight() - margin) {
                                doc.addPage();
                                y = margin;
                              }
                              doc.text(line, margin, y);
                              y += lineHeight;
                            });
                            doc.save(`${(selectedFiles[currentFileIndex]?.name || "document").replace(/\.[^.]+$/, "")}.pdf`);
                          }}
                        >
                          Export PDF
                        </button>
                        <button
                          className="px-3 py-1 border rounded text-sm"
                          onClick={async () => {
                            const { Document, Packer, Paragraph, TextRun } = await import("docx");
                            const text = blocksToPlainText(allBlocks, "\n\n");
                            const paragraphs = text.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)] }));
                            const docx = new Document({ sections: [{ properties: {}, children: paragraphs }] });
                            const blob = await Packer.toBlob(docx);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${(selectedFiles[currentFileIndex]?.name || "document").replace(/\.[^.]+$/, "")}.docx`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Export DOCX
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">Page {currentPage} of {totalPages}</div>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 border rounded text-xs disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Prev Page</button>
                          <button className="px-2 py-1 border rounded text-xs disabled:opacity-50" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Next Page</button>
                        </div>
                      </div>
                      {/* Scrollable result canvas to prevent overflow */}
                      <div className="w-full max-w-full max-h-[70vh] overflow-y-auto overflow-x-hidden border rounded">
                        <LayoutPreview textBlocks={filtered} fitToParent />
                      </div>
                    </div>
                  );
                })()}

                {/* Note: request history navigation removed in favor of per-file preview/caching */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}