/**
 * Bouton réutilisable.
 * @param {{variante?: 'noir'|'rose'|'contour'|'danger', petit?: boolean, bloc?: boolean}} props
 */
export default function Button({ variante = 'noir', petit, bloc, className = '', children, ...props }) {
  const classes = [
    'btn',
    variante === 'rose' && 'btn-rose',
    variante === 'contour' && 'btn-contour',
    variante === 'danger' && 'btn-danger',
    petit && 'btn-petit',
    bloc && 'btn-bloc',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
