import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CookieConsentBanner from './CookieConsentBanner';
import ChatWidget from '../chat/ChatWidget';
import { MOCK } from '../../api';

/** Gabarit commun : header + contenu de la page + footer. */
export default function Layout() {
  return (
    <>
      {MOCK && (
        <div className="bandeau-demo">
          Mode démonstration — données fictives, aucune connexion au serveur requise
        </div>
      )}
      <Header />
      <main>
        <Outlet />
      </main>
      <CookieConsentBanner />
      <ChatWidget />
      <Footer />
    </>
  );
}
