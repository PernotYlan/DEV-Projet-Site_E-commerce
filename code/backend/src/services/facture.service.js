const PDFDocument = require('pdfkit');

/** Couleurs de la charte CYNA. */
const ROSE = '#E49AB0';
const NOIR = '#000000';
const GRIS = '#6b7a82';
const ARDOISE = '#5D737E';

/** Formate un montant en euros (ex: "299,00 €"). */
function euros(montant) {
  return `${Number(montant).toFixed(2).replace('.', ',')} €`;
}

/** Formate une date ISO en français (ex: "12 juillet 2026"). */
function dateFr(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Génère la facture PDF d'une commande payée.
 * @param {object} commande - Commande avec ses lignes, numero_facture, adresse_snapshot...
 * @param {{nom: string, prenom: string, email: string}} utilisateur - Client facturé
 * @returns {Promise<Buffer>} Contenu du PDF
 */
function genererFacturePdf(commande, utilisateur) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const morceaux = [];
    doc.on('data', (chunk) => morceaux.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(morceaux)));
    doc.on('error', reject);

    // En-tête
    doc.fillColor(NOIR).fontSize(24).font('Helvetica-Bold').text('CYNA', 50, 50);
    doc.fillColor(ARDOISE).fontSize(9).font('Helvetica').text('10 rue de Penthièvre, 75008 Paris — SIRET 913 711 032 00015', 50, 78);

    doc.fillColor(ROSE).fontSize(18).font('Helvetica-Bold').text('FACTURE', 400, 50, { align: 'right' });
    doc.fillColor(NOIR).fontSize(10).font('Helvetica').text(commande.numero_facture, 400, 74, { align: 'right' });
    doc.fillColor(GRIS).fontSize(9).text(dateFr(commande.cree_le), 400, 88, { align: 'right' });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#e3e9e6').stroke();

    // Adresse de facturation
    const adresse = commande.adresse_snapshot || {};
    doc.fillColor(GRIS).fontSize(9).font('Helvetica-Bold').text('FACTURÉ À', 50, 135);
    doc.fillColor(NOIR).fontSize(10).font('Helvetica')
      .text(`${adresse.prenom || utilisateur.prenom} ${adresse.nom || utilisateur.nom}`, 50, 150)
      .text(adresse.adresse_ligne1 || '', 50, 165)
      .text(adresse.adresse_ligne2 || '', 50, adresse.adresse_ligne2 ? 180 : 165)
      .text(`${adresse.code_postal || ''} ${adresse.ville || ''}`, 50, adresse.adresse_ligne2 ? 195 : 180)
      .text(adresse.pays || '', 50, adresse.adresse_ligne2 ? 210 : 195)
      .text(utilisateur.email, 50, adresse.adresse_ligne2 ? 225 : 210);

    // Tableau des lignes
    let y = 260;
    doc.fillColor('#ffffff').rect(50, y, 495, 24).fill(NOIR);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      .text('SERVICE', 60, y + 7)
      .text('ABONNEMENT', 280, y + 7)
      .text('QTÉ', 390, y + 7, { width: 30, align: 'right' })
      .text('TOTAL HT', 445, y + 7, { width: 90, align: 'right' });
    y += 24;

    doc.font('Helvetica').fontSize(10);
    for (const ligne of commande.lignes) {
      doc.fillColor(NOIR)
        .text(ligne.produit_nom, 60, y + 8, { width: 210 })
        .fillColor(GRIS).text(ligne.type_abonnement, 280, y + 8)
        .fillColor(NOIR).text(String(ligne.quantite), 390, y + 8, { width: 30, align: 'right' })
        .text(euros(ligne.prix_total_ht), 445, y + 8, { width: 90, align: 'right' });
      doc.moveTo(50, y + 28).lineTo(545, y + 28).strokeColor('#e3e9e6').stroke();
      y += 28;
    }

    // Totaux
    y += 15;
    const ligneTotale = (label, valeur, gras) => {
      doc.font(gras ? 'Helvetica-Bold' : 'Helvetica').fontSize(gras ? 12 : 10).fillColor(NOIR)
        .text(label, 350, y, { width: 100 })
        .text(valeur, 445, y, { width: 90, align: 'right' });
      y += gras ? 22 : 18;
    };
    ligneTotale('Total HT', euros(commande.total_ht));
    ligneTotale(`TVA (${Number(commande.taux_tva)}%)`, euros(commande.total_ttc - commande.total_ht));
    doc.moveTo(350, y).lineTo(545, y).strokeColor(NOIR).stroke();
    y += 8;
    ligneTotale('Total TTC', euros(commande.total_ttc), true);

    if (commande.carte_derniers_chiffres) {
      doc.fontSize(9).fillColor(GRIS).font('Helvetica')
        .text(`Payé par carte se terminant par ${commande.carte_derniers_chiffres}`, 50, y + 10);
    }

    // Pied de page
    doc.fontSize(8).fillColor(GRIS).font('Helvetica')
      .text('CYNA — Solutions SaaS de cybersécurité (SOC, EDR, XDR). TVA non applicable, art. 293 B du CGI le cas échéant.', 50, 760, {
        width: 495,
        align: 'center',
      });

    doc.end();
  });
}

module.exports = { genererFacturePdf };
