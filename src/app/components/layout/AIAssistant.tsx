import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { useAskAssistant } from '../lib/api-hooks';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Ola! Sou o assistente IA do Electro Time. Posso ajudar com questoes sobre presenças, escalas, contratos, folha de salario e muito mais. Como posso ajudar?',
};

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const askMut = useAskAssistant();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, askMut.isPending]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || askMut.isPending) return;
    setInput('');

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    try {
      const res: any = await askMut.mutateAsync({ pergunta: text });
      const reply =
        res?.resposta ?? res?.response ?? res?.answer ?? res?.message ??
        (typeof res === 'string' ? res : JSON.stringify(res));
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Nao foi possivel processar a resposta. Verifique a ligacao e tente novamente.',
      }]);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clear = () => setMessages([WELCOME]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40"
            title="Assistente IA"
          >
            <Sparkles className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-6 right-6 z-50 flex h-[540px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-none">Assistente IA</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Electro Time</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clear} title="Limpar conversa"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                      <User className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {askMut.isPending && (
                <div className="flex gap-2 justify-start">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {[0, 120, 240].map(d => (
                        <div key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex-shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-input-background px-3 py-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Pergunte algo..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || askMut.isPending}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {askMut.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
