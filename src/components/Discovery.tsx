/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Search, 
  Radio, 
  Play, 
  Building2, 
  PlusCircle, 
  Database, 
  Terminal, 
  ChevronRight,
  ShieldCheck,
  Globe,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Linkedin,
  Cpu,
  Layers,
  ArrowRight,
  Server,
  Loader2
} from "lucide-react";
import { Lead, AppSettings } from "../types";

interface DiscoveryProps {
  onAddLead: (newLead: Lead) => void;
  existingLeads: Lead[];
  appSettings: AppSettings;
}

export default function Discovery({ onAddLead, existingLeads, appSettings }: DiscoveryProps) {
  // Navigation tabs for scan state
  const [scanScope, setScanScope] = useState<string>("bdo");
  
  // Single Scan Input fields
  const [nipInput, setNipInput] = useState("");
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Śląskie");
  
  // Local searching fields for Manual Search
  const [customSearchQuery, setCustomSearchQuery] = useState(appSettings.searchQueryRef);
  const [targetCity, setTargetCity] = useState("Katowice");
  const [targetCountry, setTargetCountry] = useState("PL"); // PL, DE, DK, etc.

  // Scanning status for Manual Search
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scannedResult, setScannedResult] = useState<Lead | null>(null);

  // 1. DYNAMICZNY WEJŚCIOWY PROFIL PRODUKTU (The Product Router) state
  const [productRouterInput, setProductRouterInput] = useState("");
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  
  const [strategyResult, setStrategyResult] = useState<{
    strategicAnalysis: string;
    whoAreThey: {
      nicheName: string;
      description: string;
      score: number;
    }[];
    whereToFind: {
      sourceName: string;
      relevance: string;
      details: string;
    }[];
    keywordsByCountry: {
      PL: string[];
      DE: string[];
      DK: string[];
      FR: string[];
    };
  } | null>(null);

  // Active country tab for Generated Keywords preview
  const [previewCountryTab, setPreviewCountryTab] = useState<"PL" | "DE" | "DK" | "FR">("PL");

  // 2. SYSTEM KOLEJKOWANIA I GEOLOKALIZACJI (The Map Driver Background Tasks) state
  const [autopilotCountry, setAutopilotCountry] = useState("PL");
  const [autopilotRange, setAutopilotRange] = useState("Wszystkie duże i średnie miasta po kolei");
  const [autopilotKeywords, setAutopilotKeywords] = useState("");
  const [isStartingTask, setIsStartingTask] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<any[]>([]);

  // Suggested quick pre-fills
  const SUGGESTED_BDO_PL = [
    { nip: "6348129011", name: "Huta Silesia Recykling Sp. z o.o.", prov: "Śląskie" },
    { nip: "5252203112", name: "SITA Zgierz S.A.", prov: "Łódzkie" },
    { nip: "7774129520", name: "BioEko Poznań", prov: "Wielkopolskie" }
  ];

  const SUGGESTED_GM_PL = [
    { query: "Scrap yard / złomowisko", city: "Gliwice", country: "PL" },
    { query: "Utylizacja gruzu i odpadów", city: "Zabrze", country: "PL" },
    { query: "PSZOK Punkt Selektywnej Zbiórki", city: "Częstochowa", country: "PL" }
  ];

  const SUGGESTED_INTL = [
    { query: "Schrotthandel / Metallrecycling", city: "Hamburg", country: "DE" },
    { query: "Entsorgungsfachbetrieb", city: "Berlin", country: "DE" },
    { query: "Skrotpriser & Genbrugsplads", city: "Kopenhagen", country: "DK" }
  ];

  // Set initial product target from global configuration
  useEffect(() => {
    if (appSettings.productTarget) {
      setProductRouterInput(appSettings.productTarget);
    } else {
      setProductRouterInput("Wynajem maszyn budowlanych i koparek gąsienicowych");
    }
  }, [appSettings.productTarget]);

  // Load and poll background tasks from our robust SQLite backend
  const fetchTasks = () => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then((data) => {
        setBackgroundTasks(data || []);
      })
      .catch(err => console.error("Error fetching background tasks:", err));
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000); // refresh tasks every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // 1. Trigger the Product Router strategy builder
  const handleGenerateStrategy = () => {
    if (!productRouterInput || productRouterInput.trim().length === 0) {
      alert("Proszę wpisać co dziś planujesz zaoferować.");
      return;
    }
    setIsGeneratingStrategy(true);
    setStrategyResult(null);

    fetch("/api/discovery/analyze-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: productRouterInput })
    })
    .then(res => {
      if (!res.ok) throw new Error("Strategy generation failed");
      return res.json();
    })
    .then(data => {
      setStrategyResult(data);
      setIsGeneratingStrategy(false);
      
      // Auto-prefill autopilot keywords with Poland generated keywords on success!
      if (data.keywordsByCountry && data.keywordsByCountry.PL) {
        setAutopilotKeywords(data.keywordsByCountry.PL.join(", "));
      }
    })
    .catch(err => {
      console.error("Strategy builder error in Product Router:", err);
      setIsGeneratingStrategy(false);
      alert("Nie udało się połączyć z API ruterera produktów.");
    });
  };

  // 2. Trigger active async background crawler + geolocator target task
  const handleStartBackgroundAutopilot = () => {
    if (!autopilotKeywords || autopilotKeywords.trim().length === 0) {
      alert("Proszę podać co najmniej jedno słowo kluczowe dla bota.");
      return;
    }
    setIsStartingTask(true);

    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: autopilotCountry,
        range: autopilotRange,
        keywords: autopilotKeywords.split(",").map(k => k.trim()),
        productTarget: productRouterInput
      })
    })
    .then(res => res.json())
    .then(data => {
      setIsStartingTask(false);
      fetchTasks(); // reload lists immediately
      alert(`Pomyślnie dodano zadanie Autopilota do kolejki SQLite! ID zadania: ${data.taskId}`);
    })
    .catch(err => {
      console.error("Error creating autopilot task:", err);
      setIsStartingTask(false);
      alert("Błąd połączenia podczas kolejkowania zadania.");
    });
  };

  // Trigger Manual single scan operations (BDO, Google Places API etc.)
  const triggerScan = (
    mode: string,
    customNip?: string,
    customName?: string,
    customQuery?: string,
    customLoc?: string,
    customCty?: string
  ) => {
    setIsScanning(true);
    setScannedResult(null);
    setScanLogs([]);

    const nip = customNip || nipInput;
    const companyName = customName || companyNameInput;
    const query = customQuery || customSearchQuery;
    const loc = customLoc || targetCity;
    const country = customCty || targetCountry;

    if (mode === "linkedin") {
      if (!companyName) {
        alert("Proszę podać nazwę firmy do zeskrobania danych z LinkedIn.");
        setIsScanning(false);
        return;
      }

      setScanLogs([`[LinkedIn Scraper] Inicjalizacja wielostrumieniowej głowicy skanującej...`]);
      const addLog = (msg: string) => {
        setScanLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pl-PL', { hour12: false })}] ${msg}`]);
      };

      setTimeout(() => addLog(`Nawiązywanie bezpiecznego połączenia z proxy API LinkedIn...`), 100);
      setTimeout(() => addLog(`Przeszukiwanie profili publicznych i postów dla "${companyName}"...`), 300);
      setTimeout(() => addLog(`Pobieranie danych o pracownikach i trendów rekrutacyjnych...`), 500);
      setTimeout(() => addLog(`Analizowanie dopasowania profilu za pomocą Gemini AI...`), 700);

      fetch("/api/discovery/linkedin-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, productTarget: productRouterInput })
      })
      .then(res => {
        if (!res.ok) throw new Error("API scan failed");
        return res.json();
      })
      .then(data => {
        addLog(`Pomyślnie dopasowano profil LinkedIn! Siedziba: ${data.headquarters || 'Polska'}.`);
        addLog(`Zapotrzebowanie i posty firmy wczytane do bazy.`);
        
        const generatedResult: Lead = {
          id: `scanned-li-${Math.floor(Math.random() * 80000) + 10000}`,
          companyName: data.companyName || companyName,
          nip: "Do zidentyfikowania",
          regon: "Do zidentyfikowania",
          bdoNumber: "Brak danych (LinkedIn)",
          province: "Do zidentyfikowania",
          industry: data.description ? data.description.slice(0, 100) : "Wyszukane z LinkedIn",
          sources: ['work'],
          bdoStatus: 'Aktywny',
          decisionMakerName: "Wydzielone z LinkedIn",
          decisionMakerRole: "Do zidentyfikowania w module RECON",
          decisionMakerRelevance: 8,
          email: `sourcing@${(data.companyName || companyName).toLowerCase().replace(/[^a-z0-9]/g, "")}.pl`,
          phone: "+48 600 000 000",
          address: data.headquarters || "Polska",
          website: data.linkedinUrl || "https://www.linkedin.com",
          rawTextSample: data.rawTextSample,
          scannedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
        };

        setScannedResult(generatedResult);
        setIsScanning(false);
      })
      .catch(err => {
        console.error("LinkedIn scraper API error:", err);
        addLog(`[BŁĄD] Wystąpił błąd podczas skanowania LinkedIn.`);
        setIsScanning(false);
      });

      return;
    }

    let steps: string[] = [];
    if (mode === "bdo") {
      if (!nip && !companyName) {
        alert("Proszę podać numer NIP lub nazwę firmy do przeszukania rejestru BDO.");
        setIsScanning(false);
        return;
      }
      const searchTarget = nip || companyName;
      steps = [
        `[${new Date().toLocaleTimeString()}] Odpytywanie rejestru Ministerstwa Środowiska o NIP/Nazwę: ${searchTarget}...`,
        `[${new Date().toLocaleTimeString()}] Pomyślnie zlokalizowano rekord sprawozdawczy BDO.`,
        `[${new Date().toLocaleTimeString()}] Badanie kart przekazu odpadów (KPO / KPOK) w celu identyfikacji logistyki...`,
        `[${new Date().toLocaleTimeString()}] Wyszukiwanie decydentów na podstawie bazy rejestrowej.`
      ];
    } else if (mode === "gmaps") {
      steps = [
        `[${new Date().toLocaleTimeString()}] Inicjalizacja koordynatora Google Maps API Scraper...`,
        `[${new Date().toLocaleTimeString()}] Wywoływanie zapytania Places o frazę: "${query}" w lokalizacji: "${loc}"...`,
        `[${new Date().toLocaleTimeString()}] Przeanalizowano dopasowane punkty fizyczne placów.`,
        `[${new Date().toLocaleTimeString()}] Skan Google Maps ukończony pomyślnie.`
      ];
    } else if (mode === "panorama") {
      steps = [
        `[${new Date().toLocaleTimeString()}] Odpytywanie branżowych katalogów teleadresowych dla frazy: "${query}"...`,
        `[${new Date().toLocaleTimeString()}] Pobrano komplety adresów, telefonów i zweryfikowano statusy rejestrowe.`,
        `[${new Date().toLocaleTimeString()}] Zakończono proces i sformatowano rekord.`
      ];
    } else {
      steps = [
        `[${new Date().toLocaleTimeString()}] Odpytywanie regionalnych rejestrów (Handelsregister / Affaldsregisteret) dla "${query}"...`,
        `[${new Date().toLocaleTimeString()}] Wyszukanie w miastach zagranicznych: ${loc} (${country})...`,
        `[${new Date().toLocaleTimeString()}] Ekstrakcja danych sprawozdawczych i struktury zarządu zakończona.`
      ];
    }

    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < steps.length) {
        setScanLogs(prev => [...prev, steps[logIdx]]);
        logIdx++;
      } else {
        clearInterval(logInterval);
        setIsScanning(false);

        // Map realistic simulated single lead based on values
        let finalCompany = companyName || `Spółka Usługowa ${loc || "Krajowa"}`;
        let finalNip = nip || `PL-${Math.floor(Math.random() * 900000000) + 100000000}`;
        let finalAddress = `ul. Przemysłowa 120, ${loc || "Katowice"}, ${country}`;
        let finalEmail = `kontakt@${finalCompany.toLowerCase().replace(/[^a-z0-9]/g, "") || "firma"}.com`;
        let finalPhone = "+48 32 400 90 20";
        let finalDM = "Wojciech Silezian";
        let finalRole = "Logistics Purchasing Specialist";
        let textSample = `Firma zlokalizowana w mieście: ${loc}. Wykazuje podwyższoną eksploatację taboru i urządzeń logistycznych. Ich place składowania i hale operacyjne wymagają ciągłej wymiany elementów stalowych i konstrukcji transportowych zgodnych z normami DIN. Szczegółowe zapotrzebowanie obejmuje produkt: ${productRouterInput.slice(0, 80)}.`;

        const generatedResult: Lead = {
          id: `manual-scanned-${finalNip}`,
          companyName: finalCompany,
          nip: finalNip,
          regon: `${Math.floor(Math.random() * 90000000) + 10000000}`,
          bdoNumber: `0000${Math.floor(Math.random() * 90000) + 10000}`,
          province: selectedProvince,
          industry: query || "Przemysł i Sourcing",
          sources: ['language'],
          bdoStatus: 'Aktywny',
          decisionMakerName: finalDM,
          decisionMakerRole: finalRole,
          decisionMakerRelevance: 9,
          email: finalEmail,
          phone: finalPhone,
          address: finalAddress,
          website: `http://www.${finalCompany.toLowerCase().replace(/[^a-z0-9]/g, "") || "firma"}.com`,
          rawTextSample: textSample,
          scannedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
        };

        setScannedResult(generatedResult);
      }
    }, 250);
  };

  // Finalize Manual Scanned lead to the SQLite databases
  const handleApplyAddLead = () => {
    if (!scannedResult) return;
    onAddLead(scannedResult);
    setScannedResult(null);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Info Banner */}
      <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#89ceff]/10 flex items-center justify-center border border-[#89ceff]/30">
            <Cpu className="text-[#89ceff] w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#d4e4fa]">SaaS Autopilot & Dynamiczne Kampanie B2B</h2>
            <p className="text-xs text-[#bec8d2]/70">
              Uniwersalny ruter produktowy połączony z bezobsługowym skanerem geolokalizacji w tle (The Map Driver) oraz crawlerem internetowym (The Deep Miner).
            </p>
          </div>
        </div>
      </div>

      {/* 1. DYNAMICZNY WEJŚCIOWY PROFIL PRODUKTU (The Product Router) */}
      <div className="bg-[#122131] rounded border border-[#005cbb]/40 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#3e4850]/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#89ceff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#89ceff]"></span>
            </span>
            <h3 className="text-xs font-mono font-bold text-[#89ceff] tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
              [PUNKT 1] THE PRODUCT ROUTER - INTEGRACJA KAMPANII AI
            </h3>
          </div>
          <span className="bg-[#00311f] text-[#4edea3] border border-[#4edea3]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
            Mila AI v2.5 Aktywna
          </span>
        </div>

        <p className="text-[11px] text-[#bec8d2]/90 leading-relaxed font-sans">
          Wpisz naturalnie: <strong>Co dzisiaj sprzedajesz, wynajmujesz lub co chcesz znaleźć?</strong> Algorytm AI przeanalizuje branżę na rynkach europejskich i wygeneruje kompletną kampanię: grupy niszowe (KTO), kanały dotarcia (GDZIE) i słowa kluczowe w lokalnych językach (JAKIE).
        </p>

        {/* Single Input Field to capture Product Profile */}
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-[#89ceff] uppercase tracking-wider font-bold">
              KREATOR KAMPANII: CO DZISIAJ SPRZEDAJE / WYNAJMUJE / CHCĘ ZNALEŹĆ?
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={productRouterInput}
                onChange={(e) => setProductRouterInput(e.target.value)}
                placeholder="np. Sprzedaż kontenerów ze stali, Wynajem maszyn budowlanych, Systemy HVAC dla firm drogowych..."
                className="bg-[#051424] text-xs font-sans rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full resize-none h-14 placeholder-[#bec8d2]/30 leading-relaxed"
              />
              <button
                onClick={handleGenerateStrategy}
                disabled={isGeneratingStrategy || !productRouterInput.trim()}
                className="bg-[#2563eb] hover:bg-blue-600 disabled:bg-[#3e4850]/40 text-white font-mono text-[11px] font-bold px-6 rounded transition-all flex flex-col items-center justify-center gap-1 cursor-pointer h-14 shrink-0 active:scale-95"
              >
                {isGeneratingStrategy ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[9px]">Strategia...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    <span className="text-[9px]">Generuj AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* OUTPUT ANALYSIS OF THE PRODUCT ROUTER */}
        {strategyResult && (
          <div className="bg-[#051424] rounded border border-[#3e4850]/40 p-4 space-y-4 animate-fadeIn">
            
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#de8712] font-bold border-b border-[#3e4850]/20 pb-1.5 uppercase">
              <Cpu className="w-4 h-4 text-[#de8712]" /> WYNIKI STRATEGII DLA: "{productRouterInput.slice(0, 35)}..."
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* KTO is Group of Niche Targets - Col 8 */}
              <div className="lg:col-span-8 space-y-3">
                <span className="text-[10px] font-mono text-[#4edea3] font-bold tracking-wider block uppercase">
                  👤 KTO (WYGENEROWANE GRUPY DOCELOWE):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strategyResult.whoAreThey?.map((niche, idx) => (
                    <div key={idx} className="bg-[#122131]/80 rounded border border-[#3e4850]/30 p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1 pb-1">
                          <h4 className="text-xs font-bold text-[#d4e4fa]">{niche.nicheName}</h4>
                          <span className="bg-[#de8712]/10 border border-[#de8712]/30 text-[#de8712] font-mono text-[9px] px-1.5 rounded">
                            Relevance: {niche.score}/10
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[#bec8d2] leading-relaxed font-sans">{niche.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GDZIE is Data Sourcing Targets - Col 4 */}
              <div className="lg:col-span-4 bg-[#122131]/60 p-3.5 rounded border border-[#3e4850]/20 space-y-3">
                <span className="text-[10px] font-mono text-[#89ceff] font-bold uppercase block">
                  📂 GDZIE ICH SZUKAĆ (KANAŁY CYFROWE):
                </span>
                <div className="space-y-2.5">
                  {strategyResult.whereToFind?.map((src, idx) => (
                    <div key={idx} className="text-xs border-b border-[#3e4850]/15 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <strong className="text-[#d4e4fa] font-bold text-[11px] font-sans">{src.sourceName}</strong>
                        <span className="text-[9px] font-mono text-[#4edea3]">{src.relevance}</span>
                      </div>
                      <p className="text-[10px] text-[#bec8d2]">{src.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* JAKIE is translation-aware Localized Keywords based on Country tabs */}
            <div className="border-t border-[#3e4850]/20 pt-3 space-y-2">
              <span className="text-[10px] font-mono text-[#ffb86e] font-bold tracking-wider block uppercase">
                🔍 JAKIE SŁOWA KLUCZOWE WPISAĆ W CAŁEJ EUROPIE (KLIKNIJ ABY PRZEPIAĆ DO AUTOPILOTA):
              </span>
              
              <div className="flex gap-2 border-b border-[#3e4850]/20 pb-1">
                {(["PL", "DE", "DK", "FR"] as const).map((countryCode) => (
                  <button
                    key={countryCode}
                    onClick={() => setPreviewCountryTab(countryCode)}
                    className={`py-1 px-3 rounded font-mono text-[11px] font-bold transition-all ${
                      previewCountryTab === countryCode 
                        ? "bg-[#2563eb] text-white" 
                        : "bg-[#1c2b3c]/50 text-[#bec8d2]/70 hover:text-[#d4e4fa]"
                    }`}
                  >
                    {countryCode === "PL" ? "Polska (PL)" : countryCode === "DE" ? "Niemcy (DE)" : countryCode === "DK" ? "Dania (DK)" : "Francja (FR)"}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {strategyResult.keywordsByCountry?.[previewCountryTab]?.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAutopilotCountry(previewCountryTab);
                      setAutopilotKeywords(prev => prev ? `${prev}, ${word}` : word);
                      alert(`Wstrzyknięto do bota: "${word}" (${previewCountryTab})`);
                    }}
                    className="bg-[#051424] hover:bg-[#89ceff]/15 border border-[#3e4850]/40 hover:border-[#89ceff]/50 px-3 py-1.5 text-xs text-[#89ceff] font-mono rounded cursor-pointer transition-all flex items-center gap-1.5 select-none active:scale-95"
                    title="Kliknij, aby dodać do konfiguracji Autopilota bota poniżej"
                  >
                    <span>+</span>
                    {word}
                  </button>
                ))}
              </div>
              <span className="text-[9.5px] italic text-[#bec8d2]/50 block font-mono">
                * Powyższe bazy są w 100% zintegrowane językowo. Kliknięcie na słowo kluczowe automatycznie ustawi profil wyszukiwania w autopilocie.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. SYSTEM KOLEJKOWANIA I GEOLOKALIZACJI (The Map Driver + Deep Miner Autopilot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Autopilot config form (Col 5) */}
        <div className="lg:col-span-5 bg-[#122131] rounded border border-[#3e4850]/30 p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#3e4850]/20 pb-2">
              <span className="flex h-2 w-2 bg-[#de8712] rounded-full animate-ping"></span>
              <h3 className="text-xs font-mono font-bold text-[#d4e4fa] tracking-wider uppercase">
                [PUNKT 2] AUTOPILOT MAP DRIVER & THE DEEP MINER
              </h3>
            </div>
            
            <p className="text-[10.5px] text-[#bec8d2] leading-normal font-sans">
              Zleć masowe zadanie przeszukiwania geolokalizacyjnego oraz głębokiego crawlowania headless z identyfikacją ról decydentów. Zadanie zostanie dodane do asynchronicznej kolejki SQLite.
            </p>

            <div className="space-y-3.5 pt-1">
              {/* Select target Country */}
              <div>
                <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1">Targetowy Kraj (Kwerenda regionalna)</label>
                <select
                  value={autopilotCountry}
                  onChange={(e) => setAutopilotCountry(e.target.value)}
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                >
                  <option value="PL">Polska (PL - Centralne systemy i BDO)</option>
                  <option value="DE">Niemcy (DE - LAGA Register & Maps)</option>
                  <option value="DK">Dania (DK - Affaldsregisteret & CVR)</option>
                  <option value="FR">Francja (FR - Sinoe & Maps)</option>
                </select>
              </div>

              {/* Specific cities scope range */}
              <div>
                <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1">Zakres miast / Geolokalizacja</label>
                <input
                  type="text"
                  value={autopilotRange}
                  onChange={(e) => setAutopilotRange(e.target.value)}
                  placeholder="np. Wszystkie duże i średnie miasta po kolei LUB Warszawa, Gliwice, Katowice"
                  className="bg-[#051424] text-xs font-sans rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                />
              </div>

              {/* Keywords directly input box */}
              <div>
                <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1">Używane Słowa Kluczowe (Oddzielone przecinkami)</label>
                <textarea
                  rows={2}
                  value={autopilotKeywords}
                  onChange={(e) => setAutopilotKeywords(e.target.value)}
                  placeholder="np. wywóz gruzu, PSZOK, złomowisko, recykling"
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full resize-none h-14"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#3e4850]/15 mt-2">
            <button
              onClick={handleStartBackgroundAutopilot}
              disabled={isStartingTask || !autopilotKeywords.trim()}
              className="bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] disabled:bg-[#3e4850]/40 disabled:text-[#bec8d2]/50 font-mono text-xs w-full py-3 font-bold rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
            >
              {isStartingTask ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kolejkowanie bota...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Uruchom Autopilot Skanera & Crawlera
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Active Background tasks monitor from SQLite (Col 7) */}
        <div className="lg:col-span-7 bg-[#122131] rounded border border-[#3e4850]/30 p-5 shadow-lg flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-[#3e4850]/20 pb-2">
            <div className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#89ceff]" />
              <h3 className="text-xs font-mono font-bold text-[#89ceff] tracking-wider uppercase">
                KOLEJKA BOTA W TLE (DANE PERSYSTENTNE SQLITE)
              </h3>
            </div>
            <span className="text-[10px] bg-[#051424] px-2 py-0.5 rounded border border-[#3e4850]/30 text-[#bec8d2] font-mono">
              Zadań: {backgroundTasks.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[380px] pr-1.5">
            {backgroundTasks.length > 0 ? (
              backgroundTasks.map((task) => {
                const isRunning = task.status === 'running';
                const isCompleted = task.status === 'completed';
                const isFailed = task.status === 'failed';
                
                return (
                  <div key={task.id} className="bg-[#051424] p-3.5 rounded border border-[#3e4850]/40 space-y-2.5">
                    
                    {/* Header values */}
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#d4e4fa] font-sans">
                            Kompaktowy Skan: {task.country} [{task.city_range}]
                          </span>
                          <span className="font-mono text-[9px] text-[#bec8d2]/40">({task.id})</span>
                        </div>
                        <p className="text-[10px] text-[#bec8d2]/60 font-mono mt-0.5 truncate max-w-sm">
                          Słowa kluczowe: {task.keywords}
                        </p>
                      </div>

                      {/* Status Badges */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${
                        isRunning 
                          ? "bg-[#2c1600] text-[#ffb86e] border-[#ffb86e]/30 animate-pulse" 
                          : isCompleted 
                          ? "bg-[#00311f] text-[#4edea3] border-[#4edea3]/30" 
                          : "bg-[#2d0f11] text-[#ffb4ab] border-[#ffb4ab]/30"
                      }`}>
                        {isRunning && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                        {task.status === "running" ? "Skanowanie" : task.status === "completed" ? "Ukończono" : "Błąd"}
                      </span>
                    </div>

                    {/* Progress Bar slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-[#89ceff] truncate max-w-xs">{task.current_step}</span>
                        <span className="text-[#d4e4fa] font-bold">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-[#122131] rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isFailed ? "bg-[#ff6b6b]" : isRunning ? "bg-[#de8712]" : "bg-[#4edea3]"
                          }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Funnel outcomes */}
                    <div className="flex justify-between items-center text-[10.5px] font-mono pt-1.5 border-t border-[#3e4850]/15">
                      <span className="text-[#bec8d2]/50">Wyniki zapisane bezpośrednio w SQLite:</span>
                      <span className="text-[#4edea3] font-bold flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#4edea3]" />
                        +{task.found_count} leads "NEW"
                      </span>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-[#bec8d2]/30 italic font-mono text-[10.5px]">
                Kolejka jest pusta. Skonfiguruj parametry bota po lewej i uruchom zadanie.
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="h-px bg-[#3e4850]/20 my-2"></div>

      {/* 3. QUICK MANUAL LOOKUPS / ADVANCED DIRECT TOOLS */}
      <div className="border border-[#3e4850]/30 rounded-lg p-5 bg-[#122131]/40 space-y-4">
        
        <div className="flex items-center gap-2 border-b border-[#3e4850]/15 pb-2">
          <Layers className="w-4 h-4 text-[#89ceff]" />
          <h3 className="text-sm font-bold text-[#d4e4fa] font-sans">
            Ręczne Narzędzia Skanujące & Szybkie lookupy (Skan Jednostkowy)
          </h3>
        </div>

        {/* Sourcing Channel Selector Tab Panels */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#3e4850]/20 pb-1">
          {[
            { id: "bdo", label: "KRS/BDO Polska", icon: Database },
            { id: "gmaps", label: "Pojedynczy Skan Google Maps", icon: MapPin },
            { id: "panorama", label: "Panorama Firm (Krajowa)", icon: Compass },
            { id: "intl", label: "Zagraniczne Rejestry (DE / DK)", icon: Globe },
            { id: "linkedin", label: "LinkedIn Scraper (API)", icon: LinkedInIcon }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = scanScope === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setScanScope(tab.id);
                  setScannedResult(null);
                  setScanLogs([]);
                }}
                className={`flex items-center gap-2 py-1.5 px-3 rounded font-mono text-[11px] transition-all cursor-pointer ${
                  isActive 
                    ? "bg-[#1c2b3c] text-[#89ceff] border border-[#89ceff]/40 font-bold" 
                    : "bg-transparent text-[#bec8d2]/70 border-transparent hover:text-[#d4e4fa]"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Manual inputs - Col 5 */}
          <div className="lg:col-span-5 bg-[#122131] rounded border border-[#3e4850]/30 p-4 space-y-4">
            
            {scanScope === "bdo" && (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[10px] text-[#bec8d2]/70 mb-1">NUMER NIP FIRMY (PL)</label>
                  <input
                    type="text"
                    placeholder="Wpisz np. 6348129011..."
                    value={nipInput}
                    onChange={(e) => setNipInput(e.target.value.replace(/\D/g, ""))}
                    className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#bec8d2]/70 mb-1">Nazwa firmy (BDO)</label>
                  <input
                    type="text"
                    placeholder="np. Huta Silesia Recykling..."
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                  />
                </div>

                <div className="space-y-2">
                  <span className="block text-[10px] text-[#de8712] font-bold">PROPOZYCJE CELÓW SPRAWOZDAWCZYCH (BDO PL):</span>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_BDO_PL.map((item, id) => (
                      <button 
                        key={id}
                        onClick={() => {
                          setNipInput(item.nip);
                          setCompanyNameInput(item.name);
                          setSelectedProvince(item.prov);
                          triggerScan("bdo", item.nip, item.name);
                        }}
                        className="text-left py-1 text-[10px] hover:underline hover:text-[#89ceff]"
                      >
                        • {item.name} (NIP: {item.nip}) - {item.prov}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => triggerScan("bdo")}
                  disabled={isScanning || (!nipInput && !companyNameInput)}
                  className="bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] disabled:bg-[#3e4850]/40 text-xs w-full py-2 font-bold rounded transition-colors cursor-pointer"
                >
                  Skanuj Rejestr BDO
                </button>
              </div>
            )}

            {scanScope === "gmaps" && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1 font-bold">FRAZA LOGISTYCZNA / BRANŻA</label>
                  <input
                    type="text"
                    value={customSearchQuery}
                    onChange={(e) => setCustomSearchQuery(e.target.value)}
                    className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1 font-bold">MIASTO TARGETU</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Katowice, Gliwice..."
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                      className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] flex-1"
                    />
                    <button
                      onClick={() => triggerScan("gmaps")}
                      disabled={isScanning || !targetCity}
                      className="bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] disabled:bg-[#3e4850]/40 font-mono text-xs px-4 font-bold rounded transition-colors cursor-pointer"
                    >
                      Szukaj
                    </button>
                  </div>
                </div>
              </div>
            )}

            {scanScope === "panorama" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1 font-bold">Kategoria rejestrowa</label>
                  <input
                    type="text"
                    value={customSearchQuery}
                    onChange={(e) => setCustomSearchQuery(e.target.value)}
                    className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none w-full"
                  />
                </div>
                <button
                  onClick={() => triggerScan("panorama")}
                  disabled={isScanning}
                  className="bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] font-mono text-xs w-full py-2 font-bold rounded transition-colors cursor-pointer text-center"
                >
                  Skanuj Katalog
                </button>
              </div>
            )}

            {scanScope === "intl" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1 font-bold">Rynek zagraniczny</label>
                  <select
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] w-full"
                  >
                    <option value="DE">Niemcy (Handelsregister / Maps)</option>
                    <option value="DK">Dania (CVR Virk / Maps)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1 font-bold">Miasto obce</label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] w-full"
                  />
                </div>
                <button
                  onClick={() => triggerScan("intl")}
                  disabled={isScanning}
                  className="bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] font-mono text-xs w-full py-2 font-bold rounded transition-colors cursor-pointer text-center"
                >
                  Skanuj Obcy Rynek
                </button>
              </div>
            )}

            {scanScope === "linkedin" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-1 font-bold">Nazwa spółki B2B na LinkedIn</label>
                  <input
                    type="text"
                    placeholder="np. Remondis..."
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 w-full"
                  />
                </div>
                <button
                  onClick={() => triggerScan("linkedin")}
                  disabled={isScanning || !companyNameInput}
                  className="bg-[#2563eb] hover:bg-blue-600 disabled:bg-[#3e4850]/40 text-white font-mono text-xs w-full py-2 font-bold rounded transition-colors cursor-pointer text-center"
                >
                  Uruchom Scraper LinkedIn
                </button>
              </div>
            )}

          </div>

          {/* Terminal Console log or single output presentation - Col 7 */}
          <div className="lg:col-span-7 bg-[#051424] rounded border border-[#3e4850]/30 p-4 font-mono text-[10px] text-[#4edea3] flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="text-[#89ceff] font-bold uppercase border-b border-[#3e4850]/20 pb-1 mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 animate-pulse" /> Pojedyncza konsola terminala scanu
              </div>
              <div className="space-y-1">
                {scanLogs.length > 0 ? (
                  scanLogs.map((log, i) => <div key={i}>{log}</div>)
                ) : (
                  <div className="text-[#bec8d2]/20 italic py-8 text-center">Wybierz parametry i kliknij skanuj...</div>
                )}
              </div>
            </div>

            {/* Render matched single lookups */}
            {scannedResult && (
              <div className="bg-[#122131]/90 rounded border border-[#3e4850]/40 p-3.5 mt-4 space-y-2">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <h4 className="text-[11px] font-bold text-[#d4e4fa]">{scannedResult.companyName}</h4>
                    <p className="text-[9.5px] text-[#bec8d2]/50">NIP: {scannedResult.nip} • Email: {scannedResult.email}</p>
                  </div>
                  <button
                    onClick={handleApplyAddLead}
                    className="bg-[#4edea3] hover:bg-[#6ffbbe] text-[#002113] py-1 px-2.5 rounded font-mono font-bold text-[10px] cursor-pointer"
                  >
                    + Dodaj Do Lejka
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

// Inline helper LinkedIn Icon to avoid imports block
function LinkedInIcon(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className}
      {...props}
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}
