import { PaperBlock, BlockKind, QuizBlock } from "@/data/types";

export interface BlockGroup {
  type: "single" | "quiz-group";
  blocks: PaperBlock[];
}

export function groupBlocks(blocks: PaperBlock[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  let currentQuizGroup: QuizBlock[] = [];

  for (const block of blocks) {
    if (block.kind === BlockKind.QUIZ) {
      currentQuizGroup.push(block as QuizBlock);
    } else {
      // If we have accumulated quiz blocks, add them as a group
      if (currentQuizGroup.length > 0) {
        groups.push({
          type: "quiz-group",
          blocks: currentQuizGroup
        });
        currentQuizGroup = [];
      }

      // Add the non-quiz block as a single block group
      groups.push({
        type: "single",
        blocks: [block]
      });
    }
  }

  // Handle any remaining quiz blocks at the end
  if (currentQuizGroup.length > 0) {
    groups.push({
      type: "quiz-group",
      blocks: currentQuizGroup
    });
  }

  return groups;
}
