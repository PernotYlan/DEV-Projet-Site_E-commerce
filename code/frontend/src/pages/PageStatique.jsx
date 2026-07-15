/** Pages légales statiques (mentions légales, CGU). */
export function MentionsLegales() {
  return (
    <div className="conteneur" style={{ maxWidth: 760 }}>
      <div className="carte-bloc" style={{ marginTop: 30 }}>
        <h2>Mentions légales</h2>
        <p>
          <strong>CYNA-IT</strong> — 10 rue de Penthièvre, 75008 Paris<br />
          SIRET : 913 711 032 00015<br />
          Site : www.cyna-it.fr
        </p>
        <p style={{ marginTop: 12 }}>
          Hébergement : plateforme hébergée dans l’Union européenne.
          Pour toute question relative à vos données personnelles (RGPD),
          contactez-nous via la page Contact.
        </p>
      </div>
    </div>
  );
}

/** Conditions générales d'utilisation. */
export function CGU() {
  return (
    <div className="conteneur" style={{ maxWidth: 760 }}>
      <div className="carte-bloc" style={{ marginTop: 30 }}>
        <h2>Conditions Générales d’Utilisation</h2>
        <p>
          L’utilisation de la plateforme CYNA implique l’acceptation des présentes conditions.
          Les services SaaS proposés (SOC, EDR, XDR) font l’objet d’abonnements mensuels,
          semestriels ou annuels, résiliables à tout moment depuis l’espace client
          (la résiliation prend effet à la fin de la période en cours).
        </p>
        <p style={{ marginTop: 12 }}>
          Les paiements sont traités de manière sécurisée par notre prestataire Stripe.
          Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de
          suppression de vos données personnelles.
        </p>
      </div>
    </div>
  );
}

/** Politique de confidentialité conforme aux exigences RGPD. */
export function PolitiqueConfidentialite() {
  return (
    <div className="conteneur" style={{ maxWidth: 760 }}>
      <div className="carte-bloc" style={{ marginTop: 30 }}>
        <h2>Politique de confidentialité</h2>
        <p>
          CYNA traite vos données personnelles pour fournir les services demandés, gérer votre compte,
          sécuriser les paiements, prévenir la fraude et améliorer l’expérience utilisateur.
        </p>
        <p style={{ marginTop: 12 }}>
          Les données collectées peuvent inclure votre prénom, nom, adresse e-mail, adresse de livraison ou de facturation,
          informations de paiement via Stripe, et le contenu de vos messages de contact.
        </p>
        <p style={{ marginTop: 12 }}>
          Nous n’utilisons des cookies que pour les besoins strictement nécessaires au fonctionnement du site,
          ainsi que pour la personnalisation, l’analyse et l’amélioration de l’expérience, avec votre consentement.
        </p>
        <p style={{ marginTop: 12 }}>
          Vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition, de limitation et de
          portabilité de vos données. Pour les exercer, contactez-nous via la page Contact ou demandez la suppression
          de votre compte depuis l’espace personnel.
        </p>
      </div>
    </div>
  );
}
