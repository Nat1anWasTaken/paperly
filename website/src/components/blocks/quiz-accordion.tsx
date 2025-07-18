"use client";

import { PaperBlock, BlockKind, QuizBlock } from "@/data/types";
import { QuizBlockComponent } from "./quiz-block";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface QuizAccordionProps {
  quizBlocks: QuizBlock[];
}

export function QuizAccordion({ quizBlocks }: QuizAccordionProps) {
  if (quizBlocks.length === 0) return null;
  
  // If only one quiz, render it normally without accordion
  if (quizBlocks.length === 1) {
    return <QuizBlockComponent block={quizBlocks[0]} />;
  }

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Quiz Section ({quizBlocks.length} questions)
      </h3>
      <Accordion type="single" collapsible className="w-full">
        {quizBlocks.map((quiz, index) => (
          <AccordionItem key={quiz.id} value={quiz.id}>
            <AccordionTrigger className="text-left">
              <span className="text-sm font-medium">
                Question {index + 1}: {quiz.question.length > 60 
                  ? quiz.question.substring(0, 60) + "..." 
                  : quiz.question}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <QuizBlockComponent block={quiz} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// Helper function to group consecutive quiz blocks
export function groupQuizBlocks(blocks: PaperBlock[]): Array<PaperBlock | QuizBlock[]> {
  const result: Array<PaperBlock | QuizBlock[]> = [];
  let currentQuizGroup: QuizBlock[] = [];

  for (const block of blocks) {
    if (block.kind === BlockKind.QUIZ) {
      currentQuizGroup.push(block as QuizBlock);
    } else {
      // If we have accumulated quiz blocks, add them as a group
      if (currentQuizGroup.length > 0) {
        result.push(currentQuizGroup);
        currentQuizGroup = [];
      }
      // Add the non-quiz block
      result.push(block);
    }
  }

  // Don't forget the last group if it exists
  if (currentQuizGroup.length > 0) {
    result.push(currentQuizGroup);
  }

  return result;
}