import { IconMenu2 } from "@tabler/icons-react";

interface PageHeaderProps {
  title: string;
  icon: React.ReactNode;
  onMenuClick: () => void;
}

export function PageHeader({ title, icon, onMenuClick }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-[#0F6E56] text-white px-4 py-3 h-[60px] sticky top-0 z-10 w-full">
      <div className="flex items-center gap-3">
        {icon}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      <button 
        onClick={onMenuClick}
        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors"
        data-testid="button-menu"
      >
        <IconMenu2 size={24} />
      </button>
    </div>
  );
}
