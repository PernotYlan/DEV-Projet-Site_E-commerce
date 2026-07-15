import { useEffect, useRef, useState } from 'react';
import { api } from '../../api';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je peux vous aider pour votre commande, vos abonnements ou vos questions sur le site.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function envoyer() {
    const texte = input.trim();
    if (!texte) return;

    setMessages((prev) => [...prev, { role: 'user', content: texte }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatbot({ message: texte });
      const reply = res?.reply || 'Je n’ai pas pu répondre pour le moment.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Le service de chatbot est momentanément indisponible.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="chat-widget-toggle" onClick={() => setOpen((v) => !v)} aria-label="Ouvrir le chat">
        💬
        <span>Besoin d’aide ?</span>
      </button>

      {open && (
        <div className="chat-widget">
          <div className="chat-widget__header">
            <strong>Assistant CYNA</strong>
            <button onClick={() => setOpen(false)} aria-label="Fermer le chat">✕</button>
          </div>

          <div className="chat-widget__body">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-bubble chat-bubble--${message.role}`}>
                {message.content}
              </div>
            ))}
            {loading && <div className="chat-bubble chat-bubble--assistant">…</div>}
            <div ref={bottomRef} />
          </div>

          <div className="chat-widget__footer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && envoyer()}
              placeholder="Écrivez votre question..."
            />
            <button onClick={envoyer} disabled={loading}>Envoyer</button>
          </div>
        </div>
      )}
    </>
  );
}
