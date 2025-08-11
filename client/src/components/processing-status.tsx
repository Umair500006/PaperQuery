import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, CheckCircle, Loader2, Clock } from "lucide-react";

export default function ProcessingStatus() {
  const { data: jobs } = useQuery({
    queryKey: ['/api/processing-jobs'],
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-600" />;
      case 'processing':
        return <Loader2 className="text-blue-600 animate-spin" />;
      case 'error':
        return <CheckCircle className="text-red-600" />;
      default:
        return <Clock className="text-slate-400" />;
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
          {(jobs as any)?.jobs?.length > 0 ? (
            (jobs as any).jobs.map((job: any) => (
              <div key={job.id} className={`flex items-center justify-between p-4 border rounded-lg ${getStatusColor(job.status)}`}>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className={`text-sm font-medium ${getStatusTextColor(job.status)}`}>
                      {job.statusMessage || getJobTypeLabel(job.type)}
                    </p>
                    {job.progress > 0 && job.status === 'processing' && (
                      <p className="text-xs text-blue-600">Progress: {job.progress}%</p>
                    )}
                    {job.error && (
                      <p className="text-xs text-red-600">{job.error}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusBadgeColor(job.status)}`}>
                  {getStatusBadgeText(job.status)}
                </span>
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
