"use client";

import * as React from "react";
import { Bot, Send, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// Type declarations for Speech APIs
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface AiChatProps {
  paperId: string;
}

// Custom components for ReactMarkdown
/* eslint-disable @typescript-eslint/no-explicit-any */
const markdownComponents: any = {
  // Headers
  h1: ({ children, ...props }: any) => (
    <h1 className="text-2xl font-bold mb-4 mt-6 text-primary" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-xl font-bold mb-3 mt-5 text-primary" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-lg font-bold mb-3 mt-4 text-primary" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-base font-bold mb-2 mt-3 text-primary" {...props}>
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p className="mb-3 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul className="mb-3 pl-4 space-y-1 list-disc list-inside" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="mb-3 pl-4 space-y-1 list-decimal list-inside" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Code
  code: ({ inline, children, className, ...props }: any) => {
    if (inline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 text-sm font-mono border rounded" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm font-mono mb-3 border">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },

  // Links
  a: ({ href, children, ...props }: any) => (
    <a href={href} className="text-primary hover:text-primary/80 underline font-medium transition-colors" target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),

  // Strong/Bold
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),

  // Emphasis/Italic
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 my-3 italic text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),

  // Break lines
  br: () => <br className="my-1" />,

  // Horizontal rules
  hr: ({ ...props }: any) => <hr className="my-4 border-t border-border" {...props} />
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function parseWithMath(content: string): React.ReactNode {
  let keyCounter = 0;

  // First handle display math \[...\]
  const displayMathRegex = /\\\[([\s\S]*?)\\\]/g;
  const processedContent = content.replace(displayMathRegex, (match, mathContent) => {
    return `___DISPLAY_MATH_${keyCounter++}___${mathContent}___END_DISPLAY_MATH___`;
  });

  // Then handle inline math \(...\)
  const finalContent = processedContent.replace(/\\\((.*?)\\\)/g, (match, mathContent) => {
    return `___INLINE_MATH_${keyCounter++}___${mathContent}___END_INLINE_MATH___`;
  });

  // Split by math placeholders and process
  const segments = finalContent.split(/(___(?:DISPLAY|INLINE)_MATH_\d+___.*?___END_(?:DISPLAY|INLINE)_MATH___)/);

  return segments.map((segment, index) => {
    if (segment.startsWith("___DISPLAY_MATH_")) {
      const mathContent = segment.match(/___DISPLAY_MATH_\d+___(.*?)___END_DISPLAY_MATH___/)?.[1] || "";
      return (
        <div key={index} className="my-4">
          <BlockMath math={mathContent} />
        </div>
      );
    } else if (segment.startsWith("___INLINE_MATH_")) {
      const mathContent = segment.match(/___INLINE_MATH_\d+___(.*?)___END_INLINE_MATH___/)?.[1] || "";
      return <InlineMath key={index} math={mathContent} />;
    } else {
      // Regular markdown content
      return (
        <ReactMarkdown key={index} remarkPlugins={[remarkBreaks, remarkGfm]} components={markdownComponents} skipHtml={false}>
          {segment}
        </ReactMarkdown>
      );
    }
  });
}

function MessageContent({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return <span>{message.content}</span>;
  }

  // Clean up the content for better markdown parsing
  const cleanContent = message.content
    .replace(/\\n/g, "\n") // Convert literal \n to actual newlines
    .replace(/\n\n+/g, "\n\n") // Normalize multiple newlines
    .trim();

  return <div className="prose prose-sm max-w-none dark:prose-invert">{parseWithMath(cleanContent)}</div>;
}

export function AiChat({ paperId }: AiChatProps) {
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm here to help you understand this research paper. Feel free to ask me any questions about the content, methodology, or findings.",
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isListening, setIsListening] = React.useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = React.useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = React.useState<boolean>(false);

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const synthRef = React.useRef<SpeechSynthesis | null>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Initialize speech recognition and synthesis
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Check for speech synthesis support
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
        setSpeechSupported(true);
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages are added
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  const toggleListening = () => {
    if (isListening) {
      // Stop listening and send the message
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      // Send message if there's content
      if (inputMessage.trim()) {
        handleSendMessage();
      }
    } else {
      // Start listening
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      }
    }
  };

  const speakMessage = (text: string) => {
    if (synthRef.current && !isSpeaking) {
      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !paperId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date()
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get chat history in the format expected by the API
      const history = chatMessages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await api.chatWithPaper(paperId, messageToSend, history);

      // Create placeholder for streaming response
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date()
      };

      setChatMessages((prev) => [...prev, aiMessage]);

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.trim() && line.startsWith("data: ")) {
                const data = line.slice(6); // Remove 'data: ' prefix
                if (data === "[DONE]") {
                  break;
                }

                // Filter out control messages
                if (data.includes("Starting chat response...") || data.includes("Starting chat end") || data.includes("Chat response completed") || data.trim() === "") {
                  continue;
                }

                try {
                  // If it's not JSON, treat it as raw text
                  setChatMessages((prev) => prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: msg.content + data } : msg)));
                } catch {
                  // If it's not valid JSON, treat as plain text
                  setChatMessages((prev) => prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: msg.content + data } : msg)));
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: "I apologize, but I'm having trouble connecting to the chat service right now. Please try again later.",
        role: "assistant",
        timestamp: new Date()
      };

      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          Ask AI
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Ask questions about this research paper</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 min-h-0 p-4">
        <ScrollArea ref={scrollAreaRef} className="h-full w-full">
          <div className="space-y-4 pr-4">
            {chatMessages.map((message) => (
              <div key={message.id} className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] p-3 rounded-lg text-sm relative group", message.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-muted text-muted-foreground mr-8")}>
                  <MessageContent message={message} />
                  {message.role === "assistant" && speechSupported && message.content && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => speakMessage(message.content)}
                      disabled={isSpeaking}
                    >
                      <Volume2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground p-3 rounded-lg text-sm mr-8">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Ask about the paper..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[40px] max-h-[120px] text-sm resize-none"
            disabled={isLoading}
          />

          {/* Voice Controls */}
          <div className="flex gap-1">
            {speechSupported && (
              <>
                {/* Voice Input Button */}
                <Button variant={isListening ? "default" : "outline"} onClick={toggleListening} disabled={isLoading} className={cn("h-[40px] px-3 shrink-0 relative", isListening && "animate-pulse")}>
                  {isListening ? (
                    <>
                      <Send className="size-4" />
                      {/* Voice animation */}
                      <div className="absolute inset-0 rounded-md border-2 border-primary animate-ping opacity-75"></div>
                      <div className="absolute inset-1 rounded-md border border-primary/50 animate-ping opacity-50 animation-delay-75"></div>
                    </>
                  ) : (
                    <Mic className="size-4" />
                  )}
                </Button>

                {/* Stop Speaking Button */}
                {isSpeaking && (
                  <Button variant="outline" onClick={stopSpeaking} className="h-[40px] px-3 shrink-0 relative">
                    <Volume2 className="size-4" />
                    {/* Speaking animation */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </Button>
                )}
              </>
            )}

            {/* Send Button */}
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading} className="h-[40px] px-3 shrink-0">
              <Send className="size-4" />
            </Button>
          </div>
        </div>

        {/* Voice Status Indicator */}
        {isListening && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse"></div>
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse delay-75"></div>
              <div className="w-1 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse delay-200"></div>
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse delay-300"></div>
            </div>
            <span>Listening... Click again to send</span>
          </div>
        )}

        {isSpeaking && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-1 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-3 bg-green-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-1 h-4 bg-green-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-1 h-3 bg-green-500 rounded-full animate-bounce delay-200"></div>
              <div className="w-1 h-2 bg-green-500 rounded-full animate-bounce delay-300"></div>
            </div>
            <span>Speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
