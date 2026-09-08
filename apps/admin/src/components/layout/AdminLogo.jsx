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
        <filter id="admin-logo-flat-color" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" result="logo-shape" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 10 0 0 -2" />
          <feFlood floodColor="#096E21" result="brand-green" />
          <feComposite in="brand-green" in2="logo-shape" operator="in" result="flat-logo" />
          <feColorMatrix in="SourceGraphic" result="yellow-mask" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  8 -4 -4 0 0" />
          <feComposite in="SourceGraphic" in2="yellow-mask" operator="in" result="yellow-artwork" />
          <feMerge>
            <feMergeNode in="flat-logo" />
            <feMergeNode in="yellow-artwork" />
          </feMerge>
        </filter>
      </defs>
      <image href={logoSource} width="600" height="204" filter="url(#admin-logo-flat-color)" />
    </svg>
  );
}
