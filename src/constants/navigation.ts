export const NAV_ITEMS = ['About', 'Expertise', 'Projects', 'Contact', 'Blog', 'More'] as const;

export type NavItem = typeof NAV_ITEMS[number];
