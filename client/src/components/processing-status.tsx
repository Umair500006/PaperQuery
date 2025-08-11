import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Settings, CheckCircle, Loader2, Clock, Brain, AlertCircle } from "lucide-react";

export default function ProcessingStatus() {
  const { data } = useQuery({
    queryKey: ['/api/processing-jobs'],
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const jobs = (data as any)?.jobs || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-600" />;
      case 'processing':
        return <Loader2 className="text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="text-red-600" />;
      default:
        return <Clock className="text-slate-400" />;
    }
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'syllabus_analysis':
        return <Brain className="h-4 w-4 text-purple-600" />;
      case 'question_extraction':
        return <Settings className="h-4 w-4 text-green-600" />;
      case 'pdf_generation':
        return <Settings className="h-4 w-4 text-blue-600" />;
      default:
        return <Settings className="h-4 w-4 text-slate-400" />;
    }
  };

  const getJobTypeTitle = (type: string) => {
    switch (type) {
      case 'syllabus_analysis':
        return 'Syllabus Analysis';
      case 'question_extraction':
        return 'Question Extraction';
      case 'pdf_generation':
        return 'PDF Generation';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-900';
      case 'processing':
        return 'text-blue-900';
      case 'error':
        return 'text-red-900';
      default:
        return 'text-slate-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600 bg-emerald-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-slate-500 bg-slate-100';
    }
  };

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complete';
      case 'processing':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Settings className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Processing Status</h3>
            <p className="text-sm text-slate-500">Real-time updates on document analysis</p>
          </div>
        </div>

        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job: any) => (
              <div key={job.id} className={`p-4 border rounded-lg ${getStatusColor(job.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getJobTypeIcon(job.type)}
                    <div>
                      <p className={`text-sm font-medium ${getStatusTextColor(job.status)}`}>
                        {getJobTypeTitle(job.type)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {job.statusMessage || 'Processing...'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusBadgeColor(job.status)}`}>
                    {getStatusBadgeText(job.status)}
                  </span>
                </div>
                
                {job.status === 'processing' && job.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}
                
                {job.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {job.error}
                  </div>
                )}
                
                {job.result && job.status === 'completed' && job.type === 'syllabus_analysis' && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Extracted {job.result.topicCount || 0} topics and {job.result.subtopicCount || 0} subtopics
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500">No active processing jobs</p>
              <p className="text-xs text-slate-400">Upload documents to see processing status</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getJobTypeLabel(type: string): string {
  switch (type) {
    case 'syllabus_analysis':
      return 'Analyzing Syllabus';
    case 'question_extraction':
      return 'Extracting Questions';
    case 'pdf_generation':
      return 'Generating PDF';
    default:
      return 'Processing...';
  }
}
