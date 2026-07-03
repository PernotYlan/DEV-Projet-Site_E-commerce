/**
 * Fenêtre modale simple. Se ferme au clic sur le fond.
 * @param {{titre: string, onClose: Function}} props
 */
export default function Modal({ titre, onClose, children }) {
  return (
    <div className="modal-fond" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {titre && <h2>{titre}</h2>}
        {children}
      </div>
    </div>
  );
}
