import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Award, Triangle, Trash2, Download } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";

interface Question {
  id: string;
  questionText: string;
  questionNumber: string | null;
  paperYear: string | null;
  paperSession: string | null;
  difficulty: string | null;
  marks: number | null;
  hasVectorDiagram: boolean | null;
}

interface QuestionPreviewProps {
  selectedTopic: string;
  onGeneratePdf: (selectedQuestions: string[]) => void;
}

export default function QuestionPreview({ selectedTopic, onGeneratePdf }: QuestionPreviewProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [pdfQuestions, setPdfQuestions] = useState<Question[]>([]);

  const { data: questionsData, isLoading } = useQuery({
    queryKey: [`/api/questions/topic/${selectedTopic}`],
    enabled: !!selectedTopic,
  });

  const questions = (questionsData as any)?.questions || [];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'available' && destination.droppableId === 'pdf') {
      const questionToMove = questions.find((q: Question) => q.id === result.draggableId);
      if (questionToMove && !pdfQuestions.find(q => q.id === questionToMove.id)) {
        setPdfQuestions([...pdfQuestions, questionToMove]);
      }
    } else if (source.droppableId === 'pdf' && destination.droppableId === 'available') {
      setPdfQuestions(pdfQuestions.filter(q => q.id !== result.draggableId));
    } else if (source.droppableId === 'pdf' && destination.droppableId === 'pdf') {
      const reorderedQuestions = Array.from(pdfQuestions);
      const [reorderedItem] = reorderedQuestions.splice(source.index, 1);
      reorderedQuestions.splice(destination.index, 0, reorderedItem);
      setPdfQuestions(reorderedQuestions);
    }
  };

  const removeFromPdf = (questionId: string) => {
    setPdfQuestions(pdfQuestions.filter(q => q.id !== questionId));
  };

  const handleGeneratePdf = () => {
    onGeneratePdf(pdfQuestions.map(q => q.id));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedTopic) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-slate-500 text-center">Select a topic to view questions</p>
        </CardContent>
      </Card>
    );
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Available Questions ({questions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="available">
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <ScrollArea className="h-96" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''} p-2 rounded`}>
                    {questions.map((question: Question, index: number) => (
                      <Draggable key={question.id} draggableId={question.id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                            } ${pdfQuestions.find(q => q.id === question.id) ? 'opacity-50' : ''}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                  {question.questionNumber && (
                                    <Badge variant="outline">Q{question.questionNumber}</Badge>
                                  )}
                                  {question.difficulty && (
                                    <Badge className={getDifficultyColor(question.difficulty)}>
                                      {question.difficulty}
                                    </Badge>
                                  )}
                                  {question.hasVectorDiagram && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                      <Triangle className="h-3 w-3 mr-1" />
                                      Diagram
                                    </Badge>
                                  )}
                                </div>
                                {question.marks && (
                                  <Badge variant="outline" className="flex items-center space-x-1">
                                    <Award className="h-3 w-3" />
                                    <span>{question.marks}</span>
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-2 line-clamp-3">
                                {question.questionText}
                              </p>
                              {(question.paperYear || question.paperSession) && (
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{question.paperYear} {question.paperSession}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </ScrollArea>
              )}
            </Droppable>
          </CardContent>
        </Card>

        {/* PDF Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>PDF Builder ({pdfQuestions.length})</span>
              </div>
              <Button 
                onClick={handleGeneratePdf}
                disabled={pdfQuestions.length === 0}
                size="sm"
              >
                Generate PDF
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="pdf">
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <ScrollArea className="h-96" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className={`space-y-2 min-h-full ${
                    snapshot.isDraggingOver ? 'bg-green-50' : pdfQuestions.length === 0 ? 'bg-slate-50' : ''
                  } p-2 rounded border-2 border-dashed ${
                    snapshot.isDraggingOver ? 'border-green-300' : 'border-slate-200'
                  }`}>
                    {pdfQuestions.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-slate-500">
                        <div className="text-center">
                          <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Drag questions here to build your PDF</p>
                        </div>
                      </div>
                    )}
                    {pdfQuestions.map((question: Question, index: number) => (
                      <Draggable key={question.id} draggableId={question.id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-move transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">#{index + 1}</Badge>
                                  {question.questionNumber && (
                                    <Badge variant="outline">Q{question.questionNumber}</Badge>
                                  )}
                                  {question.difficulty && (
                                    <Badge className={getDifficultyColor(question.difficulty)}>
                                      {question.difficulty}
                                    </Badge>
                                  )}
                                  {question.hasVectorDiagram && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                      <Triangle className="h-3 w-3 mr-1" />
                                      Diagram
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFromPdf(question.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                {question.questionText}
                              </p>
                              {(question.paperYear || question.paperSession) && (
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <Calendar className="h-3 w-3" />
                                  <span>{question.paperYear} {question.paperSession}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </ScrollArea>
              )}
            </Droppable>
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  );
}