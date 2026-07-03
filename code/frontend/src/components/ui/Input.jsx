/**
 * Champ de formulaire avec label et message d'erreur optionnel.
 * @param {{label: string, erreur?: string}} props
 */
export default function Input({ label, erreur, id, ...props }) {
  const champId = id || props.name;
  return (
    <div className="champ">
      {label && <label htmlFor={champId}>{label}</label>}
      <input id={champId} {...props} />
      {erreur && <p className="champ-erreur">{erreur}</p>}
    </div>
  );
}
