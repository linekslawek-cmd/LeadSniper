/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Target, 
  LayoutDashboard, 
  Radio, 
  Cpu, 
  ShieldCheck, 
  Settings, 
  PlusCircle, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTriggerNewScan: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onTriggerNewScan, 
  onLogout 
}: SidebarProps) {
  
  const menuItems = [
    {
      id: "dashboard",
      label: "Panel Wyników",
      icon: LayoutDashboard,
      description: "Ogólne metryki i lejek"
    },
    {
      id: "discovery",
      label: "Moduł Odkrywania",
      icon: Radio,
      description: "Skanowanie i pozyskiwanie"
    },
    {
      id: "recon",
      label: "Moduł Rozpoznania",
      icon: Cpu,
      description: "Analiza decydentów AI"
    },
    {
      id: "security",
      label: "Moduł Bezpieczeństwa",
      icon: ShieldCheck,
      description: "Rodo, klucze i audyt"
    },
    {
      id: "settings",
      label: "Ustawienia",
      icon: Settings,
      description: "Parametry systemu"
    }
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-[250px] bg-[#0d1c2d] border-r border-[#3e4850]/40 flex flex-col py-6 z-50 transition-all">
      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div id="brand-logo" className="w-10 h-10 rounded bg-[#273647] flex items-center justify-center border border-[#3e4850] relative overflow-hidden group">
          <Target className="text-[#89ceff] w-5 h-5 transition-transform group-hover:scale-110" />
          <div className="absolute inset-0 bg-[#89ceff]/10 animate-pulse"></div>
        </div>
        <div>
          <h1 className="font-sans text-lg font-bold text-[#d4e4fa] tracking-tight">LeadSniper</h1>
          <p className="font-mono text-[10px] text-[#89ceff]/70 tracking-widest uppercase">The Vault v2.4</p>
        </div>
      </div>

      {/* Main Links */}
      <div className="flex-1 flex flex-col gap-1.5 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${
                isActive 
                  ? "bg-[#273647]/80 text-[#89ceff] font-medium border-l-[3px] border-[#89ceff] shadow-md shadow-black/20" 
                  : "text-[#bec8d2] hover:bg-[#273647]/40 hover:text-[#d4e4fa]"
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? "text-[#89ceff]" : "text-[#bec8d2]"}`} />
              <div className="flex flex-col">
                <span className="text-sm font-sans">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="px-4 mt-auto flex flex-col gap-3">
        <button
          onClick={onTriggerNewScan}
          className="w-full bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] font-mono text-[11px] font-bold py-3 px-4 rounded transition-all flex items-center justify-center gap-2 border border-[#de8712]/30 active:scale-95 shadow-lg shadow-[#de8712]/10"
        >
          <PlusCircle className="w-[16px] h-[16px]" />
          NOWY SKAN
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[#bec8d2] hover:text-[#ffb4ab] hover:bg-[#93000a]/10 rounded font-mono text-[11px] transition-colors font-medium opacity-80 hover:opacity-100"
        >
          <LogOut className="w-[15px] h-[15px]" />
          <span>Wyloguj sesję</span>
        </button>
      </div>
    </nav>
  );
}
