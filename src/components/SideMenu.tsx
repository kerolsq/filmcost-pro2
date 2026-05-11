import { Link, useLocation } from "wouter";
import { IconCalculator, IconFlask, IconPackage, IconHistory, IconSettings, IconX, IconTool } from "@tabler/icons-react";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const [location] = useLocation();

  const menuItems = [
    { href: "/", label: "الحاسبة", icon: <IconCalculator size={24} /> },
    { href: "/machines", label: "الماكينات", icon: <IconTool size={24} /> },
    { href: "/recipes", label: "الخلطات", icon: <IconFlask size={24} /> },
    { href: "/materials", label: "الخامات", icon: <IconPackage size={24} /> },
    { href: "/history", label: "السجل", icon: <IconHistory size={24} /> },
    { href: "/settings", label: "الإعدادات", icon: <IconSettings size={24} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-[#0F6E56] text-white h-[60px] flex items-center justify-between px-4">
          <span className="font-bold text-lg">فيلم كوست برو</span>
          <button 
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-md"
          >
            <IconX size={24} />
          </button>
        </div>

        <div className="flex flex-col py-2">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 h-[56px] text-[16px] transition-colors ${
                  isActive 
                    ? "bg-[#E1F5EE] text-[#0F6E56] border-r-4 border-[#0F6E56] font-bold" 
                    : "text-gray-700 hover:bg-gray-50 border-r-4 border-transparent"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
