import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, X } from "lucide-react";
import { uploadFiles } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  type: 'syllabus' | 'pastpaper' | 'markingscheme';
  title: string;
  description: string;
  icon: string;
  acceptMultiple: boolean;
  onFilesUploaded?: () => void;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  id?: string;
}

export default function FileUpload({ 
  type, 
  title, 
  description, 
  icon, 
  acceptMultiple, 
  onFilesUploaded 
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("physics");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (data: { files: File[]; type: string; subject: string }) =>
      uploadFiles(data.files, data.type, data.subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      onFilesUploaded?.();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Add files to upload list
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    if (!acceptMultiple && uploadedFiles.length > 0) {
      setUploadedFiles(newFiles);
    } else {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }

    // Start upload
    uploadMutation.mutate({ 
      files: acceptedFiles, 
      type, 
      subject: selectedSubject 
    });

    // Simulate upload progress
    newFiles.forEach((_, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadedFiles(prev => prev.map((file, i) => 
          i === prev.length - newFiles.length + index 
            ? { ...file, progress: Math.min(progress, 90) }
            : file
        ));
        
        if (progress >= 90) {
          clearInterval(interval);
          setUploadedFiles(prev => prev.map((file, i) => 
            i === prev.length - newFiles.length + index 
              ? { ...file, status: 'processing', progress: 100 }
              : file
          ));
        }
      }, 200);
    });
  }, [uploadedFiles.length, acceptMultiple, type, selectedSubject, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: acceptMultiple,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getIconComponent = () => {
    switch (icon) {
      case 'book':
        return <BookOpen className="text-emerald-600" />;
      case 'file-alt':
        return <FileText className="text-blue-600" />;
      case 'clipboard-list':
        return <i className="fas fa-clipboard-list text-purple-600"></i>;
      default:
        return <FileText className="text-blue-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (icon) {
      case 'book':
        return 'bg-emerald-100';
      case 'file-alt':
        return 'bg-blue-100';
      case 'clipboard-list':
        return 'bg-purple-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`${getIconBgColor()} p-2 rounded-lg`}>
            {getIconComponent()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>

        {/* Subject Selection */}
        {type === 'pastpaper' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
            </select>
          </div>
        )}

        {/* Drop Zone */}
        <div 
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <div className="bg-slate-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <i className="fas fa-cloud-upload-alt text-slate-500 text-xl"></i>
            </div>
            <div>
              <p className="text-slate-600 font-medium">
                Drop your {type === 'syllabus' ? 'syllabus' : 'past paper'} PDF{acceptMultiple ? 's' : ''} here
              </p>
              <p className="text-sm text-slate-500">
                or <span className="text-blue-600 font-medium">browse files</span>
              </p>
            </div>
            <p className="text-xs text-slate-400">
              Supports: PDF up to 50MB each • {acceptMultiple ? 'Multiple files allowed' : 'Single file only'}
            </p>
          </div>
        </div>

        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className={`flex items-center justify-between p-3 border rounded-lg ${
                uploadedFile.status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                uploadedFile.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <i className={`fas fa-file-pdf ${
                    uploadedFile.status === 'completed' ? 'text-emerald-600' :
                    uploadedFile.status === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`}></i>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      uploadedFile.status === 'completed' ? 'text-emerald-900' :
                      uploadedFile.status === 'error' ? 'text-red-900' :
                      'text-blue-900'
                    }`}>
                      {uploadedFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className={`text-xs ${
                        uploadedFile.status === 'completed' ? 'text-emerald-600' :
                        uploadedFile.status === 'error' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {(uploadedFile.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                      {uploadedFile.status === 'uploading' && (
                        <div className="flex items-center space-x-1">
                          <Progress value={uploadedFile.progress} className="w-16 h-1" />
                          <span className="text-xs text-blue-600">{uploadedFile.progress}%</span>
                        </div>
                      )}
                      {uploadedFile.status === 'processing' && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Processing</span>
                      )}
                      {uploadedFile.status === 'completed' && (
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">✓ Processed</span>
                      )}
                      {uploadedFile.status === 'error' && (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">Error</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className={`${
                    uploadedFile.status === 'completed' ? 'text-emerald-600 hover:text-emerald-700' :
                    uploadedFile.status === 'error' ? 'text-red-600 hover:text-red-700' :
                    'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
