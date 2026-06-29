import type { ReactNode } from "react";

type P = { className?: string };

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Fill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

export const HomeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </Svg>
);

export const ChatIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.1A8.38 8.38 0 0 1 4 12.5 8.5 8.5 0 0 1 12.5 4 8.38 8.38 0 0 1 21 11.5Z" />
    <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
  </Svg>
);

export const SparkIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </Svg>
);

export const BagIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
);

export const ReceiptIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);

export const ShieldIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const SettingsIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Svg>
);

export const PlusIcon = (p: P) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);

export const CheckIcon = (p: P) => (
  <Svg {...p}><path d="m5 12 5 5L20 7" /></Svg>
);

export const CheckCircleIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></Svg>
);

export const XIcon = (p: P) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);

export const SearchIcon = (p: P) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Svg>
);

export const SendIcon = (p: P) => (
  <Svg {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></Svg>
);

export const PaperclipIcon = (p: P) => (
  <Svg {...p}><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L13 5.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3l6.5-6.5" /></Svg>
);

export const ImageIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></Svg>
);

export const UploadIcon = (p: P) => (
  <Svg {...p}><path d="M21 15v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4" /><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /></Svg>
);

export const DownloadIcon = (p: P) => (
  <Svg {...p}><path d="M21 15v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4" /><path d="M12 3v13" /><path d="m7 11 5 5 5-5" /></Svg>
);

export const TrashIcon = (p: P) => (
  <Svg {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></Svg>
);

export const PencilIcon = (p: P) => (
  <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></Svg>
);

export const ChevronLeftIcon = (p: P) => (
  <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>
);

export const ChevronRightIcon = (p: P) => (
  <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>
);

export const ChevronDownIcon = (p: P) => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
);

export const ArrowRightIcon = (p: P) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);

export const LogoutIcon = (p: P) => (
  <Svg {...p}><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
);

export const BellIcon = (p: P) => (
  <Svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Svg>
);

export const StarIcon = (p: P) => (
  <Fill {...p}><path d="m12 2 3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.5 21.2l1.3-7L1.7 9.4l7-.9L12 2Z" /></Fill>
);

export const StarOutlineIcon = (p: P) => (
  <Svg {...p}><path d="m12 3 2.6 5.5 6 .6-4.5 4 1.3 5.9L12 16l-5.4 3 1.3-5.9-4.5-4 6-.6L12 3Z" /></Svg>
);

export const ClockIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);

export const WalletIcon = (p: P) => (
  <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h12v4" /><path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3" /><path d="M21 11h-5a2 2 0 0 0 0 4h5v-4Z" /></Svg>
);

export const CardIcon = (p: P) => (
  <Svg {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></Svg>
);

export const BankIcon = (p: P) => (
  <Svg {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8" /><path d="M3 21h18" /></Svg>
);

export const PhoneIcon = (p: P) => (
  <Svg {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l2 5v0a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 1-2Z" transform="translate(-1 0)" /></Svg>
);

export const MailIcon = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);

export const LockIcon = (p: P) => (
  <Svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
);

export const UserIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
);

export const UsersIcon = (p: P) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 21a6.5 6.5 0 0 1 13 0" /><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6" /><path d="M17.5 14.4A6.5 6.5 0 0 1 21.5 21" /></Svg>
);

export const MenuIcon = (p: P) => (
  <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>
);

export const PackageIcon = (p: P) => (
  <Svg {...p}><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /><path d="m7.5 4.3 8.7 5" /></Svg>
);

export const FileIcon = (p: P) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></Svg>
);

export const FilterIcon = (p: P) => (
  <Svg {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" /></Svg>
);

export const RefreshIcon = (p: P) => (
  <Svg {...p}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></Svg>
);

export const InfoIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>
);

export const AlertIcon = (p: P) => (
  <Svg {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 9v5M12 17h.01" /></Svg>
);

export const BanIcon = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></Svg>
);

export const BotIcon = (p: P) => (
  <Svg {...p}><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 3v5" /><circle cx="12" cy="3" r="1.3" /><circle cx="9" cy="13" r="1.1" /><circle cx="15" cy="13" r="1.1" /><path d="M2 13v2M22 13v2" /></Svg>
);

export const TrendingIcon = (p: P) => (
  <Svg {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></Svg>
);

export const CoinsIcon = (p: P) => (
  <Svg {...p}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3" /><path d="M3 12v5c0 1.7 2.7 3 6 3" /><ellipse cx="15" cy="14" rx="6" ry="3" /><path d="M9 16.5V14" /><path d="M21 14v5c0 1.7-2.7 3-6 3" /></Svg>
);

export const TagIcon = (p: P) => (
  <Svg {...p}><path d="M3 12V4h8l9 9-8 8-9-9Z" /><circle cx="7.5" cy="7.5" r="1.4" /></Svg>
);

export const CopyIcon = (p: P) => (
  <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Svg>
);

export const ExternalIcon = (p: P) => (
  <Svg {...p}><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6" /></Svg>
);

export const EyeIcon = (p: P) => (
  <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg>
);

export const EyeOffIcon = (p: P) => (
  <Svg {...p}><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 13s3.5 7 10 7a9.6 9.6 0 0 0 4.2-1" /><path d="m3 3 18 18" /></Svg>
);

// ---------- Service icons (catalogue) ----------
export const ServiceIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case "logo":
      return <Svg className={className}><path d="M12 2 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-4Z" /><path d="M9 14l3-7 3 7" /></Svg>;
    case "palette":
      return <Svg className={className}><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1.2" /><circle cx="12" cy="8" r="1.2" /><circle cx="16" cy="10" r="1.2" /><path d="M9 16c1.5 1.2 4.5 1.2 6-.5" /></Svg>;
    case "card":
      return <Svg className={className}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Svg>;
    case "flyer":
      return <Svg className={className}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></Svg>;
    case "social":
      return <Svg className={className}><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="6" r="2.5" /><circle cx="17" cy="18" r="2.5" /><path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6" /></Svg>;
    case "layout":
      return <Svg className={className}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></Svg>;
    case "globe":
      return <Svg className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Svg>;
    case "video":
      return <Svg className={className}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></Svg>;
    default:
      return <SparkIcon className={className} />;
  }
};

// ---------- Payment icons ----------
export const PaymentIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case "mobile_money":
    case "moov":
      return <Svg className={className}><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 18h4" /></Svg>;
    case "orange_money":
      return <Svg className={className}><rect x="6" y="2" width="12" height="20" rx="3" /><circle cx="12" cy="8" r="1.5" /><path d="M10 18h4" /></Svg>;
    case "wave":
      return <Svg className={className}><path d="M3 12c3 0 4-6 7-6s2 12 5 12 3-6 6-6" /></Svg>;
    case "paypal":
      return <Svg className={className}><path d="M7 6h7a4 4 0 0 1 0 8H9l-1 4H5l2-12Z" /></Svg>;
    case "card":
      return <Svg className={className}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></Svg>;
    case "crypto":
      return <Svg className={className}><circle cx="12" cy="12" r="9" /><path d="M10 7h3a2 2 0 0 1 0 4h-3V7Zm0 4h3.5a2 2 0 0 1 0 4H10v-4ZM9 7v10M11 6v1M11 17v1" /></Svg>;
    case "bank":
      return <BankIcon className={className} />;
    default:
      return <WalletIcon className={className} />;
  }
};
