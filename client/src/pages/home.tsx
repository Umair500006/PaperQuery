import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import FileUpload from "@/components/file-upload";
import ProcessingStatus from "@/components/processing-status";
import TopicSelector from "@/components/topic-selector";
import OutputConfiguration from "@/components/output-configuration";
import ProgressSteps from "@/components/progress-steps";
import QuestionPreview from "@/components/question-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Cog, HelpCircle } from "lucide-react";
import { generatePdf, getRecentGeneratedPdfs } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState("");
  const [outputConfig, setOutputConfig] = useState({
    includeQuestionText: true,
    includeVectorDiagrams: true,
    includeAnswerSchemes: false,
    includeSourceInfo: true,
    sortBy: 'difficulty' as const,
    layout: 'standard' as const
  });
  
  const { toast } = useToast();

  const { data: recentPdfs, refetch: refetchPdfs } = useQuery({
    queryKey: ['/api/generated-pdfs'],
    enabled: true
  });

  const handleFilesUploaded = () => {
    setCurrentStep(2);
  };

  const handleTopicSelected = (subject: string, topicId: string, subtopicId?: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(topicId);
    setSelectedSubtopic(subtopicId || "");
    setCurrentStep(3);
  };

  // PDF Generation using drag-and-drop selected questions
  const generateCustomPdfMutation = useMutation({
    mutationFn: async (questionIds: string[]) => {
      const response = await apiRequest('POST', '/api/generate-custom-pdf', {
        questionIds,
        config: outputConfig
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Custom PDF generated successfully!",
      });
      refetchPdfs();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive"
      });
    }
  });

  const handleGeneratePdf = async () => {
    if (!selectedTopic) {
      toast({
        title: "Error",
        description: "Please select a topic first",
        variant: "destructive"
      });
      return;
    }

    try {
      setCurrentStep(4);
      const result = await generatePdf(selectedTopic, outputConfig);
      toast({
        title: "Success",
        description: "PDF generated successfully!",
      });
      refetchPdfs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
      setCurrentStep(3);
    }
  };

  const downloadPdf = (pdfId: string) => {
    window.open(`/api/download-pdf/${pdfId}`, '_blank');
  };

  return (
    <div className="bg-slate-50 font-inter min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">O-Level AI Analyzer</h1>
                <p className="text-sm text-slate-500">Past Paper Question Extractor</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-slate-500 hover:text-slate-700">
                <Cog className="text-lg" />
              </button>
              <button className="text-slate-500 hover:text-slate-700">
                <HelpCircle className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <ProgressSteps currentStep={currentStep} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload Areas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Syllabus Upload */}
            <FileUpload
              type="syllabus"
              title="Upload Syllabus"
              description="Upload your O-Level syllabus PDF to extract topics"
              icon="book"
              acceptMultiple={false}
              onFilesUploaded={handleFilesUploaded}
            />

            {/* Past Papers Upload */}
            <FileUpload
              type="pastpaper"
              title="Upload Past Papers"
              description="Upload multiple past paper PDFs for question extraction"
              icon="file-alt"
              acceptMultiple={true}
              onFilesUploaded={handleFilesUploaded}
            />

            {/* Marking Schemes Upload */}
            <FileUpload
              type="markingscheme"
              title="Upload Marking Schemes"
              description="Upload marking scheme PDFs to extract answer patterns"
              icon="clipboard-list"
              acceptMultiple={true}
              onFilesUploaded={handleFilesUploaded}
            />

            {/* Processing Status */}
            <ProcessingStatus />

            {/* Question Preview and PDF Builder */}
            {selectedTopic && (
              <div className="mt-8">
                <QuestionPreview 
                  selectedTopic={selectedTopic}
                  onGeneratePdf={(questionIds) => generateCustomPdfMutation.mutate(questionIds)}
                />
              </div>
            )}
          </div>

          {/* Right Column: Topic Selection & Controls */}
          <div className="space-y-6">
            {/* Topic Selection */}
            <TopicSelector
              selectedSubject={selectedSubject}
              selectedTopic={selectedTopic}
              selectedSubtopic={selectedSubtopic}
              onTopicSelected={handleTopicSelected}
            />

            {/* Output Configuration */}
            <OutputConfiguration
              config={outputConfig}
              onConfigChange={setOutputConfig}
            />

            {/* Generate Button */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 transition-colors"
                  onClick={handleGeneratePdf}
                  disabled={!selectedTopic || currentStep === 4}
                >
                  <i className="fas fa-magic mr-2"></i>
                  {currentStep === 4 ? "Generating..." : "Generate Topic PDF"}
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-500">Estimated processing time: 2-3 minutes</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Generations */}
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <i className="fas fa-history text-slate-600"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Recent Generations</h3>
                    <p className="text-sm text-slate-500">Your generated PDFs</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(recentPdfs as any)?.pdfs?.length > 0 ? (
                    (recentPdfs as any).pdfs.map((pdf: any) => (
                      <div key={pdf.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-file-pdf text-red-500"></i>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{pdf.filename}</p>
                            <p className="text-xs text-slate-500">
                              Generated {new Date(pdf.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadPdf(pdf.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <i className="fas fa-download"></i>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500">No PDFs generated yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Features</a></li>
                <li><a href="#" className="hover:text-slate-900">Pricing</a></li>
                <li><a href="#" className="hover:text-slate-900">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Help Center</a></li>
                <li><a href="#" className="hover:text-slate-900">Contact Us</a></li>
                <li><a href="#" className="hover:text-slate-900">System Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Documentation</a></li>
                <li><a href="#" className="hover:text-slate-900">Tutorials</a></li>
                <li><a href="#" className="hover:text-slate-900">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900">Terms</a></li>
                <li><a href="#" className="hover:text-slate-900">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-center">
            <p className="text-sm text-slate-500">&copy; 2024 O-Level AI Analyzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
