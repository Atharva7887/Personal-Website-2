import { LucideIcon } from 'lucide-react';

interface ContactItemProps {
  icon: LucideIcon;
  title: string;
  value: string;
  href: string;
}

export function ContactItem({ icon: Icon, title, value, href }: ContactItemProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 group hover:scale-105 transition-transform"
    >
      <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center group-hover:bg-purple-600 transition-colors">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold group-hover:text-purple-400 transition-colors">
          {title}
        </p>
        <p className="text-gray-400 group-hover:text-gray-200 transition-colors">
          {value}
        </p>
      </div>
    </a>
  );
}