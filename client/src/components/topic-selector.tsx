import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List } from "lucide-react";

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

  const { data: topicsData } = useQuery({
    queryKey: ['/api/topics', currentSubject],
    enabled: !!currentSubject,
  });

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

  const mainTopics = Object.values(groupedTopics);
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
    setCurrentTopic(subtopicId); // Use subtopic ID as the topic ID for queries
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
            <Select value={currentSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Main Topic</label>
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
          </div>

          {subtopics.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subtopic (Optional)</label>
              <Select value={currentSubtopic} onValueChange={handleSubtopicChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All subtopics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subtopics</SelectItem>
                  {subtopics.map((subtopic: any) => (
                    <SelectItem key={subtopic.id} value={subtopic.id}>
                      {subtopic.subtopic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
