import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Award, Triangle, Trash2, Download, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDndMonitor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function QuestionCard({ 
  question, 
  index, 
  onAdd, 
  onRemove, 
  isInPdf = false, 
  isDragging = false 
}: {
  question: Question;
  index?: number;
  onAdd?: (question: Question) => void;
  onRemove?: (id: string) => void;
  isInPdf?: boolean;
  isDragging?: boolean;
}) {
  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className={`transition-shadow ${isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            {isInPdf && typeof index === 'number' && (
              <Badge variant="outline">#{index + 1}</Badge>
            )}
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
          <div className="flex items-center space-x-2">
            {question.marks && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Award className="h-3 w-3" />
                <span>{question.marks}</span>
              </Badge>
            )}
            {onAdd && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAdd(question)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {isInPdf && onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(question.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
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
  );
}

function SortableQuestionCard({ question, index, onRemove }: {
  question: Question;
  index: number;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move"
    >
      <QuestionCard
        question={question}
        index={index}
        onRemove={onRemove}
        isInPdf={true}
        isDragging={isDragging}
      />
    </div>
  );
}

export default function QuestionPreview({ selectedTopic, onGeneratePdf }: QuestionPreviewProps) {
  const [pdfQuestions, setPdfQuestions] = useState<Question[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: questionsData, isLoading } = useQuery({
    queryKey: [`/api/questions/topic/${selectedTopic}`],
    enabled: !!selectedTopic,
  });

  const questions = (questionsData as any)?.questions || [];
  const availableQuestions = questions.filter((q: Question) => 
    !pdfQuestions.find(pq => pq.id === q.id)
  );

  const addToPdf = (question: Question) => {
    if (!pdfQuestions.find(q => q.id === question.id)) {
      setPdfQuestions([...pdfQuestions, question]);
    }
  };

  const removeFromPdf = (questionId: string) => {
    setPdfQuestions(pdfQuestions.filter(q => q.id !== questionId));
  };

  const handleGeneratePdf = () => {
    onGeneratePdf(pdfQuestions.map(q => q.id));
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId && pdfQuestions.find(q => q.id === activeId)) {
      const oldIndex = pdfQuestions.findIndex(q => q.id === activeId);
      const newIndex = pdfQuestions.findIndex(q => q.id === overId);
      
      setPdfQuestions(arrayMove(pdfQuestions, oldIndex, newIndex));
    }
  };

  const activeQuestion = activeId ? pdfQuestions.find(q => q.id === activeId) : null;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Available Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Available Questions ({availableQuestions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2 p-2">
              {availableQuestions.map((question: Question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onAdd={addToPdf}
                />
              ))}
            </div>
          </ScrollArea>
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
          <ScrollArea className="h-96">
            {pdfQuestions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500 border-2 border-dashed border-slate-200 rounded p-2">
                <div className="text-center">
                  <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Click the + button on questions to add them to your PDF</p>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={pdfQuestions.map(q => q.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 p-2">
                    {pdfQuestions.map((question, index) => (
                      <SortableQuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        onRemove={removeFromPdf}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeQuestion ? (
                    <QuestionCard
                      question={activeQuestion}
                      isInPdf={true}
                      isDragging={true}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}