import { diff_match_patch } from 'diff-match-patch';
import { MarkdownDisplay } from './MarkdownDisplay'; // Import the display component

// Define the types used in the comparison view (must match types in MarkdownDisplay.tsx)
interface Metrics {
  extractionTime: number;
  elementsDetected: number;
  confidenceScore: number;
  wordCount: number;
}

interface ModelResult {
  id: string; // Model name (e.g., 'LayoutModel', 'TableModel')
  content: string; // Extracted Markdown content
  metrics: Metrics;
}

// ----------------------------------------------------------------
// 1. Diff Utility Function
// ----------------------------------------------------------------

/**
 * Generates an HTML string with differences highlighted using Tailwind CSS classes.
 * * @param text1 The text to be rendered in the current pane (the base text).
 * @param text2 The text from the other pane (used for comparison).
 * @param deleteClass The Tailwind class to apply to deleted/missing elements in text1.
 * @param insertClass The Tailwind class to apply to inserted/added elements in text1.
 */
function getHtmlDiff(
  text1: string, 
  text2: string, 
  deleteClass: string,
  insertClass: string,
): string {
  const dmp = new diff_match_patch();
  const diff = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diff);

  let html = '';
  
  // NOTE: diff_match_patch returns: 0=EQUAL, -1=DELETE (from text1), 1=INSERT (into text1)
  diff.forEach(([op, data]) => {
    // Escape HTML characters in the data to ensure it renders as raw text/markdown
    const escapedData = data
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    if (op === 0) { // Equal
      html += escapedData;
    } else if (op === -1) { // Deleted (Present in text1, missing in text2)
      // Highlight what Model A had that Model B removed/missed
      html += `<span class="${deleteClass} rounded px-0.5">${escapedData}</span>`;
    } else if (op === 1) { // Inserted (Missing in text1, present in text2)
      // Show what Model B added that Model A missed (by highlighting the new content in the A pane)
      html += `<span class="${insertClass} rounded px-0.5">${escapedData}</span>`;
    }
  });
  
  // ReactMarkdown will render this HTML inside the component
  return html;
}

// ----------------------------------------------------------------
// 2. ComparisonView Component
// ----------------------------------------------------------------

interface ComparisonViewProps {
  modelA: ModelResult;
  modelB: ModelResult;
}

export function ComparisonView({ modelA, modelB }: ComparisonViewProps) {
  // Define colors for highlighting differences
  const A_DELETE = 'bg-red-200 dark:bg-red-800 opacity-80';   // Content A has that B doesn't
  const A_INSERT = 'bg-yellow-100 dark:bg-yellow-800 opacity-80'; // Content B has that A doesn't
  
  const B_DELETE = 'bg-red-200 dark:bg-red-800 opacity-80';   // Content B has that A doesn't
  const B_INSERT = 'bg-yellow-100 dark:bg-yellow-800 opacity-80'; // Content A has that B doesn't (less common, but included)

  // 1. Diff for Model A's Pane (comparing A to B)
  // Highlights what A has that B is missing (DELETE) and what B has that A is missing (INSERT)
  const diffA = getHtmlDiff(modelA.content, modelB.content, A_DELETE, A_INSERT);
  
  // 2. Diff for Model B's Pane (comparing B to A)
  // The 'delete' class here highlights content B has that A is missing (i.e., new content in B)
  // Note: The meaning of DELETE/INSERT depends on the order of arguments passed to dmp.diff_main
  const diffB = getHtmlDiff(modelB.content, modelA.content, B_DELETE, B_INSERT);

  return (
    <div className="flex h-full space-x-4 w-full">
      {/* Model A Output Pane */}
      <MarkdownDisplay 
        title={`Model 1: ${modelA.id}`} 
        markdownContent={diffA} 
        metrics={modelA.metrics} 
        isComparison={true}
      />
      
      {/* Model B Output Pane */}
      <MarkdownDisplay 
        title={`Model 2: ${modelB.id}`} 
        markdownContent={diffB} 
        metrics={modelB.metrics} 
        isComparison={true}
      />
    </div>
  );
}