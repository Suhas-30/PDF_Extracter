// components/ModelSelector.tsx

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Zap } from 'lucide-react';

// NOTE: You must ensure 'select', 'switch', 'label', 'separator', and 'alert' 
// are installed via npx shadcn@latest add ...

// Mock data (defined above, repeated here for context)
const AVAILABLE_MODELS = [
  { id: 'Model-A-Layout', name: 'Layout-Aware Extractor (A)', description: 'Best for general documents. High accuracy for text structure.', capabilities: ['Headers', 'Paragraphs'], recommended: true, },
  { id: 'Model-B-Table', name: 'Table-Focused Extractor (B)', description: 'Optimized for complex tables and figures.', capabilities: ['Complex Tables', 'Figures'], recommended: false, },
  { id: 'Model-C-Fast', name: 'Fast Draft Extractor (C)', description: 'Fastest extraction time. Use for quick drafts.', capabilities: ['Fast Speed', 'Basic Text'], recommended: false, },
];

interface ModelSelectorProps {
  // In a real app, these props would come from the parent state/context
  onModelChange: (selectedModels: string[]) => void;
}

export function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [isComparing, setIsComparing] = useState(false);
  const [model1Id, setModel1Id] = useState(AVAILABLE_MODELS[0].id);
  const [model2Id, setModel2Id] = useState(AVAILABLE_MODELS[1].id);
  
  // Find model objects for description display
  const model1 = AVAILABLE_MODELS.find(m => m.id === model1Id);
  const model2 = AVAILABLE_MODELS.find(m => m.id === model2Id);

  // Update parent state whenever a selection changes
  const handleSelectionChange = (id: string, isComparingMode: boolean) => {
    if (isComparingMode) {
      onModelChange([model1Id, model2Id]);
    } else {
      onModelChange([id]);
    }
  };

  // Handler for Model 1 Select change
  const handleModel1Change = (newId: string) => {
    setModel1Id(newId);
    handleSelectionChange(newId, isComparing);
  };

  // Handler for Model 2 Select change
  const handleModel2Change = (newId: string) => {
    setModel2Id(newId);
    handleSelectionChange(newId, isComparing);
  };
  
  // Handler for Comparison Switch change
  const handleCompareToggle = (checked: boolean) => {
    setIsComparing(checked);
    if (checked) {
      onModelChange([model1Id, model2Id]);
    } else {
      onModelChange([model1Id]); // Revert to single model mode
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Model Selector */}
      <div className="space-y-2">
        <Label htmlFor="model1">Primary Extraction Model</Label>
        <Select value={model1Id} onValueChange={handleModel1Change}>
          <SelectTrigger id="model1">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODELS.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.name} {model.recommended && <span className="text-xs text-primary">(Recommended)</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Model 1 Description and Capabilities */}
        {model1 && (
          <p className="text-xs text-muted-foreground p-2 border rounded-md">
            **Description:** {model1.description}
            <br />
            **Capabilities:** <span className="font-semibold">{model1.capabilities.join(', ')}</span>
          </p>
        )}
      </div>

      <Separator />

      {/* Comparison Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="compare-mode" className="text-sm font-medium leading-none">
            Enable Comparison Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            Compare extraction results of two models side-by-side.
          </p>
        </div>
        <Switch 
          id="compare-mode" 
          checked={isComparing} 
          onCheckedChange={handleCompareToggle} 
        />
      </div>

      {/* Second Model Selector (Visible only in Comparison Mode) */}
      {isComparing && (
        <div className="space-y-2 pt-2 border-t border-dashed">
          <Label htmlFor="model2">Second Comparison Model</Label>
          <Select 
            value={model2Id} 
            onValueChange={handleModel2Change}
            disabled={model1Id === model2Id} // Disable if same model is selected
          >
            <SelectTrigger id="model2">
              <SelectValue placeholder="Select Model 2" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.filter(model => model.id !== model1Id).map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Model 2 Description and Warning */}
          {model2 && (
            <Alert variant="default" className="p-2">
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-xs">
                **{model2.name}:** {model2.description}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Warning when same model is selected for comparison */}
      {isComparing && model1Id === model2Id && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Compare</AlertTitle>
          <AlertDescription>
            Please select a different model for the second comparison pane.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}