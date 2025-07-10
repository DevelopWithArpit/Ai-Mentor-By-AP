
"use client";

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';

interface QuestionInputProps {
  question: string;
  onQuestionChange: (question: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isSubmitDisabled: boolean;
}

export function QuestionInput({
  question,
  onQuestionChange,
  onSubmit,
  isLoading,
  isSubmitDisabled,
}: QuestionInputProps) {
  return (
    <div className="space-y-4">
      <Label htmlFor="question-input" className="text-lg font-medium text-foreground font-headline">
        Ask a Question
      </Label>
      <Textarea
        id="question-input"
        placeholder="Type your question here..."
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        className="min-h-[100px] bg-card focus:ring-primary"
        disabled={isLoading}
      />
      <Button onClick={onSubmit} disabled={isLoading || isSubmitDisabled} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
        <Send className="mr-2 h-5 w-5" />
        Submit Question
      </Button>
    </div>
  );
}
