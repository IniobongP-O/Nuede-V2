import logoSource from "../../assets/nuede-admin-logo-source.png";

export function AdminLogo({ className = "" }) {
  return (
    <svg
      aria-label="Nuede"
      role="img"
      viewBox="0 0 600 204"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="admin-logo-background-key" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  4 4 4 0 -2" />
        </filter>
      </defs>
      <image href={logoSource} width="600" height="204" filter="url(#admin-logo-background-key)" />
    </svg>
  );
}
