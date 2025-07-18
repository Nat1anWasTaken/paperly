"use client";

import { QuizBlock } from "@/data/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuizBlockProps {
  block: QuizBlock;
}

export function QuizBlockComponent({ block }: QuizBlockProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setShowResult(true);
  };

  // Get the correct answer index (now directly a number)
  const correctAnswerIndex = block.correct_answer;
  const correctAnswerText = block.options[correctAnswerIndex] || block.options[0];
  const selectedIndex = selectedAnswer ? parseInt(selectedAnswer) : -1;
  const isCorrect = selectedIndex === correctAnswerIndex;

  return (
    <div className="my-4 p-4 border rounded-lg bg-accent/50">
      <h4 className="font-semibold text-lg mb-3 text-accent-foreground">
        Quiz Question
      </h4>
      <p className="text-foreground mb-4 leading-7">{block.question}</p>

      <RadioGroup
        value={selectedAnswer}
        onValueChange={setSelectedAnswer}
        disabled={showResult}
        className="mb-4"
      >
        {block.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
              showResult
                ? index === correctAnswerIndex
                  ? "bg-success/10 border-success text-success-foreground"
                  : index === selectedIndex && !isCorrect
                  ? "bg-error/10 border-error text-error-foreground"
                  : "bg-card border-border"
                : selectedAnswer === index.toString()
                ? "bg-primary/10 border-primary"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            <RadioGroupItem value={index.toString()} id={`quiz-${block.id}-${index}`} />
            <Label
              htmlFor={`quiz-${block.id}-${index}`}
              className="flex-1 cursor-pointer text-foreground leading-7"
            >
              {option}
            </Label>
            {showResult && index === correctAnswerIndex && (
              <span className="text-success font-semibold">✓</span>
            )}
          </div>
        ))}
      </RadioGroup>

      {!showResult ? (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="mb-2"
        >
          Submit Answer
        </Button>
      ) : (
        <div className="space-y-3">
          <div
            className={`p-3 rounded-lg border ${
              isCorrect
                ? "bg-success/10 text-success-foreground border-success"
                : "bg-error/10 text-error-foreground border-error"
            }`}
          >
            <strong>
              {isCorrect
                ? "Correct!"
                : "Incorrect. The correct answer is: " + correctAnswerText}
            </strong>
          </div>
          {block.explanation && (
            <div className="p-3 bg-muted text-muted-foreground rounded-lg border">
              <strong>Explanation:</strong> <span className="leading-7">{block.explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
