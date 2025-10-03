import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Supports GFM for tables
import { diff_match_patch } from 'diff-match-patch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ClipboardCopy, Download } from 'lucide-react';



interface Metrics {
    extractionTime: number;
    elementsDetected: number;
    confidenceScore: number;
    wordCount: number;
}

interface MarkdownDisplayProps {
    title: string;
    markdownContent: string;
    metrics: Metrics;
    isComparison?: boolean;
}

// Helper to render code blocks (optional: integrate with a syntax highlighter like Prism or Highlight.js)
const CodeBlock = ({ className, children }: { className?: string, children: React.ReactNode }) => {
    const language = className?.replace('language-', '') || 'text';
    return (
        <pre className="p-2 my-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm overflow-x-auto">
            <code className={`language-${language}`}>
                {children}
            </code>
        </pre>
    );
};


// Main rendering function for clean/compared markdown
// NOTE: I'm using 'any' for props to resolve the component type conflicts from react-markdown
const MarkdownRenderer = ({ content, isComparison }: { content: string, isComparison: boolean }) => {
    // If in comparison mode, the content will already be wrapped in diff spans
    const markdownToRender = isComparison
        ? <div dangerouslySetInnerHTML={{ __html: content }} />
        : content;

    return (
        <div className="prose dark:prose-invert max-w-none text-sm">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) { 
                        if (!inline) {
                            return <CodeBlock className={className}>{children}</CodeBlock>;
                        }
                        return <code className={className} {...props}>{children}</code>;
                    },
                    table: ({ children }: { children?: React.ReactNode }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="w-full text-left border-collapse border border-gray-200 dark:border-gray-700">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }: { children?: React.ReactNode }) => (
                        <th className="p-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-semibold">{children}</th>
                    ),
                    td: ({ children }: { children?: React.ReactNode }) => (
                        <td className="p-2 border border-gray-200 dark:border-gray-700">{children}</td>
                    ),
                }}
            >
                {markdownToRender as string}
            </ReactMarkdown>
        </div>
    );
};


export function MarkdownDisplay({ title, markdownContent, metrics, isComparison = false }: MarkdownDisplayProps) {

    const handleCopy = () => {
        navigator.clipboard.writeText(markdownContent);
        // TODO: Add a toast notification here (e.g., using Shadcn Toast)
        console.log("Content copied!");
    };

    const handleDownload = () => {
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s/g, '-')}-extraction.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background border rounded-lg shadow-sm">
            {/* Header and Controls */}
            <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                <h3 className="text-sm font-semibold truncate">{title}</h3>
                <div className="space-x-2 flex">
                    <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy to Clipboard">
                        <ClipboardCopy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownload} title="Download Markdown">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Metrics Display */}
            <div className="p-2 text-xs text-muted-foreground grid grid-cols-2 lg:grid-cols-4 gap-1">
                <span>Time: <span className="font-semibold">{metrics.extractionTime.toFixed(2)}s</span></span>
                <span>Elements: <span className="font-semibold">{metrics.elementsDetected}</span></span>
                <span>Words: <span className="font-semibold">{metrics.wordCount}</span></span>
                <span>Conf.: <span className="font-semibold">{metrics.confidenceScore.toFixed(1)}%</span></span>
            </div>
            <Separator />

            {/* Extracted Content Area */}
            <div className="p-4 flex-grow overflow-y-auto">
                <MarkdownRenderer content={markdownContent} isComparison={isComparison} />
            </div>
        </div>
    );
}


// ----------------------------------------------------------------
// 2B. Comparison Logic and Wrapper
// ----------------------------------------------------------------

// Utility to generate a diff and wrap changes in HTML spans
// FIX: Changed colorClass type from restrictive union to 'string'
function getHtmlDiff(text1: string, text2: string, colorClass: string): string { 
    const dmp = new diff_match_patch();
    const diff = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diff);

    let html = '';
    diff.forEach(([op, data]) => {
        // Escaping data to prevent XSS and ensure the markdown is processed correctly
        const escapedData = data
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // The original code was using dmp.diff_text1 on op/data, which is unnecessary
        // Simply use the escaped data
        if (op === 0) { // Equal
            html += escapedData;
        } else if (op === -1) { // Delete (Present in text1, missing in text2)
            // Highlight deletion in the first text
            html += `<span class="${colorClass} line-through rounded px-0.5">${escapedData}</span>`;
        } else if (op === 1) { // Insert (Missing in text1, present in text2)
            // Show insertion by highlighting the new content in the first text's pane
            html += `<span class="${colorClass} rounded px-0.5">${escapedData}</span>`;
        }
    });
    return html;
}

interface ModelResult {
    id: string; 
    content: string; 
    metrics: Metrics;
}

interface ComparisonViewProps {
    modelA: ModelResult;
    modelB: ModelResult;
}

export function ComparisonView({ modelA, modelB }: ComparisonViewProps) {
    
    // FIX: Using the full Tailwind class strings, which is why we changed the type in getHtmlDiff
    const A_COLOR = 'bg-red-200 dark:bg-red-800';   // Color for highlighting differences in Model A's pane
    const B_COLOR = 'bg-green-200 dark:bg-green-800'; // Color for highlighting differences in Model B's pane

    // 1. Get the diff output for Model A's pane (Comparing A against B)
    const diffA = getHtmlDiff(modelA.content, modelB.content, A_COLOR); 

    // 2. Get the diff output for Model B's pane (Comparing B against A)
    const diffB = getHtmlDiff(modelB.content, modelA.content, B_COLOR);

    return (
        <div className="flex h-full space-x-4 w-full">
            {/* Model A Output Pane */}
            <MarkdownDisplay
                title={`Model A: ${modelA.id}`}
                markdownContent={diffA}
                metrics={modelA.metrics}
                isComparison={true}
            />

            {/* Model B Output Pane */}
            <MarkdownDisplay
                title={`Model B: ${modelB.id}`}
                markdownContent={diffB}
                metrics={modelB.metrics}
                isComparison={true}
            />
        </div>
    );
}