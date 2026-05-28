/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { 
  Building2, 
  UserCheck, 
  Send, 
  Mail, 
  Download, 
  Recycle, 
  Globe, 
  Briefcase, 
  Activity, 
  Cpu, 
  Cpu as Brain, 
  ChevronRight,
  ExternalLink,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Copy,
  Check
} from "lucide-react";
import { Lead, FunnelState, SystemHealthState } from "../types";
import { 
  SIMULATED_FOUND_COMPANIES, 
  SIMULATED_DECISION_MAKERS, 
  SIMULATED_SENT_OFFERS,
  SimulatedCompany,
  SimulatedDecisionMaker,
  SimulatedSentOffer
} from "../data/simulatedExplorers";

interface DashboardProps {
  leads: Lead[];
  funnel: FunnelState;
  setFunnel: Dispatch<SetStateAction<FunnelState>>;
  health: SystemHealthState;
  setHealth: Dispatch<SetStateAction<SystemHealthState>>;
  onAnalyzeLeadInRecon: (leadId: string) => void;
  onUpdateBdoStatus: (leadId: string, status: 'Aktywny' | 'Weryfikacja' | 'Wygasły') => void;
  activeRole: string;
}

export default function Dashboard({
  leads,
  funnel,
  setFunnel,
  health,
  setHealth,
  onAnalyzeLeadInRecon,
  onUpdateBdoStatus,
  activeRole
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBdoFilter, setSelectedBdoFilter] = useState<string>("WSZYSTKIE");
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<Lead | null>(null);
  const [showPitchDownloader, setShowPitchDownloader] = useState(false);
  const [activeTabLog, setActiveTabLog] = useState<string>("CLI");
  
  // Interactive Funnel Explorer states
  const [activeExplorerTab, setActiveExplorerTab] = useState<"found" | "dms" | "offers">("found");
  const [selectedSentOffer, setSelectedSentOffer] = useState<SimulatedSentOffer | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const [systemAlerts, setSystemAlerts] = useState<string[]>([
    "Pomyślnie załadowano bazę modułu 'The Vault v2.4'",
    "Model Ollama/Gemma 2 9B oczekuje w stanie gotowości",
    "RODO Compliance Check: Wszystkie wpisy zweryfikowane pozytywnie"
  ]);

  // Simulate dynamically fluctuating CPU/RAM memory to bring the console to life!
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newCpu = Math.max(70, Math.min(92, prev.cpuLoad + delta));
        return {
          ...prev,
          cpuLoad: newCpu
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [setHealth]);

  // --- COMBINED WORKFLOW DATASETS ---
  // 1. Combined Found List (Real State + Simulated)
  const combinedFoundList = [
    ...leads.map(lead => ({
      id: lead.id,
      companyName: lead.companyName,
      nip: lead.nip,
      bdoNumber: lead.bdoNumber,
      city: lead.address.split(',')[1]?.trim() || "Chorzów",
      province: lead.province,
      industry: lead.industry,
      sourceType: lead.sources.includes('recycling') ? 'BDO' : 'Google Maps',
      bdoStatus: lead.bdoStatus,
      isRealLead: true
    })),
    ...SIMULATED_FOUND_COMPANIES.map(sc => ({
      ...sc,
      isRealLead: false
    }))
  ];

  // 2. Combined Decision Makers List (Real State DMUs + Simulated)
  const combinedDMsList = [
    ...leads
      .filter(l => l.decisionMakerName && l.decisionMakerName !== "Brak danych")
      .map(l => ({
        id: `real-dm-${l.id}`,
        name: l.decisionMakerName,
        role: l.decisionMakerRole,
        companyName: l.companyName,
        relevance: l.decisionMakerRelevance || 9,
        email: l.email,
        phone: l.phone,
        linkedInUrl: "https://linkedin.com",
        isRealLead: true,
        leadId: l.id
      })),
    ...SIMULATED_DECISION_MAKERS.map(dm => ({
      ...dm,
      isRealLead: false,
      leadId: null
    }))
  ];

  // --- REACTIVE FILTERS CONTROLLER ---
  // A. Filtering found companies
  const filteredFound = combinedFoundList.filter((item) => {
    const matchesSearch = 
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nip.includes(searchTerm) ||
      item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.province.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedBdoFilter === "WSZYSTKIE") return matchesSearch;
    return matchesSearch && item.bdoStatus.toUpperCase() === selectedBdoFilter.toUpperCase();
  });

  // B. Filtering Decision Makers (DMUs)
  const filteredDMs = combinedDMsList.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // C. Filtering Sent Offers (Pitches)
  const filteredOffers = SIMULATED_SENT_OFFERS.filter((item) => {
    const matchesSearch = 
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (selectedBdoFilter === "WSZYSTKIE") return matchesSearch;
    return matchesSearch && item.status.toUpperCase() === selectedBdoFilter.toUpperCase();
  });

  // --- TRANSITION AND CLIPBOARD ACTIONS ---
  const handleOpenCompanyPreview = (item: any) => {
    if (item.isRealLead) {
      const realLead = leads.find(l => l.id === item.id);
      if (realLead) {
        setSelectedLeadDetails(realLead);
      }
    } else {
      const associatedDm = SIMULATED_DECISION_MAKERS.find(dm => dm.companyName === item.companyName);
      const simulatedLead: Lead = {
        id: item.id,
        companyName: item.companyName,
        nip: item.nip,
        regon: "REG-238410940",
        bdoNumber: item.bdoNumber,
        province: item.province,
        industry: item.industry,
        sources: [item.sourceType.toLowerCase() === 'bdo' ? 'recycling' : 'language'],
        bdoStatus: item.bdoStatus,
        decisionMakerName: associatedDm ? associatedDm.name : "Do zidentyfikowania",
        decisionMakerRole: associatedDm ? associatedDm.role : "Do zidentyfikowania w module Recon",
        decisionMakerRelevance: associatedDm ? associatedDm.relevance : 8,
        email: associatedDm ? associatedDm.email : "einkauf@m-schrott.de",
        phone: associatedDm ? associatedDm.phone : "+49 351 445209",
        address: `${item.city}, Rzeczypospolitej`,
        website: `https://www.${item.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        scannedAt: "2026-05-24 16:30",
        rawTextSample: `Zindeksowany rekord z bazy ${item.sourceType}. Wykazuje aktywne numery sprawozdawcze i aktywną działalność gospodarczą. Decydent przypisany automatycznie.`
      };
      setSelectedLeadDetails(simulatedLead);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToast(`Skopiowano ${label} do schowka!`);
      setTimeout(() => setCopiedToast(null), 2500);
    }).catch(() => {
      // fallback
    });
  };

  const handleDownloadPitches = () => {
    setShowPitchDownloader(true);
  };

  const handleSimulateOfferSent = (id: string) => {
    setFunnel(p => ({ ...p, sentOffersCount: p.sentOffersCount + 1 }));
    setSystemAlerts(prev => [
      `Wysłano spersonalizowaną ofertę B2B do ${leads.find(l => l.id === id)?.companyName || 'Lead'}`,
      ...prev
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Alert Banner / Active Agent Info */}
      <div className="bg-[#122131] border-l-4 border-[#89ceff] p-3 rounded-r flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-[#89ceff] animate-pulse" />
          <span className="text-xs font-mono text-[#bec8d2]">
            Aktywna perspektywa operacyjna: <strong className="text-[#89ceff] uppercase">{activeRole}</strong>. Monitorujesz system w czasie rzeczywistym.
          </span>
        </div>
        <div className="hidden md:flex gap-2 text-[11px] font-mono text-[#bec8d2]/70">
          <span>Strefa czasowa: UTC 2026</span>
        </div>
      </div>

      {/* TOP ROW: Sales Funnel (Lejek Sprzedażowy) */}
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-[#d4e4fa] flex items-center gap-2">
          <span className="w-1.5 h-3 bg-[#89ceff] rounded-sm"></span>
          Statystyki Lejka Wykonywania (The Vault Core)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1: Found in database */}
          <button 
            onClick={() => setActiveExplorerTab("found")}
            className={`text-left p-5 rounded border relative overflow-hidden group transition-all select-none active:scale-[98%] cursor-pointer focus:outline-none ${
              activeExplorerTab === "found"
                ? "bg-[#1c2b3c]/80 border-[#89ceff] border-t-4 border-t-[#89ceff] shadow-lg shadow-[#89ceff]/10"
                : "bg-[#122131] border-[#3e4850]/30 border-t-2 border-t-[#89ceff]/70 hover:border-[#89ceff]/50"
            }`}
          >
            <div className="absolute -right-3 -bottom-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
              <Building2 className="w-24 h-24 text-white" />
            </div>
            <div className="flex justify-between items-center mb-1">
              <p className="font-mono text-[10px] text-[#bec8d2] tracking-wider uppercase">Znaleziono w bazie</p>
              {activeExplorerTab === "found" && (
                <span className="text-[8px] bg-[#89ceff]/20 text-[#89ceff] px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">PODGLĄD</span>
              )}
            </div>
            <div className="text-3xl font-bold text-[#d4e4fa] font-sans flex items-baseline gap-1.5">
              <span>{leads.length * 15 + 10}</span>
              <span className="text-[12px] text-[#89ceff] font-mono font-medium">Aktualizowana</span>
            </div>
            <p className="font-mono text-xs text-[#89ceff]/70 mt-1">kliknij, aby wyświetlić {leads.length * 15 + 10} firm</p>
          </button>

          {/* Step 2: Identified Decision Makers */}
          <button 
            onClick={() => setActiveExplorerTab("dms")}
            className={`text-left p-5 rounded border relative overflow-hidden group transition-all select-none active:scale-[98%] cursor-pointer focus:outline-none ${
              activeExplorerTab === "dms"
                ? "bg-[#1c2b3c]/80 border-[#4edea3] border-t-4 border-t-[#4edea3] shadow-lg shadow-[#4edea3]/10"
                : "bg-[#122131] border-[#3e4850]/30 border-t-2 border-t-[#4edea3]/70 hover:border-[#4edea3]/50"
            }`}
          >
            <div className="absolute -right-3 -bottom-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
              <UserCheck className="w-24 h-24 text-white" />
            </div>
            <div className="flex justify-between items-center mb-1">
              <p className="font-mono text-[10px] text-[#bec8d2] tracking-wider uppercase">Zidentyfikowano decydentów</p>
              {activeExplorerTab === "dms" && (
                <span className="text-[8px] bg-[#4edea3]/20 text-[#4edea3] px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">PODGLĄD</span>
              )}
            </div>
            <div className="text-3xl font-bold text-[#4edea3] font-sans">
              {funnel.identifiedDMsCount}
            </div>
            <p className="font-mono text-xs text-[#4edea3]/70 mt-1">kliknij, aby wyświetlić {funnel.identifiedDMsCount} osób</p>
          </button>

          {/* Step 3: Sent offers */}
          <button 
            onClick={() => setActiveExplorerTab("offers")}
            className={`text-left p-5 rounded border relative overflow-hidden group transition-all select-none active:scale-[98%] cursor-pointer focus:outline-none ${
              activeExplorerTab === "offers"
                ? "bg-[#1c2b3c]/80 border-[#ffb86e] border-t-4 border-t-[#ffb86e] shadow-lg shadow-[#ffb86e]/10"
                : "bg-[#122131] border-[#3e4850]/30 border-t-2 border-t-[#ffb86e]/70 hover:border-[#ffb86e]/50"
            }`}
          >
            <div className="absolute -right-3 -bottom-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
              <Send className="w-24 h-24 text-white" />
            </div>
            <div className="flex justify-between items-center mb-1">
              <p className="font-mono text-[10px] text-[#bec8d2] tracking-wider uppercase">Wysłano oferty</p>
              {activeExplorerTab === "offers" && (
                <span className="text-[8px] bg-[#ffb86e]/20 text-[#ffb86e] px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">PODGLĄD</span>
              )}
            </div>
            <div className="text-3xl font-bold text-[#ffb86e] font-sans">
              {funnel.sentOffersCount}
            </div>
            <p className="font-mono text-xs text-[#ffb86e]/70 mt-1">kliknij, aby przeglądać {funnel.sentOffersCount} cold pitchy</p>
          </button>

          {/* Step 4 */}
          <button 
            onClick={handleDownloadPitches}
            className="text-left bg-[#122131] p-5 rounded border border-[#0ea5e9]/50 border-t-2 border-t-[#0ea5e9] relative overflow-hidden group cursor-pointer hover:bg-[#1c2b3c] transition-all focus:outline-none"
          >
            <div className="absolute -right-3 -bottom-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
              <Mail className="w-24 h-24 text-white" />
            </div>
            <div className="flex justify-between items-start mb-1">
              <p className="font-mono text-[10px] text-[#bec8d2] tracking-wider uppercase">Spływ Odpowiedzi</p>
              <Download className="w-4 h-4 text-[#0ea5e9] group-hover:bounce transition-transform" />
            </div>
            <div className="text-3xl font-bold text-[#0ea5e9] font-sans">
              {funnel.responsesCount}
            </div>
            <p className="font-mono text-xs text-[#0ea5e9]/70 mt-1 underline hover:text-[#89ceff]">pobierz maile i oferty</p>
          </button>
        </div>
      </section>

      {/* MIDDLE ROW: Live Feed & System Health Gird */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Interaktywny Eksplorator Lejka Operacyjnego (Col Span 8) */}
        <section className="xl:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#d4e4fa] flex items-center gap-2">
              <span className={`w-1.5 h-3 rounded-sm ${
                activeExplorerTab === 'found' ? 'bg-[#89ceff]' : activeExplorerTab === 'dms' ? 'bg-[#4edea3]' : 'bg-[#ffb86e]'
              }`}></span>
              {activeExplorerTab === 'found' && `Wyszukana Baza firm z rejestru BDO / Krajowego (${filteredFound.length} firm)`}
              {activeExplorerTab === 'dms' && `Zidentyfikowane Profile Decydentów - DMU (${filteredDMs.length} osób)`}
              {activeExplorerTab === 'offers' && `Dziennik Wysłanych Ofert & Cold Pitching (${filteredOffers.length} wysłanych)`}
            </h3>
            
            {/* Dynamic Filters depending on active tab */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    activeExplorerTab === 'found' ? "Filtruj firmy / NIP..." :
                    activeExplorerTab === 'dms' ? "Filtruj decydentów..." : "Filtruj oferty..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-1.5 pl-7 pr-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-40 sm:w-48 placeholder-[#bec8d2]/40"
                />
                <Search className="w-3.5 h-3.5 text-[#bec8d2]/50 absolute left-2 top-2" />
              </div>

              {/* Status Select Toggle - conditional on tab */}
              {activeExplorerTab === 'found' && (
                <select
                  value={selectedBdoFilter}
                  onChange={(e) => setSelectedBdoFilter(e.target.value)}
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-1.5 px-2 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff]"
                >
                  <option value="WSZYSTKIE">Wszyscy BDO</option>
                  <option value="AKTYWNY">Aktywny</option>
                  <option value="WERYFIKACJA">Weryfikacja</option>
                  <option value="WYGASŁY">Wygasły</option>
                </select>
              )}

              {activeExplorerTab === 'offers' && (
                <select
                  value={selectedBdoFilter}
                  onChange={(e) => setSelectedBdoFilter(e.target.value)}
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-1.5 px-2 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff]"
                >
                  <option value="WSZYSTKIE">Wszelkie statusy</option>
                  <option value="AKTYWNY">Aktywny</option>
                  <option value="DOSTARCZONO">Dostarczono</option>
                  <option value="OTWARTO">Otwarto</option>
                  <option value="ODPOWIEDŹ!">Odpowiedź!</option>
                  <option value="KLIKNIĘTO LINK">Kliknięto link</option>
                </select>
              )}

              {activeExplorerTab === 'dms' && (
                <span className="hidden sm:inline text-[10px] text-[#bec8d2]/50 font-mono border border-[#3e4850]/20 rounded px-2 py-1 bg-[#122131]">
                  Verified Profiles (DMU)
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#122131] rounded border border-[#3e4850]/30 overflow-hidden min-h-[300px]">
            <div className="overflow-x-auto">
              
              {/* TAB 1: FOUND COMPANIES LISTING */}
              {activeExplorerTab === "found" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1c2b3c]/60 border-b border-[#3e4850]/30">
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">PODMIOT / REJESTR</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">METODA DETEKCJI</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">STATUS BDO</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">LOKALIZACJA</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider text-right">AKCJA</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs divide-y divide-[#3e4850]/20">
                    {filteredFound.length > 0 ? (
                      filteredFound.map((item) => (
                        <tr key={item.id} className="hover:bg-[#1c2b3c]/40 transition-colors">
                          <td className="py-3 px-4 font-sans font-medium text-[#d4e4fa] max-w-[200px] truncate">
                            <div className="flex items-center gap-1.5">
                              {item.isRealLead && (
                                <span className="w-1.5 h-1.5 bg-[#4edea3] rounded-full animate-pulse" title="Profil Profilowany Live"></span>
                              )}
                              <span>{item.companyName}</span>
                            </div>
                            <div className="font-mono text-[10px] text-[#bec8d2]/60 mt-0.5">
                              NIP: {item.nip}
                              {item.isRealLead && <span className="text-[#4edea3] font-bold ml-2">● LIVE FEED</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#1a2d3e] text-[#89ceff] border border-[#294c65] text-[10px] font-bold">
                              {item.sourceType === "BDO" ? <Recycle className="w-3 h-3 text-[#89ceff]" /> : <Globe className="w-3 h-3 text-[#4edea3]" />}
                              {item.sourceType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                              item.bdoStatus === 'Aktywny' 
                                ? 'bg-[#00311f]/40 text-[#4edea3] border-[#4edea3]/30' 
                                : item.bdoStatus === 'Weryfikacja'
                                ? 'bg-[#273647]/50 text-[#bec8d2] border-[#bec8d2]/30'
                                : 'bg-[#93000a]/20 text-[#ffb4ab] border-[#ffb4ab]/30'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${
                                item.bdoStatus === 'Aktywny' ? 'bg-[#4edea3]' : item.bdoStatus === 'Weryfikacja' ? 'bg-[#bec8d2]' : 'bg-[#ffb4ab]'
                              }`}></span>
                              {item.bdoStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#bec8d2] text-[11px]">
                            {item.city} <span className="text-[#bec8d2]/50">({item.province})</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenCompanyPreview(item)}
                                className="px-2.5 py-1 bg-[#273647] hover:bg-[#1c2b3c] text-[#d4e4fa] rounded-sm text-[10px] font-sans border border-[#3e4850]/40 cursor-pointer transition-colors"
                              >
                                Szczegóły
                              </button>
                              {item.isRealLead ? (
                                <button
                                  onClick={() => onAnalyzeLeadInRecon(item.id)}
                                  className="px-2 py-1 bg-[#0ea5e9]/10 hover:bg-[#0ea5e9]/30 text-[#89ceff] rounded-sm text-[10px] font-sans border border-[#0ea5e9]/35 cursor-pointer transition-colors"
                                >
                                  Recon AI
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleOpenCompanyPreview(item);
                                    setSystemAlerts(prev => [
                                      `Wymuszono synchronizację sprawozdawczego decydenta dla ${item.companyName}`,
                                      ...prev
                                    ]);
                                  }}
                                  className="px-2 py-1 bg-[#de8712]/10 hover:bg-[#de8712]/30 text-[#ffb86e] rounded-sm text-[10px] font-sans border border-[#de8712]/35 cursor-pointer transition-colors"
                                >
                                  Badaj DMU
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#bec8d2]/40 font-sans italic">
                          Brak wyników wyszukiwania o zadanych parametrach.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 2: DECISION MAKERS LISTING */}
              {activeExplorerTab === "dms" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1c2b3c]/60 border-b border-[#3e4850]/30">
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">DECYDENT (OSIE DMU)</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">PODMIOT DOCELOWY</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">SCORING RELEVANCE</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">DANE KONTAKTOWE</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider text-right">AKCJA</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs divide-y divide-[#3e4850]/20">
                    {filteredDMs.length > 0 ? (
                      filteredDMs.map((dm) => (
                        <tr key={dm.id} className="hover:bg-[#1c2b3c]/40 transition-colors">
                          <td className="py-3.5 px-4 font-sans text-xs">
                            <div className="font-bold text-[#4edea3] flex items-center gap-1.5">
                              <span className="w-1 h-3 bg-[#4edea3] rounded-sm"></span>
                              {dm.name}
                            </div>
                            <div className="font-mono text-[10px] text-[#bec8d2]/70 mt-0.5">{dm.role}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#d4e4fa] max-w-[150px] truncate">
                            <span className="block truncate">{dm.companyName}</span>
                            {dm.isRealLead && (
                              <span className="text-[9px] text-[#4edea3] font-bold bg-[#4edea3]/10 border border-[#4edea3]/30 px-1.5 py-0.2 rounded-sm">LIVE FEED</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1 bg-[#1a2d3e]/60 border border-[#3e4850]/30 py-0.5 px-2 rounded-sm w-fit">
                              <span className="text-amber-400">★</span>
                              <span className="text-[#d4e4fa] font-bold text-[10px]">{dm.relevance}/10</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 grid grid-cols-1 gap-1 text-[10px] text-[#bec8d2]">
                            <div className="flex items-center gap-1">
                              <span className="text-[#89ceff]">✉</span>
                              <span className="truncate max-w-[140px]" title={dm.email}>{dm.email}</span>
                              <button 
                                onClick={() => handleCopyToClipboard(dm.email, "email")}
                                className="text-[#bec8d2]/40 hover:text-[#89ceff] cursor-pointer"
                                title="Kopiuj email"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#ffb86e]">☎</span>
                              <span>{dm.phone}</span>
                              <button 
                                onClick={() => handleCopyToClipboard(dm.phone, "telefon")}
                                className="text-[#bec8d2]/40 hover:text-[#ffb86e] cursor-pointer"
                                title="Kopiuj telefon"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {dm.isRealLead ? (
                              <button
                                onClick={() => onAnalyzeLeadInRecon(dm.leadId!)}
                                className="px-2.5 py-1.5 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#001e13] font-bold rounded-sm text-[10px] font-sans cursor-pointer transition-colors"
                              >
                                Analiza AI
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  // Find appropriate pitch to copy
                                  const offer = SIMULATED_SENT_OFFERS.find(o => o.companyName === dm.companyName);
                                  if (offer) {
                                    handleCopyToClipboard(offer.pitchContent, "spersonalizowaną ofertę BDO");
                                  } else {
                                    handleCopyToClipboard(`Dzień dobry ${dm.name},\nPropozycja współpracy BDO dlastali z ${dm.companyName}.`, "draft");
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-[#de8712] hover:bg-[#ffb457] text-[#2c1600] font-bold rounded-sm text-[10px] font-sans cursor-pointer transition-colors flex items-center gap-1 ml-auto"
                              >
                                <Copy className="w-3 h-3" /> Skopiuj Pitch
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#bec8d2]/40 font-sans italic">
                          Brak wyników wyszukiwania o zadanych parametrach.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 3: SENT OFFERS LISTING */}
              {activeExplorerTab === "offers" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1c2b3c]/60 border-b border-[#3e4850]/30">
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">ODBIORCA & PODMIOT</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">TEMAT WIADOMOŚCI (SUBJECT LINE)</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">DATA WYSŁANIA</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider">STATUS EWIDENCYJNY</th>
                      <th className="py-2.5 px-4 font-mono text-[10px] text-[#bec8d2] font-semibold tracking-wider text-right">ZABEZPIECZONA TREŚĆ</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs divide-y divide-[#3e4850]/20">
                    {filteredOffers.length > 0 ? (
                      filteredOffers.map((offer) => (
                        <tr key={offer.id} className="hover:bg-[#1c2b3c]/40 transition-colors">
                          <td className="py-3 px-4 font-sans text-xs">
                            <span className="block font-bold text-[#d4e4fa]">{offer.recipientName}</span>
                            <span className="block font-mono text-[9px] text-[#bec8d2]/60 mt-0.5">{offer.companyName}</span>
                          </td>
                          <td className="py-3 px-4 text-[#89ceff] text-[11px] max-w-[220px] truncate" title={offer.subject}>
                            {offer.subject}
                          </td>
                          <td className="py-3 px-4 text-[#bec8d2] text-[10px]">
                            {offer.sentDate}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10.5px] font-bold border ${
                              offer.status === 'Odpowiedź!' 
                                ? 'bg-[#00311f]/40 text-[#4edea3] border-[#4edea3]/40' 
                                : offer.status === 'Otwarto'
                                ? 'bg-[#2c1600] text-[#ffb86e] border-[#ffb86e]/30'
                                : offer.status === 'Kliknięto link'
                                ? 'bg-[#0c4a6e] text-[#0ea5e9] border-[#0ea5e9]/40'
                                : 'bg-[#1c2b3c] text-[#bec8d2]/70 border-transparent'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${
                                offer.status === 'Odpowiedź!' ? 'bg-[#4edea3]' : offer.status === 'Otwarto' ? 'bg-[#ffb86e]' : offer.status === 'Kliknięto link' ? 'bg-[#0ea5e9]' : 'bg-[#bec8d2]'
                              }`}></span>
                              {offer.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedSentOffer(offer)}
                                className="px-2.5 py-1 bg-[#122131] hover:bg-[#1c2b3c] text-[#ffb86e] rounded-sm text-[10px] font-sans border border-[#ffb86e]/30 cursor-pointer flex items-center gap-1 transition-colors"
                              >
                                <Eye className="w-3 h-3" /> Pokaż
                              </button>
                              <button
                                onClick={() => handleCopyToClipboard(offer.pitchContent, "treść oferty")}
                                className="px-2 py-1 bg-[#273647] hover:bg-[#3e4850]/50 text-[#89ceff] rounded-sm text-[10px] font-sans border border-[#3e4850]/55 cursor-pointer flex items-center gap-1 transition-colors"
                                title="Szybkie kopiowanie"
                              >
                                <Copy className="w-3 h-3" /> Kopiuj
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#bec8d2]/40 font-sans italic">
                          Brak wyników wyszukiwania o zadanych parametrach.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        </section>

        {/* System Health Widget (Col Span 4) */}
        <section className="col-span-1 xl:col-span-4 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-[#d4e4fa] flex items-center gap-2">
            <span className="w-1.5 h-3 bg-[#ffb86e] rounded-sm"></span>
            System Health & Inference Engine
          </h3>

          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 flex flex-col gap-5 h-full">
            {/* Hardware Metrics */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-mono text-[10px] text-[#bec8d2] tracking-wider uppercase">Host Node</span>
                <span className="font-mono text-xs text-[#d4e4fa] bg-[#273647] px-2 py-0.5 rounded border border-[#3e4850]/40">Mac mini M4 Pro</span>
              </div>

              <div className="space-y-3">
                {/* CPU Load */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-[#bec8d2]/70">CPU LOAD</span>
                    <span className="text-[#ffb86e] font-bold">{health.cpuLoad}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#051424] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#ffb86e] transition-all duration-1000 relative" 
                      style={{ width: `${health.cpuLoad}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* RAM */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-[#bec8d2]/70">MEMORY ALLOCATION</span>
                    <span className="text-[#89ceff] font-bold">{health.memoryAlloc}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#051424] rounded-full overflow-hidden">
                    <div className="h-full bg-[#89ceff] w-[77.5%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#3e4850]/20"></div>

            {/* LLM Status */}
            <div className="flex-1 flex flex-col">
              <span className="font-mono text-[10px] text-[#bec8d2] tracking-wider uppercase mb-2">Inference Engine</span>
              
              <div className="bg-[#051424] p-3 rounded border border-[#3e4850]/30 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex items-center justify-center">
                    <Brain className="text-[#4edea3] w-6 h-6 z-10" />
                    <div className="absolute inset-0 bg-[#4edea3]/20 blur-md rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-[#d4e4fa]">{health.activeModel}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                      <span className="font-mono text-[9px] text-[#4edea3] tracking-widest uppercase">Active & Processing</span>
                    </div>
                  </div>
                </div>

                {/* Live Output preview */}
                <div className="p-2.5 bg-[#122131] rounded border border-[#3e4850]/40 font-mono text-[10px] text-[#bec8d2] flex-1 min-h-[70px]">
                  <span className="text-[#89ceff]">&gt;</span> <span className="animate-pulse">{health.currentLog}</span>
                  <div className="mt-1 text-[#4edea3]/80">Status: OK | Listening _</div>
                </div>
              </div>
            </div>

            {/* Quick Logging Tabs */}
            <div className="mt-2">
              <div className="flex border-b border-[#3e4850]/30 text-[10px] font-mono mb-2">
                <button 
                  onClick={() => setActiveTabLog("CLI")} 
                  className={`px-3 py-1 cursor-pointer ${activeTabLog === "CLI" ? "border-b-2 border-[#89ceff] text-[#89ceff] font-bold" : "text-[#bec8d2]/50"}`}
                >
                  Dziennik (CLI)
                </button>
                <button 
                  onClick={() => setActiveTabLog("ALERTS")} 
                  className={`px-3 py-1 cursor-pointer ${activeTabLog === "ALERTS" ? "border-b-2 border-[#de8712] text-[#de8712] font-bold" : "text-[#bec8d2]/50"}`}
                >
                  Alerty ({systemAlerts.length})
                </button>
              </div>

              {activeTabLog === "CLI" ? (
                <div className="bg-[#051424] p-2 rounded border border-[#3e4850]/40 font-mono text-[9px] text-[#bec8d2]/80 space-y-1 h-24 overflow-y-auto">
                  <div>[2026-05-20 AM] System booted successfully.</div>
                  <div>[SCANNER] Syncing with national waste management database (BDO)...</div>
                  <div>[AI] Initialized gemini-3.5-flash agent framework.</div>
                  <div>(click to refresh status outputs dynamically)</div>
                </div>
              ) : (
                <div className="bg-[#051424] p-2 rounded border border-[#3e4850]/40 font-mono text-[9px] text-[#bec8d2]/80 space-y-1 h-24 overflow-y-auto">
                  {systemAlerts.map((alert, idx) => (
                    <div key={idx} className="flex gap-1 items-start text-[#ffb86e]">
                      <span>●</span>
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* LEAD DETAILS DIALOG (Modal) */}
      {selectedLeadDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#122131] w-full max-w-lg rounded border border-[#3e4850] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-[#1c2b3c] px-5 py-4 border-b border-[#3e4850]/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#89ceff]" />
                <h4 className="font-semibold text-sm text-[#d4e4fa]">{selectedLeadDetails.companyName}</h4>
              </div>
              <button 
                onClick={() => setSelectedLeadDetails(null)}
                className="text-[#bec8d2] hover:text-[#d4e4fa] text-lg font-bold font-mono focus:outline-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 max-h-[400px]">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[#bec8d2]/50 block">NIP</span>
                  <span className="text-[#d4e4fa]">{selectedLeadDetails.nip}</span>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">REGON</span>
                  <span className="text-[#d4e4fa]">{selectedLeadDetails.regon}</span>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">Numer rejestrowy BDO</span>
                  <span className="text-[#d4e4fa]">{selectedLeadDetails.bdoNumber}</span>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">Województwo, Adres</span>
                  <span className="text-[#d4e4fa]">{selectedLeadDetails.province}, {selectedLeadDetails.address}</span>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">Status BDO</span>
                  <div className="mt-1">
                    <select
                      value={selectedLeadDetails.bdoStatus}
                      onChange={(e) => {
                        onUpdateBdoStatus(selectedLeadDetails.id, e.target.value as any);
                        setSelectedLeadDetails(prev => prev ? { ...prev, bdoStatus: e.target.value as any } : null);
                      }}
                      className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 p-1 text-[#d4e4fa] focus:outline-none"
                    >
                      <option value="Aktywny">Aktywny</option>
                      <option value="Weryfikacja">Weryfikacja</option>
                      <option value="Wygasły">Wygasły</option>
                    </select>
                  </div>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">Telefon / Email</span>
                  <span className="text-[#d4e4fa]">{selectedLeadDetails.phone} / {selectedLeadDetails.email}</span>
                </div>
              </div>

              <div className="h-px bg-[#3e4850]/20"></div>

              <div>
                <span className="text-[#bec8d2]/50 block text-xs font-mono mb-1">Zidentyfikowany Decydent (LinkedIn / Serwis)</span>
                <div className="p-3 bg-[#051424] rounded border border-[#3e4850]/30">
                  <div className="text-xs font-bold text-[#d4e4fa]">{selectedLeadDetails.decisionMakerName}</div>
                  <div className="text-[11px] text-[#bec8d2] font-sans mt-0.5">{selectedLeadDetails.decisionMakerRole}</div>
                  <div className="text-[10px] text-[#de8712] font-mono mt-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-[#de8712]" />
                    Relevance Score: {selectedLeadDetails.decisionMakerRelevance || 8}/10
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[#bec8d2]/50 block text-xs font-mono mb-1">Pozyskany Surowy Treść Profilu</span>
                <p className="text-[10px] font-mono bg-[#051424] p-2.5 rounded text-[#bec8d2]/90 border border-[#3e4850]/40 max-h-[100px] overflow-y-auto whitespace-pre-wrap">
                  {selectedLeadDetails.rawTextSample}
                </p>
              </div>
            </div>

            <div className="bg-[#1c2b3c]/60 p-4 border-t border-[#3e4850]/30 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLeadDetails(null)}
                className="px-4 py-1.5 bg-[#273647] text-[#bec8d2] hover:text-[#d4e4fa] hover:bg-[#3e4850]/60 rounded text-xs font-sans transition-colors"
              >
                Zamknij
              </button>
              <button
                onClick={() => handleSimulateOfferSent(selectedLeadDetails.id)}
                className="px-4 py-1.5 bg-[#ffb86e] text-[#2c1600] font-bold rounded text-xs font-sans hover:bg-[#ffdcbd] transition-colors"
              >
                Oznacz ofertę jako wysłaną
              </button>
              <button
                onClick={() => {
                  const id = selectedLeadDetails.id;
                  setSelectedLeadDetails(null);
                  onAnalyzeLeadInRecon(id);
                }}
                className="px-4 py-1.5 bg-[#0ea5e9] text-white font-bold rounded text-xs font-sans hover:bg-[#89ceff] transition-colors"
                id="btn-lead-analyze"
              >
                Uruchom AI Recon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOWNLOADER / RESPONSE MODAL */}
      {showPitchDownloader && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#122131] w-full max-w-xl rounded border border-[#3e4850] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-[#1c2b3c] px-5 py-4 border-b border-[#3e4850]/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#4edea3]" />
                <h4 className="font-semibold text-sm text-[#d4e4fa]">Skrzynka Odbiorcza Mails (LeadSniper Autopilot)</h4>
              </div>
              <button 
                onClick={() => setShowPitchDownloader(false)}
                className="text-[#bec8d2] hover:text-[#d4e4fa] text-lg font-bold font-mono focus:outline-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 max-h-[350px]">
              <p className="text-xs text-[#bec8d2] font-sans">
                Oto ostatnio wygenerowane maile, które uzyskały potencjalną odpowiedź środowiskową. Możesz je pobrać lub skopiować do dalszego handlu.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-[#051424] rounded border border-[#3e4850]/50">
                  <div className="flex justify-between items-center mb-1 text-[11px] font-mono">
                    <span className="text-[#89ceff]">Do: w.bys@fcc-group.pl (FCC Śląsk)</span>
                    <span className="text-[#4edea3]">Status: Dostarczono</span>
                  </div>
                  <div className="text-xs text-[#bec8d2] font-serif italic">
                    "Szanowny Panie Wojciechu, dziękuję za kontakt ze strony Mila LeadSniper. Jesteśmy otwarci na spotkanie odnośnie rozbudowy naszej floty kontenerowej i monitorowania sprawozdawczego BDO w Chorzowie. Proszę o telefon w czwartek o 11:00..."
                  </div>
                </div>

                <div className="p-3 bg-[#051424] rounded border border-[#3e4850]/50">
                  <div className="flex justify-between items-center mb-1 text-[11px] font-mono">
                    <span className="text-[#89ceff]">Do: anna.kowalska@remondis.pl (REMONDIS)</span>
                    <span className="text-[#4edea3]">Status: Dostarczono (Odpowiedź)</span>
                  </div>
                  <div className="text-xs text-[#bec8d2] font-serif italic">
                    "Dziękuję za pismo i wycenę logistyki odzysku. Chętnie zapoznam się z państwa programem automatyzacji sprawozdań KPO. Proszę o rezerwację terminu..."
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1c2b3c]/60 p-4 border-t border-[#3e4850]/30 flex justify-end gap-2">
              <button
                onClick={() => {
                  alert("Wszystkie oferty zostały pobrane w formacie .TXT i .CSV!");
                  setShowPitchDownloader(false);
                }}
                className="px-4 py-2 bg-[#4edea3] text-[#002113] font-bold rounded text-xs font-mono hover:bg-[#6ffbbe] transition-colors"
              >
                Eksportuj do archiwum .ZIP
              </button>
              <button
                onClick={() => setShowPitchDownloader(false)}
                className="px-4 py-2 bg-[#273647] text-[#bec8d2] hover:text-[#d4e4fa] rounded text-xs font-sans transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETALE COLD PITCHU / SENT OFFER DIALOG (Modal) */}
      {selectedSentOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#122131] w-full max-w-xl rounded border border-[#3e4850] overflow-hidden flex flex-col shadow-2xl animate-fadeIn">
            <div className="bg-[#1c2b3c] px-5 py-4 border-b border-[#3e4850]/30 flex justify-between items-center text-xs font-mono">
              <span className="text-[#ffb86e] font-bold flex items-center gap-2">
                <Send className="w-4 h-4 text-[#ffb86e]" /> PODGLĄD ZABEZPIECZONEGO COLD PITCHA (MILASIGNAL)
              </span>
              <button 
                onClick={() => setSelectedSentOffer(null)}
                className="text-[#bec8d2] hover:text-[#d4e4fa] font-bold text-lg focus:outline-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#051424] p-3 rounded border border-[#3e4850]/35 text-[#bec8d2]">
                <div>
                  <span className="text-[#bec8d2]/50 block">ODBIORCA HANDLOWY</span>
                  <span className="text-[#d4e4fa] font-bold">{selectedSentOffer.recipientName}</span>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">EMAIL ADRESATA</span>
                  <span className="text-[#89ceff]">{selectedSentOffer.recipientEmail}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#bec8d2]/50 block font-bold mb-0.5">TEMAT WIADOMOŚCI</span>
                  <span className="text-[#ffb86e] block py-1.5 px-2 bg-[#122131] rounded border border-[#3e4850]/20 truncate">{selectedSentOffer.subject}</span>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">DATA PROJEKCJI MAILERA</span>
                  <span className="text-[#d4e4fa]">{selectedSentOffer.sentDate}</span>
                </div>
                <div>
                  <span className="text-[#bec8d2]/50 block">STATUS INTEGRACJI</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                    selectedSentOffer.status === 'Odpowiedź!' 
                      ? 'bg-[#00311f]/40 text-[#4edea3] border-[#4edea3]/35' 
                      : selectedSentOffer.status === 'Otwarto'
                      ? 'bg-[#2c1600] text-[#ffb86e] border-[#ffb86e]/30'
                      : 'bg-[#1c2b3c] text-[#89ceff] border-[#89ceff]/20'
                  }`}>
                    {selectedSentOffer.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider">Spersonalizowana treść oferty (kontenery i hutnictwo)</label>
                  <button
                    onClick={() => handleCopyToClipboard(selectedSentOffer.pitchContent, "treść oferty")}
                    className="px-2.5 py-1 bg-[#273647] hover:bg-[#1c2b3c] text-[#89ceff] rounded border border-[#3e4850]/50 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Kopiuj Treść
                  </button>
                </div>
                <p className="text-[11.5px] font-mono bg-[#051424] p-3.5 rounded text-[#bec8d2]/90 border border-[#3e4850]/40 whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
                  {selectedSentOffer.pitchContent}
                </p>
              </div>
            </div>

            <div className="bg-[#1c2b3c]/60 p-4 border-t border-[#3e4850]/30 flex justify-end gap-2 text-xs font-mono">
              <button
                onClick={() => setSelectedSentOffer(null)}
                className="px-4 py-2 bg-[#273647] text-[#bec8d2] hover:text-[#d4e4fa] rounded transition-colors"
              >
                Zamknij podgląd
              </button>
              <button
                onClick={() => {
                  handleCopyToClipboard(selectedSentOffer.pitchContent, "treść oferty");
                  setSelectedSentOffer(null);
                }}
                className="px-4 py-2 bg-[#ffb86e] hover:bg-orange-300 text-[#2c1600] font-bold rounded transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Skopiuj i Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLYING COPY TOAST FEEDBACK */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 bg-[#002113] border border-[#4edea3] px-4 py-3 rounded shadow-2xl z-[100] flex items-center gap-2 animate-fadeIn font-mono text-xs text-[#4edea3] max-w-sm">
          <CheckCircle className="w-4 h-4 text-[#4edea3]" />
          <span>{copiedToast}</span>
        </div>
      )}

    </div>
  );
}
