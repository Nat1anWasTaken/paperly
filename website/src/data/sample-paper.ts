import { 
  PaperData, 
  BlockKind, 
  HeaderBlock, 
  ParagraphBlock, 
  FigureBlock, 
  TableBlock, 
  EquationBlock, 
  CodeBlockBlock, 
  QuoteBlock, 
  CalloutBlock, 
  ReferenceBlock, 
  FootnoteBlock, 
  QuizBlock 
} from "./types";

export const samplePaper: PaperData = {
  paper: {
    id: "paper-1",
    title: "Machine Learning Approaches to Natural Language Processing",
    doi: "10.1000/sample.doi.123",
    created_at: new Date().toISOString(),
  },
  totalPages: 10,
  pages: [
    // Page 1: Title and Abstract (Headers & Paragraphs)
    {
      pageNumber: 1,
      sections: [
        {
          id: "title-section",
          title: "Title Page",
          level: 1,
          blocks: [
            {
              id: "main-title",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 0,
              level: 1,
              text: "Machine Learning Approaches to Natural Language Processing",
            } as HeaderBlock,
            {
              id: "authors",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 1,
              text: "John Doe¹, Jane Smith², Alice Johnson¹",
            } as ParagraphBlock,
            {
              id: "affiliations",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 2,
              text: "¹Department of Computer Science, University of Technology\n²Institute of AI Research, Tech University",
            } as ParagraphBlock,
            {
              id: "abstract-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 3,
              level: 2,
              text: "Abstract",
            } as HeaderBlock,
            {
              id: "abstract-content",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 4,
              text: "This paper presents a comprehensive study of machine learning approaches applied to natural language processing tasks. We explore various methodologies including deep learning, transformer architectures, and their applications in text classification, sentiment analysis, and language generation. Our findings demonstrate significant improvements in performance across multiple benchmarks, with particular emphasis on the effectiveness of attention mechanisms in capturing long-range dependencies in textual data.",
            } as ParagraphBlock,
          ],
        },
      ],
    },
    
    // Page 2: Introduction with Callouts and Quotes
    {
      pageNumber: 2,
      sections: [
        {
          id: "introduction",
          title: "Introduction",
          level: 1,
          blocks: [
            {
              id: "intro-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 5,
              level: 1,
              text: "1. Introduction",
            } as HeaderBlock,
            {
              id: "intro-p1",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 6,
              text: "Natural Language Processing (NLP) has emerged as one of the most significant applications of machine learning in recent years. The field has witnessed remarkable progress with the advent of deep learning techniques and large-scale language models.",
            } as ParagraphBlock,
            {
              id: "intro-callout",
              kind: BlockKind.CALLOUT,
              paper_id: "paper-1",
              index: 7,
              text: "Key insight: The transformer architecture revolutionized NLP by introducing the attention mechanism that allows models to focus on relevant parts of the input sequence.",
            } as CalloutBlock,
            {
              id: "intro-quote",
              kind: BlockKind.QUOTE,
              paper_id: "paper-1",
              index: 8,
              text: "Attention is all you need",
              author: "Vaswani et al., 2017",
            } as QuoteBlock,
            {
              id: "intro-p2",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 9,
              text: "This paper aims to provide a comprehensive overview of the current state-of-the-art in machine learning approaches to NLP, examining both theoretical foundations and practical applications.",
            } as ParagraphBlock,
          ],
        },
      ],
    },

    // Page 3: Figures and Tables
    {
      pageNumber: 3,
      sections: [
        {
          id: "data-analysis",
          title: "Data Analysis",
          level: 1,
          blocks: [
            {
              id: "data-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 10,
              level: 1,
              text: "2. Data Analysis",
            } as HeaderBlock,
            {
              id: "data-description",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 11,
              text: "We analyzed multiple datasets to understand the performance characteristics of different NLP models. The following figure illustrates our experimental setup:",
            } as ParagraphBlock,
            {
              id: "experimental-setup-figure",
              kind: BlockKind.FIGURE,
              paper_id: "paper-1",
              index: 12,
              caption: "Experimental setup showing the data flow through our NLP pipeline with preprocessing, model training, and evaluation stages.",
              figure_number: 1,
            } as FigureBlock,
            {
              id: "results-table",
              kind: BlockKind.TABLE,
              paper_id: "paper-1",
              index: 13,
              title: "Performance Comparison",
              caption: "Comparison of different models on various NLP tasks",
              columns: ["Model", "Task", "Accuracy (%)", "F1-Score", "Training Time (hrs)"],
              rows: [
                ["BERT", "Sentiment Analysis", "92.5", "0.924", "12"],
                ["GPT-3", "Text Generation", "89.3", "0.891", "24"],
                ["RoBERTa", "Question Answering", "94.1", "0.938", "18"],
                ["T5", "Summarization", "87.8", "0.875", "15"],
              ],
            } as TableBlock,
          ],
        },
      ],
    },

    // Page 4: Mathematical Equations and Code
    {
      pageNumber: 4,
      sections: [
        {
          id: "methodology",
          title: "Methodology",
          level: 1,
          blocks: [
            {
              id: "method-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 14,
              level: 1,
              text: "3. Methodology",
            } as HeaderBlock,
            {
              id: "attention-intro",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 15,
              text: "The core of our approach is based on the self-attention mechanism. The attention function can be described as mapping a query and a set of key-value pairs to an output:",
            } as ParagraphBlock,
            {
              id: "attention-equation",
              kind: BlockKind.EQUATION,
              paper_id: "paper-1",
              index: 16,
              equation: "Attention(Q, K, V) = softmax(QK^T / √d_k)V",
              caption: "Self-attention mechanism where Q, K, V are the queries, keys, and values matrices",
            } as EquationBlock,
            {
              id: "implementation-intro",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 17,
              text: "Here's a simplified implementation of the attention mechanism in Python:",
            } as ParagraphBlock,
            {
              id: "attention-code",
              kind: BlockKind.CODE_BLOCK,
              paper_id: "paper-1",
              index: 18,
              language: "python",
              code: `import torch
import torch.nn.functional as F

def attention(query, key, value, mask=None):
    d_k = query.size(-1)
    scores = torch.matmul(query, key.transpose(-2, -1)) / math.sqrt(d_k)
    
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    
    attention_weights = F.softmax(scores, dim=-1)
    output = torch.matmul(attention_weights, value)
    
    return output, attention_weights`,
            } as CodeBlockBlock,
          ],
        },
      ],
    },

    // Page 5: References and Advanced Concepts
    {
      pageNumber: 5,
      sections: [
        {
          id: "related-work",
          title: "Related Work",
          level: 1,
          blocks: [
            {
              id: "related-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 19,
              level: 1,
              text: "4. Related Work",
            } as HeaderBlock,
            {
              id: "related-intro",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 20,
              text: "Our work builds upon several foundational papers in the field of natural language processing and machine learning. Key contributions include:",
            } as ParagraphBlock,
            {
              id: "ref-transformer",
              kind: BlockKind.REFERENCE,
              paper_id: "paper-1",
              index: 21,
              title: "Attention Is All You Need",
              authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
              publication_year: 2017,
              journal: "Advances in Neural Information Processing Systems",
              pages: "5998-6008",
              doi: "10.48550/arXiv.1706.03762",
            } as ReferenceBlock,
            {
              id: "ref-bert",
              kind: BlockKind.REFERENCE,
              paper_id: "paper-1",
              index: 22,
              title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
              authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
              publication_year: 2018,
              journal: "arXiv preprint",
              doi: "10.48550/arXiv.1810.04805",
            } as ReferenceBlock,
          ],
        },
      ],
    },

    // Page 6: Footnotes and More Examples
    {
      pageNumber: 6,
      sections: [
        {
          id: "implementation-details",
          title: "Implementation Details",
          level: 1,
          blocks: [
            {
              id: "impl-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 23,
              level: 1,
              text: "5. Implementation Details",
            } as HeaderBlock,
            {
              id: "impl-para",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 24,
              text: "Our implementation follows the standard transformer architecture¹ with several optimizations for improved performance. We used PyTorch² as our deep learning framework.",
            } as ParagraphBlock,
            {
              id: "footnote-1",
              kind: BlockKind.FOOTNOTE,
              paper_id: "paper-1",
              index: 25,
              reference_number: 1,
              text: "The transformer architecture was first introduced by Vaswani et al. in 'Attention Is All You Need' (2017).",
            } as FootnoteBlock,
            {
              id: "footnote-2",
              kind: BlockKind.FOOTNOTE,
              paper_id: "paper-1",
              index: 26,
              reference_number: 2,
              text: "PyTorch is an open-source machine learning library developed by Facebook's AI Research lab.",
            } as FootnoteBlock,
            {
              id: "optimization-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 27,
              level: 2,
              text: "5.1 Optimization Techniques",
            } as HeaderBlock,
            {
              id: "optimization-para",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 28,
              text: "We applied several optimization techniques including gradient clipping, learning rate scheduling, and mixed precision training to improve convergence and reduce training time.",
            } as ParagraphBlock,
          ],
        },
      ],
    },

    // Page 7: Quiz and Interactive Content
    {
      pageNumber: 7,
      sections: [
        {
          id: "knowledge-check",
          title: "Knowledge Check",
          level: 1,
          blocks: [
            {
              id: "quiz-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 29,
              level: 1,
              text: "6. Knowledge Check",
            } as HeaderBlock,
            {
              id: "quiz-intro",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 30,
              text: "Test your understanding of the concepts covered in this paper with the following questions:",
            } as ParagraphBlock,
            {
              id: "quiz-attention",
              kind: BlockKind.QUIZ,
              paper_id: "paper-1",
              index: 31,
              question: "What is the key innovation introduced by the Transformer architecture?",
              options: [
                "Convolutional layers",
                "Self-attention mechanism",
                "Recurrent connections",
                "Pooling operations"
              ],
              correct_answer: "Self-attention mechanism",
              explanation: "The Transformer architecture's key innovation is the self-attention mechanism, which allows the model to weigh the importance of different parts of the input sequence when processing each element.",
            } as QuizBlock,
            {
              id: "quiz-bert",
              kind: BlockKind.QUIZ,
              paper_id: "paper-1",
              index: 32,
              question: "What does BERT stand for?",
              options: [
                "Bidirectional Encoder Representations from Transformers",
                "Binary Encoded Recurrent Transformers",
                "Balanced Embedding Representation Technique",
                "Basic Encoder for Robust Text-processing"
              ],
              correct_answer: "Bidirectional Encoder Representations from Transformers",
              explanation: "BERT stands for Bidirectional Encoder Representations from Transformers, emphasizing its bidirectional nature and transformer-based architecture.",
            } as QuizBlock,
          ],
        },
      ],
    },

    // Page 8: Complex Code Examples
    {
      pageNumber: 8,
      sections: [
        {
          id: "advanced-implementation",
          title: "Advanced Implementation",
          level: 1,
          blocks: [
            {
              id: "advanced-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 33,
              level: 1,
              text: "7. Advanced Implementation",
            } as HeaderBlock,
            {
              id: "transformer-intro",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 34,
              text: "Here's a more complete implementation of a Transformer block:",
            } as ParagraphBlock,
            {
              id: "transformer-code",
              kind: BlockKind.CODE_BLOCK,
              paper_id: "paper-1",
              index: 35,
              language: "python",
              code: `class TransformerBlock(nn.Module):
    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):
        super().__init__()
        self.attention = MultiHeadAttention(d_model, num_heads)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model)
        )
        
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x, mask=None):
        # Self-attention with residual connection
        attn_output = self.attention(x, x, x, mask)
        x = self.norm1(x + self.dropout(attn_output))
        
        # Feed forward with residual connection
        ff_output = self.feed_forward(x)
        x = self.norm2(x + self.dropout(ff_output))
        
        return x`,
            } as CodeBlockBlock,
            {
              id: "usage-example",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 36,
              text: "This implementation includes layer normalization, residual connections, and dropout for improved training stability.",
            } as ParagraphBlock,
          ],
        },
      ],
    },

    // Page 9: Results and Discussion
    {
      pageNumber: 9,
      sections: [
        {
          id: "results",
          title: "Results and Discussion",
          level: 1,
          blocks: [
            {
              id: "results-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 37,
              level: 1,
              text: "8. Results and Discussion",
            } as HeaderBlock,
            {
              id: "results-intro",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 38,
              text: "Our experiments demonstrate significant improvements across multiple NLP benchmarks. The following figure shows the performance comparison:",
            } as ParagraphBlock,
            {
              id: "results-figure",
              kind: BlockKind.FIGURE,
              paper_id: "paper-1",
              index: 39,
              caption: "Performance comparison across different NLP tasks showing accuracy improvements over baseline models.",
              figure_number: 2,
            } as FigureBlock,
            {
              id: "performance-callout",
              kind: BlockKind.CALLOUT,
              paper_id: "paper-1",
              index: 40,
              text: "Our approach achieved state-of-the-art results on 5 out of 8 benchmark datasets, with an average improvement of 3.2% over previous best results.",
            } as CalloutBlock,
            {
              id: "limitations-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 41,
              level: 2,
              text: "8.1 Limitations",
            } as HeaderBlock,
            {
              id: "limitations-para",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 42,
              text: "While our approach shows promising results, there are several limitations that should be considered for future work.",
            } as ParagraphBlock,
          ],
        },
      ],
    },

    // Page 10: Conclusion and Future Work
    {
      pageNumber: 10,
      sections: [
        {
          id: "conclusion",
          title: "Conclusion and Future Work",
          level: 1,
          blocks: [
            {
              id: "conclusion-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 43,
              level: 1,
              text: "9. Conclusion",
            } as HeaderBlock,
            {
              id: "conclusion-para",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 44,
              text: "This paper presented a comprehensive study of machine learning approaches to natural language processing. We demonstrated the effectiveness of transformer architectures and attention mechanisms across various NLP tasks.",
            } as ParagraphBlock,
            {
              id: "contribution-quote",
              kind: BlockKind.QUOTE,
              paper_id: "paper-1",
              index: 45,
              text: "The future of NLP lies in the continued development of attention-based architectures that can better understand context and meaning.",
              author: "Research Team",
            } as QuoteBlock,
            {
              id: "future-work-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 46,
              level: 2,
              text: "9.1 Future Work",
            } as HeaderBlock,
            {
              id: "future-work-para",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 47,
              text: "Future research directions include exploring more efficient attention mechanisms, investigating multimodal applications, and developing better evaluation metrics for NLP tasks.",
            } as ParagraphBlock,
            {
              id: "final-callout",
              kind: BlockKind.CALLOUT,
              paper_id: "paper-1",
              index: 48,
              text: "All code and datasets used in this research are available at our project repository for reproducibility and further research.",
            } as CalloutBlock,
            {
              id: "acknowledgments-header",
              kind: BlockKind.HEADER,
              paper_id: "paper-1",
              index: 49,
              level: 2,
              text: "Acknowledgments",
            } as HeaderBlock,
            {
              id: "acknowledgments-para",
              kind: BlockKind.PARAGRAPH,
              paper_id: "paper-1",
              index: 50,
              text: "We thank the reviewers for their valuable feedback and the research community for providing open-source tools and datasets that made this work possible.",
            } as ParagraphBlock,
          ],
        },
      ],
    },
  ],
}; 