interface ProgressStepsProps {
  currentStep: number;
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const steps = [
    { number: 1, label: "Upload Documents" },
    { number: 2, label: "Select Topic" },
    { number: 3, label: "AI Processing" },
    { number: 4, label: "Generate PDF" }
  ];

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.number <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-300 text-slate-500'
            }`}>
              {step.number}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step.number <= currentStep 
                ? 'text-slate-900' 
                : 'text-slate-500'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-px mx-4 ${
              step.number < currentStep 
                ? 'bg-blue-600' 
                : 'bg-slate-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
