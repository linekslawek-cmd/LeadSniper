/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { 
  Bell, 
  User, 
  Zap, 
  Target, 
  Activity, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { Lead, FunnelState, SystemHealthState, AppSettings } from "./types";
import { INITIAL_LEADS } from "./mockLeads";

// Modular Components
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Discovery from "./components/Discovery";
import Reconnaissance from "./components/Reconnaissance";
import Security from "./components/Security";
import Settings from "./components/Settings";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [activeRole, setActiveRole] = useState("Handlowiec");

  // Global settings state
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = {
      productTarget: "Atestowane kontenery stalowe na odpady przemysłowe i komunalne: symetryczne i asymetryczne muldy zgodne z normami DIN 30720 / DIN 30720-1, kontenery miejskie DIN 30735 City Container, a także duże kontenery hakowe o pojemności do 36m3 robione pod normę DIN 30722-1 oraz DIN 30722-2.",
      selectedSources: ["bdo", "gmaps", "panorama"],
      searchQueryRef: "złom, wywóz gruzu, odpady przemysłowe, PSZOK, recykling surowców",
      smtpServer: "smtp.sandbox.mailgun.org",
      autoEnrich: true,
      scanDepth: "normal",
      customMarketSources: [
        {
          id: "de-laga",
          countryName: "Niemcy",
          countryCode: "DE",
          searchDefinition: "Metalle und Schrotthändler (Huty i złomowiska)",
          suggestedDatabases: ["LAGA Abfallregister", "KrWG §54 Transportliste", "IHK Firmen-Index"],
          isActive: true
        },
        {
          id: "dk-affald",
          countryName: "Dania",
          countryCode: "DK",
          searchDefinition: "Affaldsbehandling og Genbrug (Odpady i recykling)",
          suggestedDatabases: ["Danish Affaldsregister (Miljøstyrelsen)", "Virk CVR Register", "Krak B2B Indeks"],
          isActive: false
        }
      ]
    };

    const saved = localStorage.getItem("mila_leadsniper_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          customMarketSources: parsed.customMarketSources || defaultSettings.customMarketSources
        };
      } catch (e) {
        // use default
      }
    }
    return defaultSettings;
  });

  // Global funnel numbers
  const [funnel, setFunnel] = useState<FunnelState>({
    foundLeadsCount: INITIAL_LEADS.length * 15 + 10,
    identifiedDMsCount: 45,
    sentOffersCount: 10,
    responsesCount: 2
  });

  // Global system health outputs
  const [health, setHealth] = useState<SystemHealthState>({
    cpuLoad: 78,
    memoryAlloc: "12.4 GB / 16 GB",
    activeModel: "Ollama (Gemma 2 9B)",
    currentLog: "Oczekiwanie w stanie gotowości operacyjnej.",
    inferenceStatus: 'idle'
  });

  // Global state for cross-component action (Recon analyze callback)
  const [leadIdToAnalyze, setLeadIdToAnalyze] = useState<string | null>(null);

  // Quick Action Modal statuses (Orbital scanning simulators)
  const [showScanPanel, setShowScanPanel] = useState(false);
  const [scannerLogs, setScannerLogs] = useState<string[]>([]);
  const [scannerProgress, setScannerProgress] = useState(0);
  const [discoveredTargetName, setDiscoveredTargetName] = useState<string | null>(null);
  
  // Quick Scan (Fast NIP entry)
  const [showQuickScan, setShowQuickScan] = useState(false);
  const [quickNipInput, setQuickNipInput] = useState("");

  const [notifications, setNotifications] = useState<string[]>([
    "Wykryto 3 nowe podmioty o podwyższonym scoringu zakupowym logistyki.",
    "Audyt RODO: Pomyślnie zrotowano klucze sesyjnej bazy lokalnej.",
    "Lokalna replikacja bazy BDO zakończona sukcesem."
  ]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Increment funnel numbers when new DMUs are extracted
  const handleIncrementDMsIdentified = (count: number) => {
    if (count > 0) {
      setFunnel(prev => ({
        ...prev,
        identifiedDMsCount: prev.identifiedDMsCount + count
      }));
    }
  };

  // Add custom found lead 
  const handleAddNewLead = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
    setFunnel(p => ({
      ...p,
      foundLeadsCount: p.foundLeadsCount + 1
    }));
    
    // Animate system log
    setHealth(prev => ({
      ...prev,
      currentLog: `Zarejestrowano nową kartę sprawozdawczą podmiotu: ${newLead.companyName}`
    }));
  };

  // Trigger cross-linking click to load certain lead directly in the Recon AI screen
  const handleAnalyzeLeadInRecon = (leadId: string) => {
    setLeadIdToAnalyze(leadId);
    setActiveTab("recon");
  };

  // Toggle/Update lead BDO status
  const handleUpdateBdoStatus = (leadId: string, status: 'Aktywny' | 'Weryfikacja' | 'Wygasły') => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, bdoStatus: status };
      }
      return lead;
    }));
  };

  // Trigger whole-database scan simulation
  const handleTriggerNewScanDialog = () => {
    setShowScanPanel(true);
    setScannerProgress(0);
    setScannerLogs([]);
    setDiscoveredTargetName(null);

    const logsList = [
      "[SYS] Rozpoczynam wieloetapowe przeszukiwanie bazy Ministerstwa Klimatu i Środowiska pod kątem rejestrów BDO...",
      "[ORBIT] Łączenie z satelitarną wyszukiwarką branż przemysłowych (Polska-Śląsk)...",
      "[LOG] Wykryto niezgodności statusów ewidencyjnych dla 2 firm z podkategorii recyklingu.",
      "[SCRAPER] Analizowanie struktury LinkedIn dla spółki 'Kraków Ecology Solutions Sp. z o.o.'...",
      "[AI] Detekcja decydenta: 'Robert Malicki' (Dyrektor ds. Partnerstw i Logistyki) - Score: 10/10",
      "[BDO] Pobieranie numeru rejestrowego i aktualizowanie Lejka Wyników..."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logsList.length) {
        setScannerLogs(prev => [...prev, logsList[currentLogIndex]]);
        setScannerProgress((currentLogIndex + 1) * 16.6);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setScannerProgress(100);
        
        // Finalize added scanned target
        const simulatedNip = `50200${Math.floor(Math.random() * 90000) + 10000}`;
        const newScannedLead: Lead = {
          id: `scanned-${simulatedNip}`,
          companyName: "Kraków Ecology Solutions Sp. z o.o.",
          nip: simulatedNip,
          regon: "829402194",
          bdoNumber: "000094810",
          province: "Małopolskie",
          industry: "Gospodarka Odpadami & Recykling",
          sources: ['recycling', 'work'],
          bdoStatus: 'Aktywny',
          decisionMakerName: "Robert Malicki",
          decisionMakerRole: "Dyrektor ds. Partnerstw i Logistyki Surowcowej",
          decisionMakerRelevance: 10,
          email: "r.malicki@krakow-ecology.pl",
          phone: "+48 12 443 20 10",
          address: "ul. Floriańska 22, 31-021 Kraków",
          website: "https://www.krakow-ecology.pl",
          scannedAt: "2026-05-20 09:54",
          rawTextSample: `Profil Kraków Ecology Solutions Sp. z o.o.:
Szybko rozwijająca się firma zajmująca się odzyskiem surowców z tworzyw sztucznych i recyklingiem makulatury w Małopolsce. 
Robert Malicki jako Dyrektor ds. Partnerstw koordynuje cały pion zakupowy i logistyczny. Posiada bezpośrednie pełnomocnictwa handlowe. 
"Poszukujemy pilnie zintegrowanego systemu logistyki zwrotnej, w celu odciążenia pracy personelu sprawozdawczego"`,
        };

        setLeads(prev => [newScannedLead, ...prev]);
        setDiscoveredTargetName(newScannedLead.companyName);
        
        // Update global counters
        setFunnel(p => ({
          ...p,
          foundLeadsCount: p.foundLeadsCount + 1,
          identifiedDMsCount: p.identifiedDMsCount + 1
        }));

        setNotifications(prev => [
          `Skaner wykrył nowy cel zakupowy: Kraków Ecology Solutions Sp. z o.o.`,
          ...prev
        ]);
      }
    }, 700);
  };

  // Quick NIP Input scan handler
  const handleQuickNipScanSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!quickNipInput || quickNipInput.length < 8) {
      alert("Proszę wpisać poprawny numer NIP.");
      return;
    }

    setShowQuickScan(false);
    setQuickNipInput("");
    
    // Jump straight into scanning module with loaded NIP!
    setActiveTab("discovery");
    // Trigger simulated notification
    setNotifications(prev => [
      `Uruchomiono Szybki Skan dla NIP: ${quickNipInput}`,
      ...prev
    ]);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#d4e4fa] font-sans antialiased overflow-x-hidden">
      
      {/* SIDEBAR NAVIGATION - fixed - width: 250px */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onTriggerNewScan={handleTriggerNewScanDialog}
        onLogout={() => {
          if (confirm("Czy na pewno chcesz wylogować bieżącą sesję operacyjną?")) {
            setLeads(INITIAL_LEADS);
            setFunnel({
              foundLeadsCount: INITIAL_LEADS.length * 15 + 10,
              identifiedDMsCount: 45,
              sentOffersCount: 10,
              responsesCount: 2
            });
            setActiveTab("dashboard");
            alert("Baza sesyjna została pomyślnie zresetowana!");
          }
        }}
      />

      {/* TOP HEADER - absolute positioned next to sidebar */}
      <header className="fixed top-0 right-0 w-[calc(100%-250px)] h-16 bg-[#051424]/80 backdrop-blur-md border-b border-[#3e4850]/45 flex justify-between items-center px-8 z-40">
        
        {/* Left indicators */}
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-[#89ceff] hover:opacity-80 transition-all cursor-pointer flex items-center gap-2">
            <Target className="w-4 h-4" />
            Mila LeadSniper
          </h2>
          <div className="h-5 w-px bg-[#3e4850]/40"></div>
          
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#273647]/50 border border-[#3e4850]/40 rounded-full text-[#89ceff] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
              Ollama / Gemma 2 Active
            </div>
            
            <div className="text-[#bec8d2]/60 font-mono text-[10px] hidden md:block">
              Rola: <strong className="text-[#d4e4fa]">{activeRole}</strong>
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          
          {/* Quick Notifications Center */}
          <div className="relative">
            <button 
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="p-1.5 hover:bg-[#273647] rounded-sm text-[#bec8d2] hover:text-[#89ceff] transition-all relative focus:outline-none"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#ffb4ab] rounded-full"></span>
            </button>

            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2.5 w-72 bg-[#122131] border border-[#3e4850] rounded shadow-2xl z-50 overflow-hidden font-mono text-[10px]">
                <div className="bg-[#1c2b3c] p-2.5 border-b border-[#3e4850]/30 font-bold text-[#de8712] flex justify-between items-center">
                  <span>CENTRALNE POWIADOMIENIA</span>
                  <button 
                    onClick={() => {
                      setNotifications([]);
                      setShowNotificationsDropdown(false);
                    }}
                    className="text-[9px] text-[#bec8d2] hover:underline"
                  >
                    Wyczyść
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-[#3e4850]/20 p-1">
                  {notifications.length > 0 ? (
                    notifications.map((notif, i) => (
                      <div key={i} className="p-2 py-2.5 text-[#bec8d2] leading-normal">
                        • {notif}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[#bec8d2]/40 italic">Brak nowych powiadomień.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-[#3e4850]/40"></div>

          {/* Quick Scan Action button */}
          <button 
            onClick={() => setShowQuickScan(true)}
            className="bg-[#89ceff]/10 hover:bg-[#89ceff] hover:text-[#001e2f] border border-[#89ceff]/50 px-3.5 py-1.5 rounded text-[11px] font-mono font-bold tracking-wider text-[#89ceff] flex items-center gap-1.5 transition-all select-none active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            SZYBKI SKAN
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA - offset by sidebar (250px) and header (16px/64px) */}
      <main className="pl-[250px] pt-16 min-h-screen">
        <div className="p-8 max-w-[1440px] mx-auto w-full">
          
          {/* Dynamic Render of Tabs */}
          {activeTab === "dashboard" && (
            <Dashboard 
              leads={leads}
              funnel={funnel}
              setFunnel={setFunnel}
              health={health}
              setHealth={setHealth}
              onAnalyzeLeadInRecon={handleAnalyzeLeadInRecon}
              onUpdateBdoStatus={handleUpdateBdoStatus}
              activeRole={activeRole}
            />
          )}

          {activeTab === "discovery" && (
            <Discovery 
              onAddLead={handleAddNewLead}
              existingLeads={leads}
              appSettings={appSettings}
            />
          )}

          {activeTab === "recon" && (
            <Reconnaissance 
              leads={leads}
              onSetLeads={setLeads}
              selectedLeadIdToAnalyze={leadIdToAnalyze}
              onClearSelectedLead={() => setLeadIdToAnalyze(null)}
              onIncrementDMsIdentified={handleIncrementDMsIdentified}
              appSettings={appSettings}
              activeRole={activeRole}
            />
          )}

          {activeTab === "security" && (
            <Security />
          )}

          {activeTab === "settings" && (
            <Settings 
              onSetRoleName={setActiveRole}
              activeRole={activeRole}
              appSettings={appSettings}
              onUpdateSettings={(nextSettings) => {
                setAppSettings(nextSettings);
                localStorage.setItem("mila_leadsniper_settings", JSON.stringify(nextSettings));
              }}
            />
          )}

        </div>
      </main>

      {/* QUICK NIP SCAN WINDOW OVERLAY */}
      {showQuickScan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form 
            onSubmit={handleQuickNipScanSubmit}
            className="bg-[#122131] w-full max-w-sm rounded border border-[#3e4850] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="bg-[#1c2b3c] px-4 py-3 border-b border-[#3e4850]/30 flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-[#89ceff] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#89ceff]" /> Błyskawiczny Skan Celu
              </span>
              <button 
                type="button"
                onClick={() => setShowQuickScan(false)}
                className="text-[#bec8d2] hover:text-[#d4e4fa] font-mono font-bold text-lg focus:outline-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <p className="text-[#bec8d2] leading-normal font-sans text-xs">
                Wprowadź docelowy NIP firmy z sektora gospodarki surowcowej lub odpadowej na skróty. Skaner zbada bazy sprawozdawcze i załaduje leada automatycznie.
              </p>

              <div>
                <label className="block text-[10px] text-[#bec8d2]/50 tracking-wider mb-1.5 font-bold uppercase">POLSKI NUMER NIP (8-10 cyfr)</label>
                <input
                  type="text"
                  placeholder="np. 6340129481..."
                  value={quickNipInput}
                  onChange={(e) => setQuickNipInput(e.target.value.replace(/\D/g, ""))}
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                  required
                />
              </div>
            </div>

            <div className="bg-[#1c2b3c]/60 p-3.5 border-t border-[#3e4850]/30 flex justify-end gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowQuickScan(false)}
                className="px-3 py-1.5 bg-[#273647] text-[#bec8d2] font-semibold hover:text-[#d4e4fa] rounded transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#89ceff] text-[#001e2f] font-bold rounded hover:bg-[#c9e6ff] transition-colors"
              >
                URUCHOM SCHEDULER
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ORBITAL SCAN PANEL OVERLAY (NOWY SKAN DIALOG) */}
      {showScanPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#122131] w-full max-w-md rounded border border-[#3e4850] overflow-hidden flex flex-col shadow-2xl">
            
            <div className="bg-[#1c2b3c] px-4 py-3 border-b border-[#3e4850]/30 flex justify-between items-center text-xs font-mono">
              <span className="text-[#ffb86e] font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#ffb86e] animate-pulse" /> AUTOMATYCZNY ORBITALNY SKANER BDO
              </span>
              {scannerProgress === 100 && (
                <button 
                  onClick={() => setShowScanPanel(false)}
                  className="text-[#bec8d2] hover:text-[#d4e4fa] font-bold text-lg focus:outline-none"
                >
                  ×
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              
              {/* Progress visual bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#bec8d2]">PROGRES WYKONYWANIA</span>
                  <span className="text-[#ffb86e] font-bold">{Math.round(scannerProgress)}%</span>
                </div>
                <div className="h-2 w-full bg-[#051424] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#de8712] ... to-[#ffb86e] transition-all duration-300"
                    style={{ width: `${scannerProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Console logging rolls */}
              <div className="bg-[#051424] p-3.5 rounded border border-[#3e4850]/40 font-mono text-[10px] text-[#4edea3] h-48 overflow-y-auto space-y-1">
                {scannerLogs.map((log, index) => (
                  <div key={index} className="leading-normal">
                    {log}
                  </div>
                ))}
                {scannerProgress < 100 && (
                  <div className="flex gap-1.5 items-center text-[#de8712] animate-pulse pt-2">
                    <span className="animate-spin text-[11px]">↻</span>
                    <span>Generuję mapę połączeń teleadresowych i mapowanie DMU...</span>
                  </div>
                )}
              </div>

              {/* Discovered result alert */}
              {scannerProgress === 100 && discoveredTargetName && (
                <div className="bg-[#00311f]/30 border border-[#4edea3]/50 p-3 rounded flex items-start gap-2.5 font-sans">
                  <CheckCircle className="w-5 h-5 text-[#4edea3] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-[#4edea3] block font-mono text-[11px]">SUKCES: POZYSKANO NOWY CEL</strong>
                    <span className="text-[#d4e4fa]">Dodano pomyślnie podmiot <strong>{discoveredTargetName}</strong> do Lejka Rozwoju! Decydent zidentyfikowany automatycznie.</span>
                  </div>
                </div>
              )}

            </div>

            <div className="bg-[#1c2b3c]/60 p-3.5 border-t border-[#3e4850]/30 flex justify-end gap-2 text-xs font-mono">
              <button
                disabled={scannerProgress < 100}
                onClick={() => {
                  setShowScanPanel(false);
                  setActiveTab("dashboard");
                }}
                className="px-4 py-2 bg-[#273647] text-[#bec8d2] disabled:opacity-50 disabled:cursor-not-allowed hover:text-[#d4e4fa] rounded transition-colors"
                id="btn-scan-close"
              >
                Powrót do pulpitu
              </button>
              {scannerProgress === 100 && (
                <button
                  onClick={() => {
                    setShowScanPanel(false);
                    setActiveTab("recon");
                  }}
                  className="px-4 py-2 bg-[#de8712] text-[#2c1600] font-bold rounded hover:bg-[#ffb86e] transition-colors"
                  id="btn-scan-to-recon"
                >
                  Przejdź do analizy AI
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
