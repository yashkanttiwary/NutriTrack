import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { UserProfile, DailyLog } from '../types';

interface AIGuidanceProps {
  apiKey: string;
  userProfile: UserProfile;
  dailyLog: DailyLog;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIGuidance: React.FC<AIGuidanceProps> = ({ apiKey, userProfile, dailyLog }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${userProfile.name}! I'm your nutrition coach. How can I help you reach your goal to ${userProfile.goal.toLowerCase()}?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Construct context
      const context = `
        User Profile:
        Name: ${userProfile.name}
        Goal: ${userProfile.goal}
        Stats: ${userProfile.age}yo, ${userProfile.heightCm}cm, ${userProfile.weightKg}kg.
        
        Today's Log:
        Calories: ${dailyLog.totalNutrients.calories} / ${dailyLog.targets.calories}
        Protein: ${dailyLog.totalNutrients.protein}g / ${dailyLog.targets.protein}g
        Meals: ${dailyLog.meals.map(m => m.mealType + ': ' + m.items.map(i => i.portionLabel).join(', ')).join(' | ')}
        
        Question: ${userMsg}
        
        Answer as a friendly, concise nutrition coach. Keep answers under 3 sentences unless asked for detail.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: context }] }],
      });

      const reply = response.text || "I'm having trouble thinking right now. Try again?";
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please check your API key or internet." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary to-green-600 rounded-full shadow-xl flex items-center justify-center text-white z-[90] hover:scale-110 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10">
            
            {/* Header */}
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

            {/* Messages */}
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

            {/* Input */}
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