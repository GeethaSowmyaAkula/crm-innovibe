"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Sparkles, Send, Trash2, Plus, MessageSquare, PanelLeftClose, PanelLeft, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function ChatbotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [greeting, setGreeting] = useState("Hello");

  // Determine dynamic greeting in client effect to prevent hydration mismatch
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good evening");
    } else {
      setGreeting("Hello");
    }
  }, []);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with active empty conversation
  useEffect(() => {
    const saved = localStorage.getItem("innovibe_chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loaded = parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        // Filter out empty chats except the current one if it's empty
        const filtered = loaded.filter((c: any) => c.messages.length > 0);
        if (filtered.length > 0) {
          setConversations(filtered);
          setActiveId(filtered[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to load chats", e);
      }
    }

    const defaultId = Date.now().toString();
    const defaultChat: Conversation = {
      id: defaultId,
      title: "New Chat",
      messages: [],
      createdAt: new Date()
    };
    setConversations([defaultChat]);
    setActiveId(defaultId);
  }, []);

  const saveChats = (updated: Conversation[]) => {
    // Save only chats that actually have messages to keep history clean
    const toSave = updated.filter(c => c.messages.length > 0 || c.id === activeId);
    setConversations(toSave);
    localStorage.setItem("innovibe_chats", JSON.stringify(toSave));
  };

  const activeChat = conversations.find((c) => c.id === activeId);
  const messages = activeChat?.messages || [];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !activeId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    let updatedChats = conversations.map((chat) => {
      if (chat.id === activeId) {
        const updatedMsgs = [...chat.messages, userMessage];
        const newTitle = chat.title === "New Chat" 
          ? (textToSend.length > 25 ? textToSend.substring(0, 25) + "..." : textToSend)
          : chat.title;
        return {
          ...chat,
          title: newTitle,
          messages: updatedMsgs,
        };
      }
      return chat;
    });

    // If active chat is not in the list (e.g. got filtered out), add it
    if (!updatedChats.some(c => c.id === activeId)) {
      const activeEmptyChat = conversations.find(c => c.id === activeId);
      if (activeEmptyChat) {
        updatedChats = [
          {
            ...activeEmptyChat,
            title: textToSend.length > 25 ? textToSend.substring(0, 25) + "..." : textToSend,
            messages: [userMessage]
          },
          ...updatedChats
        ];
      }
    }

    saveChats(updatedChats);
    setInputValue("");
    setIsTyping(true);

    const currentChat = updatedChats.find(c => c.id === activeId);
    const apiMessages = currentChat?.messages || [];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI endpoint.");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "Sorry, I encountered an empty response.",
        timestamp: new Date(),
      };

      updatedChats = updatedChats.map((chat) => {
        if (chat.id === activeId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage],
          };
        }
        return chat;
      });
      saveChats(updatedChats);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `Error: ${err.message || "Failed to fetch response. Please verify your connection configuration."}`,
        timestamp: new Date(),
      };
      updatedChats = updatedChats.map((chat) => {
        if (chat.id === activeId) {
          return {
            ...chat,
            messages: [...chat.messages, errorMessage],
          };
        }
        return chat;
      });
      saveChats(updatedChats);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const handleNewChat = () => {
    // If there is already an empty chat, just activate it
    const existingEmpty = conversations.find(c => c.messages.length === 0);
    if (existingEmpty) {
      setActiveId(existingEmpty.id);
      return;
    }

    const newId = Date.now().toString();
    const newChat: Conversation = {
      id: newId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newId);
  };

  const handleClearActiveChat = () => {
    if (!activeId) return;
    const confirmed = confirm("Are you sure you want to clear the conversation log for this chat?");
    if (confirmed) {
      const updated = conversations.map((chat) => {
        if (chat.id === activeId) {
          return {
            ...chat,
            title: "New Chat",
            messages: [],
          };
        }
        return chat;
      });
      saveChats(updated);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  const suggestedChips = [
    "Customer Lookup",
    "Booking Status",
    "Revenue Health",
    "Partnership Summary",
    "Fleet Status",
    "Generate Report",
  ];

  // Only display real conversations (containing messages)
  const visibleConversations = conversations.filter(c => c.messages.length > 0 || c.id === activeId);

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[550px] border border-slate-200/60 bg-white rounded-2xl overflow-hidden relative shadow-sm">
      
      {/* 1. Collapsible Left Chat History Sidebar */}
      <div
        className={`border-r border-slate-100 flex flex-col shrink-0 transition-all duration-300 ease-in-out bg-slate-50/50 ${
          isSidebarOpen ? "w-[260px]" : "w-0 overflow-hidden"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-150 flex items-center justify-between shrink-0 bg-slate-50/80">
          <span className="text-[10px] font-black tracking-wider text-slate-450 uppercase flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            Conversations
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {visibleConversations.map((chat) => {
            const isActive = chat.id === activeId;
            const hasMsgs = chat.messages.length > 0;
            return (
              <button
                key={chat.id}
                onClick={() => setActiveId(chat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white font-extrabold shadow-sm"
                    : "hover:bg-slate-100 text-slate-700 font-bold"
                }`}
              >
                <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate font-bold leading-snug">{chat.title}</p>
                  <span className={`text-[8px] block mt-0.5 font-bold ${isActive ? "text-white/60" : "text-slate-500"}`}>
                    {hasMsgs ? `${chat.messages.length} messages` : "Empty Chat"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Chat Console panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Chat Console Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 rounded-lg"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-2.5">
              <Bot className="h-5 w-5 text-blue-600 shrink-0" />
              <h2 className="text-sm font-extrabold text-slate-900 leading-none">AI Assistant</h2>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="h-8 flex items-center gap-1.5 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              New Chat
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearActiveChat}
                className="h-8 w-8 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg border border-slate-100 hover:border-red-100 transition-colors"
                title="Clear current chat log"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg border border-slate-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversation Box Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/15">
          {messages.length === 0 ? (
            
            /* 3. Empty Chat State (Vertically & Horizontally Centered) */
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 max-w-2xl mx-auto">
              <div className="space-y-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {greeting}! I'm InnoVibe AI Assistant.
                </h1>
                <p className="text-xs text-slate-550 font-semibold mt-1">
                  How can I assist you today?
                </p>
              </div>

              {/* 4. Suggestion Chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                {suggestedChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSuggestionClick(chip)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-full text-xs font-semibold text-slate-650 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

          ) : (
            
            /* 5. Active Chat Message Bubbles Feed */
            <div className="p-6 space-y-6 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-start gap-3 max-w-[85%]">
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center shrink-0 text-blue-600 text-xs shadow-sm">
                        <Bot className="h-4.5 w-4.5 animate-pulse" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4.5 py-3 text-xs leading-relaxed shadow-sm transition-all duration-200 ${
                        msg.role === "user"
                          ? "bg-blue-50/80 border border-blue-200 text-blue-950 rounded-tr-none font-semibold ml-auto"
                          : "bg-white text-slate-900 border border-slate-200 rounded-tl-none font-medium"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span
                        className={`text-[8px] mt-1.5 block text-right font-semibold ${
                          msg.role === "user" ? "text-blue-600/70" : "text-slate-500"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center shrink-0 text-blue-600 text-xs shadow-sm">
                      <Bot className="h-4.5 w-4.5 animate-pulse" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4.5 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* 6. Input Area Fixed at Bottom */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto space-y-2">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400/20 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the AI Assistant a question..."
                rows={1}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-xs py-2 px-2.5 resize-none outline-none max-h-32 text-slate-800 placeholder:text-slate-400 font-semibold leading-relaxed"
                disabled={isTyping}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0 h-8 w-8 rounded-lg flex items-center justify-center p-0 shadow-sm disabled:opacity-50 active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between px-1.5">
              <p className="text-[9px] text-slate-500 font-semibold">
                Press Enter to send, Shift + Enter for new line.
              </p>
              <p className="text-[9px] text-slate-500 font-bold">
                InnoVibe AI Assistant
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
