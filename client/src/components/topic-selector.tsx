import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { List, Brain, Loader2, FileText } from "lucide-react";
import { processSyllabus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface TopicSelectorProps {
  selectedSubject: string;
  selectedTopic: string;
  selectedSubtopic: string;
  onTopicSelected: (subject: string, topicId: string, subtopicId?: string) => void;
}

export default function TopicSelector({ 
  selectedSubject, 
  selectedTopic, 
  selectedSubtopic, 
  onTopicSelected 
}: TopicSelectorProps) {
  const [currentSubject, setCurrentSubject] = useState(selectedSubject || "physics");
  const [currentTopic, setCurrentTopic] = useState(selectedTopic);
  const [currentSubtopic, setCurrentSubtopic] = useState(selectedSubtopic);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topicsData, isLoading: topicsLoading, refetch: refetchTopics } = useQuery({
    queryKey: [`/api/topics/${currentSubject}`],
    enabled: !!currentSubject,
    refetchInterval: 5000, // Refresh every 5 seconds to catch new topics
  });

  const processSyllabusMutation = useMutation({
    mutationFn: (subject: string) => processSyllabus(subject),
    onSuccess: (data) => {
      toast({
        title: "Processing Started",
        description: "The syllabus is being analyzed to extract topics and subtopics.",
      });
      // Invalidate topics immediately to refresh the query
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${currentSubject}`] });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Listen for processing job completion to refresh topics
  const { data: processingJobs } = useQuery({
    queryKey: ['/api/processing-jobs'],
    refetchInterval: 2000,
  });

  useEffect(() => {
    const jobs = (processingJobs as any)?.jobs || [];
    const completedSyllabusJob = jobs.find((job: any) => 
      job.type === 'syllabus_analysis' && job.status === 'completed'
    );
    
    if (completedSyllabusJob) {
      // Refresh topics when syllabus processing completes
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${currentSubject}`] });
    }
  }, [processingJobs, currentSubject, queryClient]);

  const { data: questionsData } = useQuery({
    queryKey: ['/api/questions/topic', currentTopic],
    enabled: !!currentTopic,
  });

  // Group topics by main topic
  const groupedTopics = (topicsData as any)?.topics?.reduce((acc: any, topic: any) => {
    if (!acc[topic.mainTopic]) {
      acc[topic.mainTopic] = {
        id: topic.id,
        mainTopic: topic.mainTopic,
        subtopics: []
      };
    }
    if (topic.subtopic) {
      acc[topic.mainTopic].subtopics.push({
        id: topic.id,
        subtopic: topic.subtopic
      });
    }
    return acc;
  }, {}) || {};

  // Get unique main topics (by mainTopic name, regardless of subtopic value)
  const mainTopicNames = new Set();
  const mainTopicsFromAPI = (topicsData as any)?.topics?.filter((topic: any) => {
    if (!mainTopicNames.has(topic.mainTopic)) {
      mainTopicNames.add(topic.mainTopic);
      return true;
    }
    return false;
  }) || [];

  const mainTopics = mainTopicsFromAPI;
  const selectedTopicKey = Object.keys(groupedTopics).find((key: string) => 
    groupedTopics[key].id === currentTopic || 
    groupedTopics[key].subtopics.some((st: any) => st.id === currentTopic)
  );
  const selectedTopicData = selectedTopicKey ? groupedTopics[selectedTopicKey] : null;

  const subtopics = selectedTopicData?.subtopics || [];

  useEffect(() => {
    if (currentTopic && currentSubject) {
      onTopicSelected(currentSubject, currentTopic, currentSubtopic);
    }
  }, [currentTopic, currentSubtopic, currentSubject, onTopicSelected]);

  const handleSubjectChange = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentTopic("");
    setCurrentSubtopic("");
  };

  const handleMainTopicChange = (topicId: string) => {
    setCurrentTopic(topicId);
    setCurrentSubtopic("");
  };

  const handleSubtopicChange = (subtopicId: string) => {
    setCurrentSubtopic(subtopicId);
    if (subtopicId === "all" || subtopicId === "") {
      // Show all questions for the main topic
      setCurrentTopic(currentTopic);
    } else {
      // Use subtopic ID as the topic ID for queries
      setCurrentTopic(subtopicId);
    }
  };

  const handleProcessSyllabus = () => {
    processSyllabusMutation.mutate(currentSubject);
  };

  const processPastPapersMutation = useMutation({
    mutationFn: async (subject: string) => {
      return apiRequest(`/api/process-pastpapers`, {
        method: 'POST',
        body: { subject }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/processing-jobs'] });
      toast({ title: 'Past paper processing started', description: 'Questions will be categorized against topics' });
    },
    onError: (error: any) => {
      toast({ title: 'Processing failed', description: error.message, variant: 'destructive' });
    }
  });

  const isProcessingPastPapers = processPastPapersMutation.isPending;

  const handleProcessPastPapers = () => {
    processPastPapersMutation.mutate(currentSubject);
  };

  const questionCount = (questionsData as any)?.questions?.length || 0;
  const diagramCount = (questionsData as any)?.questions?.filter((q: any) => q.hasVectorDiagram).length || 0;
  const years = (questionsData as any)?.questions?.map((q: any) => q.paperYear).filter(Boolean) || [];
  const yearRange = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : '';

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <List className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Select Topic</h3>
            <p className="text-sm text-slate-500">Choose from extracted syllabus topics</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <div className="flex gap-2">
              <Select value={currentSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button 
                  onClick={handleProcessSyllabus}
                  disabled={processSyllabusMutation.isPending || isProcessingPastPapers}
                  className="bg-blue-600 hover:bg-blue-700 px-4"
                  data-testid="button-process-syllabus"
                  title="Process uploaded syllabus to extract topics and subtopics using AI"
                >
                  {processSyllabusMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Process Syllabus
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleProcessPastPapers}
                  disabled={isProcessingPastPapers || processSyllabusMutation.isPending || !currentSubject}
                  className="bg-green-600 hover:bg-green-700 px-4"
                  data-testid="button-process-pastpapers"
                  title="Process uploaded past papers to categorize questions against topics"
                >
                  {isProcessingPastPapers ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Process Past Papers
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => refetchTopics()}
                  variant="outline"
                  size="sm"
                  className="px-3"
                  data-testid="button-refresh-topics"
                  title="Refresh topic list"
                  disabled={processSyllabusMutation.isPending || isProcessingPastPapers}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Main Topic</label>
            {topicsLoading ? (
              <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
            ) : mainTopics.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-sm text-slate-500 text-center">
                  No topics found. Upload a syllabus and click "Process Syllabus" to extract topics using AI.
                </p>
                <p className="text-xs text-slate-400 text-center mt-1">
                  Found {(topicsData as any)?.topics?.length || 0} topic entries
                </p>

              </div>
            ) : (
              <Select value={currentTopic} onValueChange={handleMainTopicChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a main topic..." />
                </SelectTrigger>
                <SelectContent>
                  {mainTopics.map((topic: any) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.mainTopic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {currentTopic && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subtopic (Optional)
                {subtopics.length > 0 && (
                  <span className="text-xs text-slate-500 ml-1">({subtopics.length} available)</span>
                )}
              </label>
              {subtopics.length > 0 ? (
                <Select value={currentSubtopic} onValueChange={handleSubtopicChange}>
                  <SelectTrigger className="w-full" data-testid="select-subtopic">
                    <SelectValue placeholder="All subtopics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subtopics</SelectItem>
                    {subtopics.map((subtopic: any) => (
                      <SelectItem key={subtopic.id} value={subtopic.id}>
                        {subtopic.subtopic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 text-center">
                    No subtopics found for this topic
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Topic Statistics */}
          {currentTopic && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Questions Found:</span>
                <span className="text-sm font-semibold text-slate-900">{questionCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Vector Diagrams:</span>
                <span className="text-sm font-semibold text-slate-900">{diagramCount}</span>
              </div>
              {yearRange && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Paper Years:</span>
                  <span className="text-sm font-semibold text-slate-900">{yearRange}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
