import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Heart, Info, MessageCircle } from "lucide-react";
import { generateAIContent } from "../services/ai";
import toast from "react-hot-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! 🐾 I'm your AdoptSmart AI assistant. Ask me anything about animals, pet care, adoption tips, breeds, or any pet-related questions!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedQuestions = [
    "What should I feed my new puppy?",
    "How do I train a cat to use a litter box?",
    "What are the best dog breeds for apartments?",
    "How often should I take my dog to the vet?",
    "What vaccinations does my pet need?",
    "How can I help my anxious pet?",
  ];

  const handleSend = async (questionText?: string) => {
    const messageText = questionText || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiPrompt =
        `You are a helpful pet care assistant for AdoptSmart, a pet adoption platform. ` +
        `Answer the following question about animals, pets, or pet care in a friendly and informative way:\n\n` +
        messageText;

      const aiResponse = await generateAIContent(aiPrompt);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error("Failed to get AI response. Please try again.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your request. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-800">
              AI Pet Care Assistant
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Get instant answers about pet care, breeds, adoption, and more!
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Info className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Pet Information</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Learn about different breeds, their characteristics, and care requirements.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Care Tips</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Get expert advice on feeding, grooming, training, and health care.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">24/7 Support</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Ask questions anytime and get instant, helpful responses.
            </p>
          </div>
        </div>

        {/* Chat Component */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-semibold">Pet Care Assistant</h2>
                  <p className="text-sm text-orange-100">Ask me anything about pets!</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === "user"
                        ? "bg-blue-500"
                        : "bg-orange-500"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-800 shadow"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white rounded-b-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about pet care, breeds, adoption tips..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Suggested Questions:
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm text-gray-700 transition-colors border border-orange-200"
                onClick={() => handleSend(question)}
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;

