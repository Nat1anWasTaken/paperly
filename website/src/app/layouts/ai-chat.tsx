"use client";

import * as React from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
                    "max-w-[85%] p-3 rounded-lg text-sm",
                    message.isUser
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted text-muted-foreground mr-8"
                  )}
                >
                  {message.content}
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
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="h-[40px] px-3 shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 