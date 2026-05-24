export default function BentoCard({ title, subtitle, children, className = "", style = {} }) {
  return (
    <section className={`bento-card ${className}`} style={style}>
      {(title || subtitle) && (
        <div className="bento-card-header">
          {title && <h2 className="bento-card-title">{title}</h2>}
          {subtitle && <p className="bento-card-subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
