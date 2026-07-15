/**
 * Extrait le message d'erreur d'une requête axios en responseType: 'blob'
 * (le corps JSON { error } arrive alors sous forme de Blob, pas déjà parsé).
 */
export async function messageErreurBlob(err, messageParDefaut) {
  const blobErreur = err?.response?.data;
  if (blobErreur instanceof Blob) {
    try {
      const { error } = JSON.parse(await blobErreur.text());
      if (error) return error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return messageParDefaut;
}

/** Déclenche le téléchargement d'un Blob dans le navigateur. */
export function telechargerBlob(blob, nomFichier) {
  const url = window.URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}
