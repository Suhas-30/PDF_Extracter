import PDFViewer from "./PDFViewer";
import { ModelSelector } from "./ModelSelector";

// Define a placeholder interface for the component props
interface ExtractionViewProps {
  // We'll pass the file data and extraction results here
  pdfUrl: string | null;
  extractedData: unknown; // safer than any
  selectedModels: string[];
}

// Placeholder component for the right pane (Markdown/Comparison)
const MarkdownDisplayPlaceholder = ({ title }: { title: string }) => (
  <div className="flex-1 flex flex-col h-full bg-background/50 border rounded-lg shadow-sm">
    <h3 className="p-3 text-sm font-semibold border-b bg-muted/30">{title}</h3>
    <div className="p-4 flex-grow overflow-y-auto">
      {/* TODO: Add extracted markdown content here */}
      <p className="text-muted-foreground">Extracted content will appear here...</p>
    </div>
  </div>
);

export function ExtractionView({ pdfUrl, extractedData, selectedModels }: ExtractionViewProps) {
  const isComparing = selectedModels.length > 1;

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Upload a PDF to begin extraction.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] p-4 space-x-4">
      
      {/* LEFT COLUMN: Controls (Model Selection & Page Navigation) */}
      <div className="hidden lg:flex lg:w-1/5 flex-col space-y-4">
        <div className="p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Extraction Settings</h3>
          <ModelSelector onModelChange={() => { /* TODO: Implement model change handler */ }} />
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Document Pages</h3>
          {/* TODO: Implement page navigation here */}
          <p className="text-sm text-muted-foreground">Page controls go here...</p>
        </div>
      </div>

      {/* RIGHT AREA: Dual-Pane Display */}
      <div className="flex-1 flex space-x-4 overflow-hidden">
        
        {/* LEFT PANE: PDF Viewer with Annotations */}
        <div className={`flex flex-col h-full border rounded-lg shadow-lg ${isComparing ? 'lg:w-1/3' : 'lg:w-1/2'}`}>
          <h3 className="p-3 text-sm font-semibold border-b bg-muted/30">Original PDF View</h3>
          <div className="flex-grow overflow-auto">
            {/* TODO: Implement PDF rendering and annotation logic inside PDFViewer */}
            <PDFViewer
              pdfUrl={pdfUrl}
              annotations={
                (extractedData && typeof extractedData === 'object' && 'annotations' in extractedData)
                  ? (extractedData as { annotations?: unknown }).annotations
                  : undefined
              }
            />
          </div>
        </div>

        {/* RIGHT PANE(S): Extracted Content Display (Markdown/Comparison) */}
        <div className={`flex h-full space-x-4 ${isComparing ? 'lg:w-2/3' : 'lg:w-1/2'}`}>
          {isComparing ? (
            // Comparison Mode: Two or more panes side-by-side
            <div className="flex space-x-4 w-full">
              {/* Map over selected models to show comparison panes */}
              {selectedModels.slice(0, 2).map(modelId => (
                <MarkdownDisplayPlaceholder key={modelId} title={`Model Output: ${modelId}`} />
              ))}
            </div>
          ) : (
            // Single Model Mode: One pane for output
            <MarkdownDisplayPlaceholder title={`Extracted Markdown (${selectedModels[0] || 'Default Model'})`} />
          )}
        </div>
      </div>
    </div>
  );
}