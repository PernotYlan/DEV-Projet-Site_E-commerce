import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/** Réponses automatiques du chatbot (côté front, pas d'IA). */
function reponseChatbot(message) {
  const texte = message.toLowerCase();
  if (texte.includes('abonnement')) {
    return 'Pour modifier ou résilier un abonnement, rendez-vous dans Mon Compte > Abonnements.';
  }
  if (texte.includes('paiement') || texte.includes('carte') || texte.includes('payer')) {
    return 'Nous acceptons Visa, Mastercard et American Express. Les paiements sont sécurisés par Stripe.';
  }
  if (texte.includes('humain') || texte.includes('conseiller') || texte.includes('agent')) {
    return 'Votre message a été transmis à notre équipe, un conseiller vous recontactera rapidement.';
  }
  return 'Message reçu ! Notre équipe vous répondra sous 24h.';
}

/** Page contact : formulaire classique + chatbot "Contact Me". */
export default function Contact() {
  const { user } = useAuth();

  const [formulaire, setFormulaire] = useState({ email: user?.email || '', sujet: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');

  const [chatOuvert, setChatOuvert] = useState(false);
  const [messages, setMessages] = useState([
    { de: 'bot', texte: 'Bonjour 👋 Je suis l’assistant CYNA. Posez-moi votre question !' },
  ]);
  const [saisieChat, setSaisieChat] = useState('');
  const finMessages = useRef(null);

  // Fait défiler le chat vers le dernier message
  useEffect(() => {
    finMessages.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOuvert]);

  /** Envoie le formulaire de contact. */
  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    try {
      await api.contact(formulaire);
      setEnvoye(true);
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur lors de l’envoi du message.');
    }
  }

  /** Envoie un message au chatbot : POST API + réponse automatique locale. */
  async function envoyerChat(e) {
    e.preventDefault();
    const texte = saisieChat.trim();
    if (!texte) return;
    setSaisieChat('');
    setMessages((courants) => [...courants, { de: 'user', texte }]);
    api.chatbot({ email: user?.email || 'visiteur@cyna-it.fr', message: texte }).catch(() => {});
    setTimeout(() => {
      setMessages((courants) => [...courants, { de: 'bot', texte: reponseChatbot(texte) }]);
    }, 600);
  }

  return (
    <div className="conteneur" style={{ maxWidth: 640 }}>
      <h1 className="section-titre">Nous contacter</h1>

      <div className="carte-bloc">
        {envoye ? (
          <p className="message-succes">
            ✅ Votre message a bien été envoyé. Notre équipe vous répondra dans les plus brefs délais.
          </p>
        ) : (
          <form onSubmit={soumettre}>
            {erreur && <p className="message-erreur">{erreur}</p>}
            <Input label="Votre email" type="email" required value={formulaire.email}
              onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })} />
            <Input label="Sujet (optionnel)" value={formulaire.sujet}
              onChange={(e) => setFormulaire({ ...formulaire, sujet: e.target.value })} />
            <div className="champ">
              <label htmlFor="message">Message</label>
              <textarea id="message" rows="6" required value={formulaire.message}
                onChange={(e) => setFormulaire({ ...formulaire, message: e.target.value })} />
            </div>
            <Button type="submit" variante="rose">Envoyer</Button>
          </form>
        )}
      </div>

      {/* Bouton flottant du chatbot */}
      {!chatOuvert && (
        <Button variante="rose" className="chatbot-bouton" onClick={() => setChatOuvert(true)}>
          💬 Contact Me
        </Button>
      )}

      {/* Fenêtre de chat */}
      {chatOuvert && (
        <div className="chatbot-fenetre" role="dialog" aria-label="Assistant CYNA">
          <div className="chatbot-entete">
            <span>Assistant CYNA</span>
            <button onClick={() => setChatOuvert(false)} aria-label="Fermer">✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`bulle ${m.de === 'user' ? 'bulle-user' : 'bulle-bot'}`}>
                {m.texte}
              </div>
            ))}
            <div ref={finMessages} />
          </div>
          <form className="chatbot-saisie" onSubmit={envoyerChat}>
            <input
              value={saisieChat}
              onChange={(e) => setSaisieChat(e.target.value)}
              placeholder="Votre question…"
              aria-label="Votre question"
            />
            <button type="submit" aria-label="Envoyer">➤</button>
          </form>
        </div>
      )}
    </div>
  );
}
