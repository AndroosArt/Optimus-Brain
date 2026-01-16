import { useState, useRef, useEffect } from 'react';

export interface SmartInputProps {
    onEvaluate: (finalDirective: string) => void;
    initialValue?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function SmartDirectiveInput({ onEvaluate, initialValue = '' }: SmartInputProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState(initialValue);
    const [loading, setLoading] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Bold Parsing Helper
    const formatMessage = (text: string) => {
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        // Regex matches **text** or *text*
        // Captures: 1=delimiter (* or **), 2=content
        const regex = /(\*{1,2})(.*?)\1/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Text before match
            if (match.index > lastIndex) {
                elements.push(text.substring(lastIndex, match.index));
            }
            // Bold text (render * or ** as bold)
            // match[2] is the content
            if (match[2]) {
                elements.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
            }
            lastIndex = regex.lastIndex;
        }
        // Remaining text
        if (lastIndex < text.length) {
            elements.push(text.substring(lastIndex));
        }
        return elements.length > 0 ? elements : text;
    };

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
            setMessages([...newMessages, { role: 'assistant', content: "I'm having trouble connecting. Try again?" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluateClick = async () => {
        if (messages.length === 0 && !input.trim()) return;

        setIsCompiling(true);
        const contextMessages = input.trim()
            ? [...messages, { role: 'user' as const, content: input }]
            : messages;

        if (contextMessages.length === 1 && contextMessages[0].role === 'user') {
            onEvaluate(contextMessages[0].content);
            return;
        }

        try {
            const res = await fetch('/api/brainstorm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...contextMessages,
                        { role: 'system', content: 'SUMMARIZE the user\'s intent from this conversation into a single, concise, technical Mission Directive. Output ONLY the directive.' }
                    ]
                })
            });
            const data = await res.json();
            if (data.reply) {
                onEvaluate(data.reply);
            } else {
                onEvaluate(contextMessages.filter(m => m.role === 'user').map(m => m.content).join('\n'));
            }
        } catch (e) {
            onEvaluate(contextMessages.filter(m => m.role === 'user').map(m => m.content).join('\n'));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const containerClasses = "border-amber-400/30 shadow-[0_0_60px_-15px_rgba(251,191,36,0.3)] dark:shadow-[0_0_60px_-15px_rgba(251,191,36,0.15)]";

    return (
        <div className={`relative bg-white dark:bg-zinc-900 rounded-3xl border transition-all duration-500 overflow-hidden flex flex-col min-h-[500px] max-h-[70vh] w-full font-sans ${containerClasses}`}>
            {/* Header */}
            <div className={`p-4 border-b flex justify-between items-center transition-colors duration-500 bg-amber-50/50 dark:bg-zinc-900/50 border-amber-100/50 dark:border-zinc-800`}>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    <span className="text-xs font-bold tracking-widest uppercase text-amber-700 dark:text-amber-500">
                        Mission Control
                    </span>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={() => setMessages([])}
                        className="text-[10px] text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 font-bold uppercase transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-zinc-900 scroll-smooth cursor-text font-sans" onClick={() => document.getElementById('main-input')?.focus()}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
                        {/* Empty State */}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap font-sans ${msg.role === 'user'
                            ? 'bg-black dark:bg-zinc-800 text-white rounded-br-sm'
                            : 'bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                            }`}>
                            {formatMessage(msg.content)}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 p-4 rounded-2xl rounded-bl-sm shadow-sm flex gap-2 items-center">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
                <div className="relative">
                    <textarea
                        id="main-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={messages.length === 0 ? "e.g. Build a CRM for real estate agents..." : "Reply..."}
                        className="w-full pl-5 pr-24 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-zinc-700 shadow-sm focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 transition-all resize-none min-h-[60px] max-h-[120px] bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-sans"
                        rows={1}
                    />

                    <div className="absolute right-3 bottom-2 flex items-center gap-1">
                        {/* Subtle Evaluate Button (Magic Wand) */}
                        <button
                            onClick={handleEvaluateClick}
                            disabled={isCompiling || (messages.length === 0 && !input.trim())}
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group"
                            title="Evaluate Outcome"
                        >
                            {isCompiling ? (
                                <span className="w-5 h-5 block border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            )}
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className={`p-2 rounded-xl transition-all shadow-md active:scale-95 ${input.trim()
                                ? 'bg-forest-500 hover:bg-forest-600 text-white shadow-forest-500/25'
                                : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500'
                                }`}
                        >
                            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
