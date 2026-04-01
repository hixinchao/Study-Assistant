import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, GraduationCap, Sparkles, BookOpen, Info } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
};

// --- Constants ---
const SUGGESTED_QUESTIONS = [
  "Phương pháp học tốt môn Triết học Mác - Lênin?",
  "Làm sao để đăng ký học phần tín chỉ hiệu quả?",
  "Cách tính điểm rèn luyện sinh viên DThU?",
  "Gợi ý tài liệu ôn thi môn Tiếng Anh cơ bản?",
];

const SYSTEM_INSTRUCTION = `Bạn là DThU Assistant - Trợ lý học tập AI thông minh và thân thiện dành riêng cho sinh viên trường Đại học Đồng Tháp (DThU).
Nhiệm vụ của bạn:
1. Giải đáp các câu hỏi về kiến thức các môn học đại cương và chuyên ngành.
2. Tư vấn phương pháp học tập hiệu quả ở bậc đại học.
3. Hỗ trợ thông tin chung về quy chế đào tạo, chuẩn đầu ra, kỹ năng mềm.
Lưu ý quan trọng:
- Với các thông tin mang tính cá nhân hoặc thay đổi liên tục (lịch thi cụ thể, học phí, điểm số cá nhân), hãy hướng dẫn sinh viên truy cập trang web chính thức của trường (dthu.edu.vn), cổng thông tin sinh viên, hoặc liên hệ trực tiếp Phòng Đào tạo.
- Luôn trả lời bằng tiếng Việt, thái độ hòa nhã, tôn trọng và khích lệ tinh thần học tập của sinh viên.
- Trình bày câu trả lời rõ ràng, mạch lạc, sử dụng markdown để định dạng (in đậm, danh sách, bảng biểu nếu cần).`;

// --- Components ---
export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Initialize Gemini Chat
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !chatRef.current) return;

    const userMsgId = Date.now().toString();
    const modelMsgId = (Date.now() + 1).toString();

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text.trim() },
      { id: modelMsgId, role: 'model', content: '', isStreaming: true },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const responseStream = await chatRef.current.sendMessageStream({
        message: text.trim(),
      });

      for await (const chunk of responseStream) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMsgId
              ? { ...msg, content: msg.content + (chunk.text || '') }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === modelMsgId
            ? {
                ...msg,
                content:
                  'Xin lỗi, đã có lỗi xảy ra trong quá trình kết nối. Vui lòng thử lại sau.',
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-[#0056A3] text-white p-4 shadow-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full text-[#0056A3]">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DThU Study Assistant</h1>
            <p className="text-sm text-blue-100 opacity-90">Trợ lý học tập sinh viên Đại học Đồng Tháp</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-blue-200 text-sm bg-blue-800/50 px-3 py-1.5 rounded-full">
          <Sparkles size={16} />
          <span>Powered by Gemini AI</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 w-full flex flex-col items-center">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-4xl">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-lg w-full">
              <div className="w-16 h-16 bg-blue-100 text-[#0056A3] rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Xin chào DThU-er! 👋</h2>
              <p className="text-slate-600 mb-6">
                Mình là trợ lý học tập AI dành riêng cho sinh viên Đại học Đồng Tháp. Mình có thể giúp bạn giải đáp bài tập, tư vấn phương pháp học, hoặc tìm hiểu thông tin về trường.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="flex items-start gap-2 p-3 text-sm text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-[#0056A3] border border-slate-200 rounded-xl transition-colors text-left"
                  >
                    <BookOpen size={16} className="mt-0.5 shrink-0" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Info size={16} />
              <span>AI có thể mắc sai lầm. Hãy kiểm tra lại các thông tin quan trọng.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4 w-full max-w-4xl">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-sm",
                    msg.role === 'user'
                      ? "bg-[#0056A3] text-white"
                      : "bg-white border border-slate-200 text-[#0056A3]"
                  )}
                >
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                
                <div
                  className={cn(
                    "px-5 py-3.5 rounded-2xl shadow-sm",
                    msg.role === 'user'
                      ? "bg-[#0056A3] text-white rounded-tr-sm"
                      : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                  )}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-sm sm:prose-base max-w-none prose-blue">
                      {msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex items-center gap-1 h-6">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#0056A3] transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn (Shift + Enter để xuống dòng)..."
              className="w-full max-h-32 min-h-[56px] bg-transparent p-4 outline-none resize-none text-slate-700 placeholder:text-slate-400"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="h-14 w-14 shrink-0 bg-[#0056A3] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm"
          >
            <Send size={20} className={cn("ml-1", input.trim() && !isLoading && "animate-pulse")} />
          </button>
        </div>
        <div className="text-center mt-3 text-xs text-slate-400">
          DThU Study Assistant có thể cung cấp thông tin không chính xác. Hãy luôn kiểm chứng với tài liệu chính thức của trường.
        </div>
      </div>
    </div>
  );
}
