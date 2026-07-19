// Header user-menu dialog state: which auth overlay (if any) is open.
export type AuthDialog = "none" | "login" | "register";

// Category mega-menu navigation config.
export type NavLink = { label: string; href: string };
export type NavColumn = { title: string; links: NavLink[] };
export type NavSection = {
  key: string;
  label: string;
  href: string;
  image: string; // full URL to /media/:folder/:file
  columns: NavColumn[];
};
