/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, Dispatch, SetStateAction, ChangeEvent } from "react";
import { 
  Cpu, 
  Terminal, 
  Copy, 
  Check, 
  UserCheck, 
  Zap, 
  Sparkles, 
  CornerDownRight, 
  AlertTriangle, 
  FileText,
  Building2,
  Lock,
  MessageSquare,
  Bookmark
} from "lucide-react";
import { Lead, AnalystReport, DecisionMaker, AppSettings } from "../types";

interface ReconnaissanceProps {
  leads: Lead[];
  onSetLeads: Dispatch<SetStateAction<Lead[]>>;
  selectedLeadIdToAnalyze?: string | null;
  onClearSelectedLead: () => void;
  onIncrementDMsIdentified: (count: number) => void;
  appSettings: AppSettings;
  activeRole: string;
}

export default function Reconnaissance({ 
  leads, 
  onSetLeads,
  selectedLeadIdToAnalyze, 
  onClearSelectedLead,
  onIncrementDMsIdentified,
  appSettings,
  activeRole
}: ReconnaissanceProps) {
  const [textToAnalyze, setTextToAnalyze] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  
  // AI processing states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPitching, setIsPitching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Scraped AI results
  const [analystReport, setAnalystReport] = useState<AnalystReport | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Default Prompt requested by user
  const EXPERT_PROMPT_DOC = `Rola: Ekspert ds. Analizy Struktur Korporacyjnych B2B (Przemysł)
Model: The Analyst (Mila LeadSniper)

Twoim zadaniem jest przetworzenie surowych danych tekstowych pobranych z profilu firmy na LinkedIn oraz podstron "O nas/Zespół" i zidentyfikowanie kluczowych decydentów zakupowych (DMU - Decision Making Unit).

Cele szczegółowe:
1. Mapowanie Decydentów: Purchasing Manager, Supply Chain Director, Logistics Manager, Właściciel, Dyrektor Operacyjny.
2. Analiza Potencjału: Ocena 1-10 prawdopodobieństwa optymalizacji logistyki/odpadów.
3. Sentiment & Tone: Określenie stylu komunikacji (Formalny / Relacyjny / Techniczny).`;

  // Preload lead if selected globally from other component (e.g., clicking analyze in dashboard)
  useEffect(() => {
    if (selectedLeadIdToAnalyze) {
      const targetLead = leads.find(l => l.id === selectedLeadIdToAnalyze);
      if (targetLead) {
        setSelectedLeadId(targetLead.id);
        setTextToAnalyze(targetLead.rawTextSample || "");
        // If lead already contains report from a previous workflow, show it!
        if (targetLead.analystReport) {
          setAnalystReport(targetLead.analystReport);
          setWarningMessage(null);
        } else {
          setAnalystReport(null);
        }
      }
      onClearSelectedLead(); // Reset signal state
    }
  }, [selectedLeadIdToAnalyze, leads, onClearSelectedLead]);

  // Load raw text sample when dropdown changes
  const handleDropdownChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLeadId(val);
    const targetLead = leads.find(l => l.id === val);
    if (targetLead) {
      setTextToAnalyze(targetLead.rawTextSample || "");
      if (targetLead.analystReport) {
        setAnalystReport(targetLead.analystReport);
        setWarningMessage(null);
      } else {
        setAnalystReport(null);
      }
    } else {
      setTextToAnalyze("");
      setAnalystReport(null);
    }
  };

  // Run server-side Gemini analyze
  const handleRunAiAnalysis = async () => {
    if (!textToAnalyze.trim()) {
      alert("Proszę najpierw wprowadzić lub wybrać surowy tekst do przeanalizowania.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalystReport(null);
    setWarningMessage(null);

    try {
      const response = await fetch("/api/recon/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          textSample: textToAnalyze,
          productTarget: appSettings.productTarget
        })
      });

      if (!response.ok) {
        throw new Error(`Serwer zwrócił błąd: ${response.statusText}`);
      }

      const resData = await response.json();
      
      if (resData.error) {
        throw new Error(resData.error);
      }

      setAnalystReport(resData.report);
      setIsSimulated(resData.status === "simulated");
      if (resData.warning) {
        setWarningMessage(resData.warning);
      }

      // Increment identified DMs statistically based on results
      const detectedCount = resData.report?.decision_makers?.length || 0;
      onIncrementDMsIdentified(detectedCount);

      // Save report back into the lead object so state is persistent during current session!
      if (selectedLeadId) {
        onSetLeads(prevLeads => 
          prevLeads.map(lead => {
            if (lead.id === selectedLeadId) {
              const dm = resData.report?.decision_makers?.[0];
              return {
                ...lead,
                analystReport: resData.report,
                decisionMakerName: dm ? dm.name : lead.decisionMakerName,
                decisionMakerRole: dm ? dm.position : lead.decisionMakerRole,
                decisionMakerRelevance: dm ? dm.relevance_score : lead.decisionMakerRelevance
              };
            }
            return lead;
          })
        );
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Wystąpił nieoczekiwany błąd silnika AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run server-side Gemini customized pitch draft
  const handleGeneratePitch = async () => {
    if (!analystReport) return;
    
    setIsPitching(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/recon/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          report: analystReport,
          productTarget: appSettings.productTarget,
          activeRole: activeRole
        })
      });

      if (!response.ok) {
        throw new Error("Nie powiodło się generowanie oferty Mila Mailer.");
      }

      const resData = await response.json();
      
      setAnalystReport(prev => prev ? {
        ...prev,
        generated_pitch: resData.pitch
      } : null);

      // Also persist pitch in local storage/lead lists if possible
      if (selectedLeadId) {
        onSetLeads(prevLeads => 
          prevLeads.map(lead => {
            if (lead.id === selectedLeadId) {
              return {
                ...lead,
                analystReport: {
                  ...(lead.analystReport || analystReport),
                  generated_pitch: resData.pitch
                }
              };
            }
            return lead;
          })
        );
      }

    } catch (err: any) {
      console.error(err);
      alert("Błąd: " + err.message);
    } finally {
      setIsPitching(false);
    }
  };

  // Copy helpers
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(EXPERT_PROMPT_DOC);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyReportJSON = () => {
    if (!analystReport) return;
    navigator.clipboard.writeText(JSON.stringify(analystReport, null, 2));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleCopyPitchText = () => {
    if (!analystReport?.generated_pitch) return;
    navigator.clipboard.writeText(analystReport.generated_pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Informative Banner */}
      <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#ffb86e]/10 flex items-center justify-center border border-[#ffb86e]/30">
            <Cpu className="text-[#ffb86e] w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#d4e4fa]">AI Reconnaissance & Decision Maker Unit (The Analyst)</h2>
            <p className="text-xs text-[#bec8d2]/70">Wpisz luźne dane z biografii korporacyjnej lub LinkedIn. AI wyodrębni hierarchię decydentów (DMU), wykryje sygnały zakupowe oraz pain points.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Input Text Panel (Col Span 5) */}
        <section className="xl:col-span-5 flex flex-col gap-5">
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 space-y-4">
            
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-[#de8712] tracking-widest uppercase flex items-center gap-1.5">
                <span>●</span> Dane źródłowe
              </h3>
              
              <button
                onClick={handleCopyPrompt}
                className="text-mono text-[10px] text-[#89ceff] hover:underline flex items-center gap-1 focus:outline-none"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                Kopiuj Prompt Systemowy
              </button>
            </div>

            {/* Presets Selection */}
            <div>
              <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-2">Załaduj istniejący cel z lejek-rejestru</label>
              <select
                value={selectedLeadId}
                onChange={handleDropdownChange}
                className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
              >
                <option value="">-- Nowa analiza tekstowa --</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.companyName} ({lead.bdoNumber || "NIP: " + lead.nip})
                  </option>
                ))}
              </select>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-2">Surowe dane tekstowe (LinkedIn, podstrona Team, Bio prezesa...)</label>
              <textarea
                rows={9}
                placeholder="Wklej tutaj teks o zespole, stanowiskach lub wzmiankach prasowych..."
                value={textToAnalyze}
                onChange={(e) => setTextToAnalyze(e.target.value)}
                className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 p-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full resize-none placeholder-[#bec8d2]/30"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setTextToAnalyze(
                    `Nazywam się Janusz Korwin i jako Purchasing Manager w firmie ECO-TRANS Sp. z o.o. zajmuję się rozliczaniem frachtu kolejowego oraz odzyskiem papieru. Aktualnie nasz dotychczasowy dostawca logistyki opóźnia transport o 14 dni, przez co grożą nam kary środowiskowe. Szukam elastycznego partnera B2B.`
                  );
                  setSelectedLeadId("");
                }}
                className="px-3 py-1.5 bg-[#273647] hover:bg-[#3e4850]/60 text-[#bec8d2] text-[10px] rounded font-mono border border-[#3e4850]/50 transition-all focus:outline-none"
              >
                Załaduj Testowy Tekst
              </button>

              <button
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing || !textToAnalyze.trim()}
                className="flex-1 bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] disabled:bg-[#3e4850]/40 disabled:text-[#bec8d2]/40 font-mono text-xs font-bold py-2 px-4 rounded transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-lg shadow-[#de8712]/10"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                {isAnalyzing ? "AI PROCESUJE..." : "ANALIZUJ STRUKTURĘ DMU"}
              </button>
            </div>

            <div className="bg-[#051424] p-3 rounded border border-[#3e4850]/40 font-mono text-[9px] text-[#bec8d2]/80 space-y-1">
              <div className="text-[#89ceff] font-bold">Wskazówki operacyjne:</div>
              <p>Analizator wyodrębnia bezpośrednie zależności zakupowe i pomija działy HR/Marketing. Jeśli chcesz, aby raport zapisał się trwale w Panelu Wyników, najpierw wybierz lub dodaj leada na liście u góry.</p>
            </div>

          </div>
        </section>

        {/* AI report and email pitches draft (Col Span 7) */}
        <section className="xl:col-span-7 flex flex-col gap-5">
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 flex flex-col flex-1 min-h-[400px]">
            
            <div className="flex justify-between items-center border-b border-[#3e4850]/20 pb-3 mb-4">
              <h3 className="text-xs font-mono font-bold text-[#4edea3] tracking-widest uppercase flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#4edea3]" /> Rezultaty Analizy B2B (The Analyst Output)
              </h3>
              
              {analystReport && (
                <button
                  onClick={handleCopyReportJSON}
                  className="text-[10px] font-mono text-[#89ceff] hover:underline flex items-center gap-1 focus:outline-none"
                >
                  {copiedReport ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                  Kopiuj JSON Raport
                </button>
              )}
            </div>

            {/* Error messaging */}
            {errorMsg && (
              <div className="bg-[#93000a]/30 border border-[#ffb4ab] text-[#ffb4ab] text-xs p-3.5 rounded flex items-center gap-2 mb-4 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <div><strong>Błąd AI:</strong> {errorMsg}</div>
              </div>
            )}

            {/* Warning banner about mock mode */}
            {warningMessage && (
              <div className="bg-[#273647]/50 border border-[#de8712]/40 text-[#ffb86e] text-[11px] p-3 rounded flex items-start gap-2 mb-4 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#de8712]" />
                <div>{warningMessage}</div>
              </div>
            )}

            {/* Loading Indicator */}
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 font-mono text-center gap-4">
                <div className="w-12 h-12 rounded bg-[#de8712]/10 flex items-center justify-center border border-[#de8712]/50 animate-spin">
                  <Cpu className="text-[#de8712] w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-[#de8712] font-semibold tracking-wider animate-pulse">PRASOWANIE TEKSTU PRZEZ OLLAMA/GEMMA 2...</div>
                  <div className="text-[10px] text-[#bec8d2]/60">Trwa wyodrębnianie decydentów zakupowych (DMU), sentymentu i punktów bólu...</div>
                </div>
              </div>
            ) : analystReport ? (
              <div className="space-y-5">
                
                {/* Company Name */}
                <div className="flex items-center gap-2 bg-[#0d1c2d] p-3.5 rounded border border-[#3e4850]/50 border-l-4 border-l-[#4edea3]">
                  <Building2 className="w-4 h-4 text-[#4edea3]" />
                  <div>
                    <span className="text-[10px] font-mono text-[#bec8d2]/50 block uppercase tracking-wider">Zweryfikowana Nazwa Podmiotu</span>
                    <h4 className="font-bold text-sm text-[#d4e4fa] font-sans">{analystReport.company_name}</h4>
                  </div>
                </div>

                {/* Decision Makers (DMUs) */}
                <div>
                  <span className="text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider block mb-2 font-semibold">Zmapowani decydenci zakupowi (DMU)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analystReport.decision_makers?.map((dm: DecisionMaker, idx: number) => (
                      <div key={idx} className="bg-[#051424] p-3.5 rounded border border-[#3e4850]/40 hover:border-[#89ceff]/20 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="text-xs font-bold text-[#d4e4fa] font-sans">{dm.name}</span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                              dm.relevance_score >= 8 ? 'bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/30' : 'bg-[#273647] text-[#bec8d2]'
                            }`}>
                              Waga: {dm.relevance_score}/10
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#4edea3] block">{dm.position}</span>
                          <p className="text-[10px] text-[#bec8d2]/80 mt-2 font-mono leading-relaxed bg-[#122131]/40 p-1.5 rounded border border-[#3e4850]/20">
                            {dm.key_responsibility}
                          </p>
                        </div>
                        {dm.linkedin_url && (
                          <a 
                            href={dm.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#0ea5e9] hover:underline flex items-center gap-1 mt-2.5 font-mono"
                          >
                            LinkedIn Profile <FileText className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bullet Points: SIGNALS, PAIN POINTS, TONE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Signals */}
                  <div className="bg-[#0d1c2d] p-4 rounded border border-[#3e4850]/40">
                    <span className="text-[10px] font-mono text-[#bec8d2] uppercase tracking-wider block mb-2 font-semibold">Sygnały zakupowe</span>
                    <ul className="space-y-1.5 font-mono text-[10px] text-[#d4e4fa]">
                      {analystReport.buying_signals?.map((sig, idx) => (
                        <li key={idx} className="flex gap-1.5 items-start">
                          <Zap className="w-3 h-3 text-[#ffb86e] shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pain Points */}
                  <div className="bg-[#0d1c2d] p-4 rounded border border-[#3e4850]/40">
                    <span className="text-[10px] font-mono text-[#bec8d2] uppercase tracking-wider block mb-2 font-semibold">Słabości / Pain Points</span>
                    <div className="flex flex-wrap gap-1.5">
                      {analystReport.pain_points?.map((pain, idx) => (
                        <span key={idx} className="bg-[#93000a]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-[9.5px] px-2 py-0.5 rounded-sm font-mono tracking-tight">
                          ⚠️ {pain}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Tone */}
                <div className="bg-[#273647]/30 p-3 rounded border border-[#3e4850]/40 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#bec8d2]/70">ZALECANY TON KOMUNIKACJI:</span>
                  <span className="text-[#de8712] font-semibold uppercase">{analystReport.recommended_tone}</span>
                </div>

                <div className="h-px bg-[#3e4850]/20"></div>

                {/* PISZ OFERTĘ (Pitch generator integration) */}
                <div className="space-y-3.5 bg-[#051424] p-4 rounded border border-[#3e4850]/50">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[11px] font-mono text-[#bec8d2] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#ffb86e]" /> Mila Mailer (Kreator Ofert)
                    </h5>

                    {analystReport.generated_pitch && (
                      <button
                        onClick={handleCopyPitchText}
                        className="text-[10px] font-mono text-[#4edea3] hover:underline flex items-center gap-1 focus:outline-none"
                      >
                        {copiedPitch ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                        Skopiuj treść maila
                      </button>
                    )}
                  </div>

                  {isPitching ? (
                    <div className="py-6 text-center font-mono text-[11px] text-[#bec8d2]/50 space-y-2">
                      <span className="animate-spin inline-block text-[#de8712]">↻</span>
                      <p className="animate-pulse text-[#de8712] font-semibold">Redagowanie wysoce spersonalizowanego cold pitchu przez Gemini-3.5...</p>
                    </div>
                  ) : analystReport.generated_pitch ? (
                    <div className="bg-[#122131] p-3.5 rounded border border-[#3e4850]/50 max-h-[220px] overflow-y-auto">
                      <pre className="font-serif text-[11px] text-[#d4e4fa] whitespace-pre-wrap leading-relaxed">
                        {analystReport.generated_pitch}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-[#122131]/30 p-4 border border-dashed border-[#3e4850]/50 rounded text-center text-xs font-sans text-[#bec8d2]/70">
                      Gotowy do redagowania oferty! Kliknij poniżej, aby wygenerować profesjonalną wiadomość B2B dedykowaną zidentyfikowanemu decydentowi.
                    </div>
                  )}

                  {!analystReport.generated_pitch && (
                    <button
                      onClick={handleGeneratePitch}
                      disabled={isPitching}
                      className="w-full bg-[#de8712]/10 border border-[#de8712]/40 hover:bg-[#de8712]/20 text-[#ffb86e] font-mono text-[11px] font-bold py-2 rounded transition-colors cursor-pointer"
                    >
                      GENERUJ PERSONALIZOWANĄ OFERTĘ MILA MAILER
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#bec8d2]/30 font-sans gap-3">
                <FileText className="w-12 h-12 text-[#bec8d2]/20 animate-pulse" />
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider mb-1">Oczekiwanie na analizę strukturalną</div>
                  <p className="text-[11px] max-w-sm mx-auto leading-relaxed">Wybierz leada z listy po lewej i kliknij przycisk, aby uruchomić silnik B2B lub wklej dowolny wycinek z LinkedIn.</p>
                </div>
              </div>
            )}

          </div>
        </section>

      </div>

    </div>
  );
}
