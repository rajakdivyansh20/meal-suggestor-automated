export default function PrimaryButton({ children, disabled = false, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`primary-button interactive-button ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
