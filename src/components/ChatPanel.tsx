import { useCallback, useEffect, useRef, useState } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { 
  listMessages, 
  sendChatMessage, 
  subscribeMessages, 
  type ChatMessageDTO 
} from "@/lib/adminPortalClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ChatPanelProps {
  requestId: string;
  customerName?: string;
  providerName?: string;
}

const ChatPanel = ({ requestId, customerName, providerName }: ChatPanelProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await listMessages(requestId);
      setMessages(data);
    } catch (e) {
      console.error("Failed to load chat messages:", e);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadMessages();
    const subscription = subscribeMessages(requestId, () => {
      void loadMessages();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requestId, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      await sendChatMessage(requestId, inputText.trim());
      setInputText("");
      // loadMessages will be called by realtime subscription
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Chat d'intervention</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              ID: {requestId.slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <User className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    isMe ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-3 py-2 rounded-2xl text-sm shadow-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none border"
                    )}
                  >
                    {msg.message_type === "audio" ? (
                      <div className="flex items-center gap-2 italic">
                        <span className="text-xs">[Message audio]</span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {format(new Date(msg.created_at), "HH:mm", { locale: fr })}
                  </span>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t bg-muted/10 flex gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 rounded-xl h-10 border-muted-foreground/20"
          disabled={sending}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-xl shrink-0 h-10 w-10 shadow-glow"
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
