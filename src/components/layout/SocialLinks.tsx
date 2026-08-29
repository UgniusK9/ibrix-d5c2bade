import { Facebook } from "lucide-react";
import { COMPANY } from "@/config/company";

/**
 * Links to the public social profiles.
 *
 * These existed only inside the Organization `sameAs` structured data, which
 * search engines read but visitors never see — so nobody browsing ibrix.lt
 * could find the accounts, and nobody arriving from them could confirm the
 * shop was the same business. Both directions matter for a store whose traffic
 * comes from social.
 *
 * lucide-react ships no TikTok glyph, so that one is inlined.
 */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .73-5.07v-3.13a5.67 5.67 0 0 0-.73-.05A5.66 5.66 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

interface SocialLinksProps {
  className?: string;
  /** Tailwind classes for each icon button. */
  itemClassName?: string;
}

export function SocialLinks({ className = "", itemClassName = "" }: SocialLinksProps) {
  const links = [
    { href: COMPANY.social.facebook, label: "Facebook", Icon: Facebook },
    { href: COMPANY.social.tiktok, label: "TikTok", Icon: TikTokIcon },
  ];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`IBRIX ${label}`}
          title={`IBRIX ${label}`}
          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-footer-foreground/15 text-footer-foreground/70 hover:text-accent hover:border-accent transition-colors ${itemClassName}`}
        >
          <Icon className="w-4 h-4" />
        </a>
      ))}
    </div>
  );
}
