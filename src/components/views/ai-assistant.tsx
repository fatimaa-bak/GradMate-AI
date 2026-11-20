"use client";

import { useState, useEffect, useRef } from "react";
import { useLang } from "@/lib/lang-store";
import { useAiAssistant } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Plus, MessageSquare, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  activeProjectId: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export function AiAssistantView({ activeProjectId }: Props) {
  const { t } = useLang();
  const assistant = useAiAssistant();
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "" }]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Compute display messages with welcome fallback (no setState in effect)
  const displayMessages: Message[] = messages.length === 0 || (messages.length === 1 && messages[0].role === "assistant" && !messages[0].content)
    ? [{ role: "assistant", content: t.assistant.welcome }]
    : messages;

  async function send(text?: string) {
    const content = (text || input).trim();
    if (!content || assistant.isPending) return;
    const userMsg: Message = { role: "user", content, createdAt: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    try {
      const res = await assistant.mutateAsync({
        message: content,
        conversationId,
        projectId: activeProjectId,
      });
      setConversationId(res.conversationId);
      setMessages([...next, { role: "assistant", content: res.reply, createdAt: new Date().toISOString() }]);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function newConversation() {
    setMessages([{ role: "assistant", content: "" }]);
    setConversationId(null);
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-6 h-[calc(100vh-4rem)] flex flex-col max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6 text-primary" />{t.assistant.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.assistant.subtitle}</p>
        </div>
        <Button variant="outline" onClick={newConversation} className="gap-2">
          <Plus className="h-4 w-4" />{t.assistant.newConversation}
        </Button>
      </div>

      {/* Suggestions */}
      {displayMessages.length <= 1 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">{t.assistant.suggestions}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {t.assistant.suggestedQuestions.map((q: string, i: number) => (
              <button key={i} onClick={() => send(q)} className="text-start rounded-lg border bg-card p-3 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-gold mt-0.5 shrink-0" />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4 bg-muted/20">
          {displayMessages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={cn(
                "max-w-[75%] rounded-2xl p-3.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-card border rounded-tl-sm"
              )}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {assistant.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-card border rounded-2xl rounded-tl-sm p-3.5 flex gap-1">
                <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
                <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/50" />
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.assistant.placeholder}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={assistant.isPending}
              className="flex-1"
            />
            <Button onClick={() => send()} disabled={assistant.isPending || !input.trim()} className="bg-primary">
              <Send className="h-4 w-4 rtl:rotate-180" />
              {t.assistant.send}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
