"use client";

import * as React from "react";
import { Bot, Send, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function AiChat() {
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    {
      id: "1",
      content:
        "Hello! I'm here to help you understand this research paper. Feel free to ask me any questions about the content, methodology, or findings.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isListening, setIsListening] = React.useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = React.useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = React.useState<boolean>(false);
  
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const synthRef = React.useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

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
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "I understand your question about the paper. Let me analyze the content and provide you with a detailed response based on the research findings.",
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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
        <p className="text-xs text-muted-foreground mt-1">
          Ask questions about this research paper
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 min-h-0 p-4">
        <ScrollArea className="h-full w-full">
          <div className="space-y-4 pr-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  message.isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] p-3 rounded-lg text-sm relative group",
                    message.isUser
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted text-muted-foreground mr-8"
                  )}
                >
                  {message.content}
                  {!message.isUser && speechSupported && (
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
                <Button
                  variant={isListening ? "default" : "outline"}
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={cn(
                    "h-[40px] px-3 shrink-0 relative",
                    isListening && "animate-pulse"
                  )}
                >
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
                  <Button
                    variant="outline"
                    onClick={stopSpeaking}
                    className="h-[40px] px-3 shrink-0 relative"
                  >
                    <Volume2 className="size-4" />
                    {/* Speaking animation */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </Button>
                )}
              </>
            )}
            
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="h-[40px] px-3 shrink-0"
            >
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