import React from "react";

type IconProps = { className?: string; title?: string };

/** Inline SVG icons (no external deps). */
export function FaUndo({ className, title }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M255.5 8c-66.3 0-126 26.9-169.3 70.2L48 40.1V176c0 13.3 10.7 24 24 24h135.9l-50.5-50.5c26.5-26.5 61.6-41.1 98.1-41.1 76.4 0 138.5 62.1 138.5 138.5S331.9 385.4 255.5 385.4H144c-13.3 0-24 10.7-24 24v54.6c0 13.3 10.7 24 24 24h111.5c132 0 239-107 239-239S387.5 8 255.5 8z"
      />
    </svg>
  );
}

export function FaRedo({ className, title }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M256.5 8c66.3 0 126 26.9 169.3 70.2L464 40.1V176c0 13.3-10.7 24-24 24H304.1l50.5-50.5c-26.5-26.5-61.6-41.1-98.1-41.1-76.4 0-138.5 62.1-138.5 138.5s62.1 138.5 138.5 138.5H368c13.3 0 24 10.7 24 24v54.6c0 13.3-10.7 24-24 24H256.5c-132 0-239-107-239-239S124.5 8 256.5 8z"
      />
    </svg>
  );
}

export function FaPrint({ className, title }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M128 0h256v128H128V0zm320 192H64c-35.3 0-64 28.7-64 64v128c0 35.3 28.7 64 64 64h64v64h256v-64h64c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64zM384 480H128V320h256v160zm48-224c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"
      />
    </svg>
  );
}

export function FaFileExport({ className, title }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M320 0H128C92.7 0 64 28.7 64 64v384c0 35.3 28.7 64 64 64h192c35.3 0 64-28.7 64-64V160L320 0zm32 448c0 17.7-14.3 32-32 32H128c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32h160v128h128v288z"
      />
      <path
        fill="currentColor"
        d="M361 289l-49-49c-9.4-9.4-24.6-9.4-33.9 0l-49 49c-15.1 15.1-4.4 41 17 41h22v70c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24v-70h22c21.4 0 32.1-25.9 17-41z"
      />
    </svg>
  );
}

export function FaFileImport({ className, title }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M320 0H128C92.7 0 64 28.7 64 64v384c0 35.3 28.7 64 64 64h192c35.3 0 64-28.7 64-64V160L320 0zm32 448c0 17.7-14.3 32-32 32H128c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32h160v128h128v288z"
      />
      <path
        fill="currentColor"
        d="M151 373l49 49c9.4 9.4 24.6 9.4 33.9 0l49-49c15.1-15.1 4.4-41-17-41h-22v-70c0-13.3-10.7-24-24-24h-32c-13.3 0-24 10.7-24 24v70h-22c-21.4 0-32.1 25.9-17 41z"
      />
    </svg>
  );
}

/** Material-style magic wand: based on "auto_fix_high" icon. */
export function MdMagicWand({ className, title }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M7 21l-4-4L14.5 5.5l4 4L7 21zm10.6-13.4l-4-4.0 1.4-1.4c.4-.4 1-.4 1.4 0l2.6 2.6c.4.4.4 1 0 1.4L17.6 7.6zM18 12l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1zm-6-10l.8-1.6L13.6 2 15 2.8 16.6 3.6 15 4.4 13.6 5.2 12.8 6 12 4.4 11.2 3.6 10 2.8 11.2 2z"
      />
    </svg>
  );
}
