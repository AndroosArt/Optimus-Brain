import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface IdeaElevatorProps {
    onApply: (text: string) => void;
}

export default function IdeaElevator({ onApply }: IdeaElevatorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, content: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/brainstorm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });
            const data = await res.json();

            if (data.reply) {
                setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
            }
        } catch (e) {
            console.error(e);
            setMessages([...newMessages, { role: 'assistant', content: "Network error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-xl shadow-lg border border-gray-700 flex items-center justify-between group hover:scale-[1.01] transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-forest-500 flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs">🧠</span>
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-bold tracking-wide">Elevate Your Idea</span>
                        <span className="text-xs text-gray-400">Consult with Optimus Cortex (GPT-4o)</span>
                    </div>
                </div>
                <span className="text-gray-400 group-hover:text-white transition-colors">Open Chat &rarr;</span>
            </button>
        );
    }

    return (
        <div className="w-full mt-4 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px] animate-fade-in-up">
            {/* Header */}
            <div className="bg-gray-900 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-forest-400">🧠</span>
                    <h3 className="text-white font-bold text-sm tracking-wide">Optimus Cortex // Idea Elevator</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-xs uppercase font-bold">Close</button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-10">
                        <p>Tell me your rough idea.</p>
                        <p className="mt-2 text-xs">I will help you refine it into a technical mission directive.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-gray-200 text-gray-900 rounded-br-none'
                                : 'bg-white border border-gray-200 shadow-sm text-gray-800 rounded-bl-none'
                            }`}>
                            {msg.content}
                            {msg.role === 'assistant' && (
                                <button
                                    onClick={() => onApply(msg.content)}
                                    className="block mt-3 text-xs font-bold text-forest-600 hover:text-forest-700 hover:underline uppercase tracking-wide"
                                >
                                    &crarr; Apply to Mission
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Describe your idea..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-forest-500 outline-none transition-all placeholder:text-gray-400"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-black text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
