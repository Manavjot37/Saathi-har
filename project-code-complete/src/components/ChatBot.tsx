import React, { useState } from 'react';
import { sendInteraction } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Mic, Send, Loader2 } from 'lucide-react';

// Simple text/voice chatbot UI – placeholder implementation
export function ChatBot({ victimId }: { victimId: string }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<Array<{ from: 'user' | 'bot'; text: string }>>([]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setHistory((h) => [...h, { from: 'user', text: userMsg }]);
    setMessage('');
    setIsSending(true);
    try {
      // Send interaction to backend (text channel)
      await sendInteraction({ victimId, channel: 'chatbot', payload: { text: userMsg } });
      // Placeholder bot reply – real answer will come from AI service later
      const botReply = t('chatbotPlaceholder', { defaultMessage: 'Thank you, we have recorded your response.' });
      setHistory((h) => [...h, { from: 'bot', text: botReply }]);
    } catch (e) {
      console.error(e);
      setHistory((h) => [...h, { from: 'bot', text: t('errorSending', { defaultMessage: 'Sorry, there was an error.' }) }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border p-4 bg-background/50">
      <div className="flex-1 overflow-y-auto mb-2 max-h-48">
        {history.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.from === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-2 py-1 rounded ${msg.from === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded border px-2 py-1"
          placeholder={t('typeYourMessage', { defaultMessage: 'Type your message...' })}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={isSending}
          className="flex items-center justify-center rounded bg-primary p-2 text-primary-foreground disabled:opacity-50"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
