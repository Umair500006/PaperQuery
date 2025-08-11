import { apiRequest } from "./queryClient";

export async function uploadFiles(files: File[], type: string, subject: string) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('type', type);
  formData.append('subject', subject);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Upload failed');
  }

  return response.json();
}

export async function processSyllabus(subject: string) {
  const response = await apiRequest('POST', '/api/process-syllabus', {
    subject
  });

  return response.json();
}

export async function generatePdf(topicId: string, config: any) {
  const response = await apiRequest('POST', '/api/generate-pdf', {
    topicId,
    config
  });

  return response.json();
}

export async function getProcessingJob(jobId: string) {
  const response = await apiRequest('GET', `/api/processing-job/${jobId}`);
  return response.json();
}

export async function getRecentGeneratedPdfs() {
  const response = await apiRequest('GET', '/api/generated-pdfs');
  return response.json();
}

export async function downloadPdf(pdfId: string) {
  window.open(`/api/download-pdf/${pdfId}`, '_blank');
}
