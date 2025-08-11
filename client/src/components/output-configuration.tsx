import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Grid3X3 } from "lucide-react";

interface OutputConfigurationProps {
  config: {
    includeQuestionText: boolean;
    includeVectorDiagrams: boolean;
    includeAnswerSchemes: boolean;
    includeSourceInfo: boolean;
    sortBy: 'difficulty' | 'year_newest' | 'year_oldest' | 'question_type';
    layout: 'standard' | 'compact';
  };
  onConfigChange: (config: any) => void;
}

export default function OutputConfiguration({ config, onConfigChange }: OutputConfigurationProps) {
  const updateConfig = (key: string, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <FileText className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Output Settings</h3>
            <p className="text-sm text-slate-500">Configure your generated PDF</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Include</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="questionText"
                  checked={config.includeQuestionText}
                  onCheckedChange={(checked) => updateConfig('includeQuestionText', checked)}
                />
                <label htmlFor="questionText" className="text-sm text-slate-700">
                  Question text
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vectorDiagrams"
                  checked={config.includeVectorDiagrams}
                  onCheckedChange={(checked) => updateConfig('includeVectorDiagrams', checked)}
                />
                <label htmlFor="vectorDiagrams" className="text-sm text-slate-700">
                  Vector diagrams
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="answerSchemes"
                  checked={config.includeAnswerSchemes}
                  onCheckedChange={(checked) => updateConfig('includeAnswerSchemes', checked)}
                />
                <label htmlFor="answerSchemes" className="text-sm text-slate-700">
                  Answer schemes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sourceInfo"
                  checked={config.includeSourceInfo}
                  onCheckedChange={(checked) => updateConfig('includeSourceInfo', checked)}
                />
                <label htmlFor="sourceInfo" className="text-sm text-slate-700">
                  Source paper info
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question Sorting</label>
            <Select value={config.sortBy} onValueChange={(value) => updateConfig('sortBy', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="difficulty">By difficulty level</SelectItem>
                <SelectItem value="year_newest">By year (newest first)</SelectItem>
                <SelectItem value="year_oldest">By year (oldest first)</SelectItem>
                <SelectItem value="question_type">By question type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">PDF Layout</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={config.layout === 'standard' ? 'default' : 'outline'}
                className={`p-3 h-auto flex-col ${
                  config.layout === 'standard' 
                    ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
                onClick={() => updateConfig('layout', 'standard')}
              >
                <FileText className="mb-1 h-4 w-4" />
                <span className="text-sm font-medium">Standard</span>
              </Button>
              <Button
                variant={config.layout === 'compact' ? 'default' : 'outline'}
                className={`p-3 h-auto flex-col ${
                  config.layout === 'compact' 
                    ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
                onClick={() => updateConfig('layout', 'compact')}
              >
                <Grid3X3 className="mb-1 h-4 w-4" />
                <span className="text-sm font-medium">Compact</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
