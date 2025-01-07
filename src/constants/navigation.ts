export const NAV_ITEMS = ['About', 'Expertise', 'Projects', 'Blog', 'Contact', 'More'] as const;

export type NavItem = typeof NAV_ITEMS[number];