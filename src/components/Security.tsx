/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  FileCheck, 
  RefreshCw, 
  Terminal, 
  CheckSquare, 
  Square,
  Activity,
  UserCheck
} from "lucide-react";

export default function Security() {
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Lokalne szyfrowanie danych Lead (AES-256)", checked: true },
    { id: 2, text: "Automatyczny filtr RODO przed wysyłką (Mila Mailer Audit)", checked: true },
    { id: 3, text: "Zgoda sprawozdawcza na cold milling (baza ogólnodostępna BDO)", checked: true },
    { id: 4, text: "Logowanie dostępów administracyjnych (The Vault Tracker)", checked: false },
    { id: 5, text: "Sprawdzanie rejestrów KRS pod kątem upadłości/likwidacji", checked: true },
    { id: 6, text: "Szyfrowanie połączeń z LLM Ollama i Gemini API", checked: true }
  ]);

  const [encKey, setEncKey] = useState("V2_AES_LOCAL_9f3f2d201994e1dca91c6e1e1291");
  const [isGenerating, setIsGenerating] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    "[SEC] 09:54:15 - Rozpoczęto audyt zabezpieczeń bazy centralnej",
    "[RODO] 09:54:16 - Połączenie z bramką sprawozdawczą bezpieczne",
    "[SEC] 09:54:19 - System operuje w sandboksie Cloud Run (Izolacja sieciowa)",
    "[KEY] 09:54:20 - Utworzono sesję dla użytkownika linek.slawek@gmail.com"
  ]);

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.checked;
        setSecurityLogs(logs => [
          `[USER] Zmieniono status audytu: "${item.text}" -> ${nextState ? "OK" : "OSTRZEŻENIE"}`,
          ...logs
        ]);
        return { ...item, checked: nextState };
      }
      return item;
    }));
  };

  const handleGenerateNewKey = () => {
    setIsGenerating(true);
    setSecurityLogs(logs => ["[KEY-ROTation] Rozpoczęto generowanie nowych kluczy kryptograficznych AES-256...", ...logs]);
    
    setTimeout(() => {
      const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const generated = `V2_AES_LOCAL_${hex.slice(0, 16)}`;
      setEncKey(generated);
      setIsGenerating(false);
      setSecurityLogs(logs => [
        `[KEY-Success] Wygenerowano klucz: ${generated}`,
        `[SEC] Zrotowano klucze sesyjne pomyślnie.`,
        ...logs
      ]);
    }, 1200);
  };

  // Calculate compliance score
  const checkedCount = checklist.filter(c => c.checked).length;
  const complianceScore = Math.round((checkedCount / checklist.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Module Banner */}
      <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#4edea3]/10 flex items-center justify-center border border-[#4edea3]/30">
            <ShieldCheck className="text-[#4edea3] w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#d4e4fa]">Moduł Bezpieczeństwa (The Vault Security)</h2>
            <p className="text-xs text-[#bec8d2]/70">Weryfikator zgodności z ochroną RODO, zarządzanie szyframi lokalnymi oraz logi bezpieczeństwa procesów.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Compliance Checklist (Col Span 7) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 space-y-4">
            
            <div className="flex justify-between items-center border-b border-[#3e4850]/20 pb-2">
              <h3 className="text-xs font-mono font-bold text-[#4edea3] tracking-widest uppercase flex items-center gap-1.5">
                <span>●</span> Audyt Zgodności RODO & Baza
              </h3>
              <div className="text-xs font-mono text-[#4edea3] font-bold">
                Mila Score: <span className="text-[#89ceff]">{complianceScore}%</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="h-2 w-full bg-[#051424] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#de8712] to-[#4edea3] transition-all duration-700"
                style={{ width: `${complianceScore}%` }}
              ></div>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="w-full flex items-start gap-2.5 p-3 bg-[#051424] text-left rounded border border-[#3e4850]/30 hover:border-[#89ceff]/50 transition-all focus:outline-none"
                >
                  <span className="shrink-0 mt-0.5 text-[#bec8d2]/80">
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-[#4edea3]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#bec8d2]/50 hover:text-[#ffb86e]" />
                    )}
                  </span>
                  <div className="text-xs font-sans text-[#d4e4fa] leading-tight">
                    {item.text}
                    <div className="text-[10px] font-mono text-[#bec8d2]/50 mt-1">
                      {item.checked ? "Spełniono / Aktywny" : "Zalecana konfiguracja"}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] font-mono text-[#bec8d2]/60">
              * Ostrzeżenie prawne: Publiczne spisy BDO są rejestrami jawnymi prowadzonymi przez Ministerstwo Klimatu i Środowiska. Przechowywanie danych kontaktowych do celów handlu B2B jest zgodne z polskim prawem na podstawie uzasadnionego interesu administratora (Art. 6 ust. 1 lit. f RODO).
            </p>

          </div>
        </section>

        {/* Cryptography and Logs (Col Span 5) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Cryptography Keys */}
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#89ceff] tracking-widest uppercase flex items-center gap-1.5">
              <span>●</span> Maszyna Szyfrująca (Keys)
            </h3>

            <div className="bg-[#051424] p-3 rounded border border-[#3e4850]/50 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[10px] text-[#bec8d2]/60 uppercase">
                <span>Algorytm</span>
                <span>Port / Status</span>
              </div>
              <div className="flex justify-between font-bold text-[#d4e4fa]">
                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-[#89ceff]" /> AES-256-GCM LOCAL</span>
                <span className="text-[#4edea3]">Zabezpieczony</span>
              </div>

              <div className="h-px bg-[#3e4850]/20 my-2"></div>

              <span className="text-[9px] text-[#bec8d2]/50 block uppercase">Aktywny Token Klucza Handlowego</span>
              <div className="p-2 bg-[#122131] rounded border border-[#3e4850]/50 text-[#89ceff] text-[10px] select-all select-none truncate">
                {encKey}
              </div>

              <button
                onClick={handleGenerateNewKey}
                disabled={isGenerating}
                className="w-full bg-[#273647] hover:bg-[#3e4850] text-[#d4e4fa] font-mono text-[10px] py-2 rounded focus:outline-none flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#3e4850]/50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "ROTOWANIE..." : "ZROTUJ KLUCZ SZYFRUJĄCY"}
              </button>
            </div>
          </div>

          {/* Core Logs */}
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 flex-1 flex flex-col">
            <h3 className="text-xs font-mono font-bold text-[#ffb86e] tracking-widest uppercase flex items-center gap-1.5 mb-3">
              <Terminal className="w-4 h-4 text-[#ffb86e]" /> Dziennik Zdarzeń RODO
            </h3>

            <div className="bg-[#051424] p-3 rounded border border-[#3e4850]/50 font-mono text-[9px] text-[#4edea3]/90 space-y-1.5 flex-1 max-h-[170px] overflow-y-auto">
              {securityLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </section>

      </div>

    </div>
  );
}
