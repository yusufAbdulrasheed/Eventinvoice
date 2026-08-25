export default function Icon({ name, size = 20, filled = false, className = "", style, ...props }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}`, ...style }}
      {...props}
    >
      {name}
    </span>
  );
}
