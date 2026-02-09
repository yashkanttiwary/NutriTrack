
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, DailyLog, ChatMessage } from '../types';
import { getChatHistory, saveChatMessage } from '../services/db';
import { chatWithAI } from '../services/aiHelper';
import { useToast } from '../contexts/ToastContext';

interface AIGuidanceProps {
  userProfile: UserProfile;
  dailyLog: DailyLog;
}

export const AIGuidance: React.FC<AIGuidanceProps> = ({ userProfile, dailyLog }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function loadHistory() {
      const history = await getChatHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
        const initialMsg: ChatMessage = {
          role: 'model',
          text: `Hi ${userProfile.name}! I'm your nutrition coach. I see your goal is to ${userProfile.goal.toLowerCase()}. Ask me anything!`,
          timestamp: Date.now()
        };
        saveChatMessage('model', initialMsg.text);
        setMessages([initialMsg]);
      }
    }
    loadHistory();
  }, [userProfile.name]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsgText = input.trim();
    setInput('');
    
    const userMsg: ChatMessage = { role: 'user', text: userMsgText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      await saveChatMessage('user', userMsgText);

      // Construct context for the AI
      const contextPrompt = `
        User Context:
        Name: ${userProfile.name}
        Goal: ${userProfile.goal}
        Targets: ${userProfile.targets.calories}kcal (${userProfile.targets.protein}g P)
        Today's Log: ${Math.round(dailyLog.totalNutrients.calories)}kcal eaten.
        Remaining: ${Math.round(userProfile.targets.calories - dailyLog.totalNutrients.calories)}kcal.
        
        Question: ${userMsgText}
      `;

      const replyText = await chatWithAI(contextPrompt, messages);
      
      await saveChatMessage('model', replyText);
      setMessages(prev => [...prev, { role: 'model', text: replyText, timestamp: Date.now() }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = "I'm having trouble connecting.";
      
      if (error.message?.includes("API_KEY")) {
        errorMsg = "Please connect your API Key in Profile settings first.";
        showToast("API Key required", "error");
      }
      
      setMessages(prev => [...prev, { role: 'model', text: errorMsg, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary to-green-600 rounded-full shadow-xl flex items-center justify-center text-white z-[90] hover:scale-110 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-primary font-bold">AI</div>
                <div>
                   <h3 className="font-bold text-gray-900">Nutrition Coach</h3>
                   <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs text-gray-500 font-medium">Online</span>
                   </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#FAFAFA]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                 <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-50">
               <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your diet..."
                    className="flex-1 p-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
                 />
                 <button 
                   onClick={handleSend}
                   disabled={!input.trim() || loading}
                   className="p-4 bg-primary text-white rounded-2xl disabled:opacity-50 hover:bg-green-600 transition-colors"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
