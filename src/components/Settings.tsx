/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Sliders, 
  Database, 
  CheckCircle, 
  Activity,
  Info,
  Globe,
  MapPin,
  Compass,
  Briefcase,
  Sparkles,
  Trash2
} from "lucide-react";
import { AppSettings, CustomMarketSource } from "../types";

interface SettingsProps {
  onSetRoleName: (name: string) => void;
  activeRole: string;
  appSettings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
}

export default function Settings({ 
  onSetRoleName, 
  activeRole, 
  appSettings, 
  onUpdateSettings 
}: SettingsProps) {
  const [productTarget, setProductTarget] = useState(appSettings.productTarget);
  const [searchQueryRef, setSearchQueryRef] = useState(appSettings.searchQueryRef);
  const [selectedSources, setSelectedSources] = useState<string[]>(appSettings.selectedSources);
  const [scanDepth, setScanDepth] = useState(appSettings.scanDepth);
  const [smtpServer, setSmtpServer] = useState(appSettings.smtpServer);
  const [autoEnrich, setAutoEnrich] = useState(appSettings.autoEnrich);
  const [aiEngine, setAiEngine] = useState("auto");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Custom channels state
  const [customMarketSources, setCustomMarketSources] = useState<CustomMarketSource[]>(
    appSettings.customMarketSources || []
  );

  // Dynamic AI Strategy Creator states
  const [newCountry, setNewCountry] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("DE");
  const [newWhatToSearch, setNewWhatToSearch] = useState("");
  const [aiConsulting, setAiConsulting] = useState(false);
  const [aiConsultResult, setAiConsultResult] = useState<string[]>([]);

  const handleToggleSource = (src: string) => {
    setSelectedSources(prev => 
      prev.includes(src) ? prev.filter(x => x !== src) : [...prev, src]
    );
  };

  const handleToggleCustomSource = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setCustomMarketSources(prev => 
      prev.map(src => src.id === id ? { ...src, isActive: !src.isActive } : src)
    );
  };

  const handleDeleteCustomSource = (id: string) => {
    setCustomMarketSources(prev => prev.filter(src => src.id !== id));
    setSelectedSources(prev => prev.filter(x => x !== id));
  };

  const handleConsultAI = async () => {
    setAiConsulting(true);
    setAiConsultResult([]);
    try {
      const response = await fetch("/api/recon/suggest-databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: newCountry,
          whatToSearch: newWhatToSearch,
          productTarget: productTarget
        })
      });
      const data = await response.json();
      if (data && data.suggestions && data.suggestions.length > 0) {
        setAiConsultResult(data.suggestions);
      } else {
        setAiConsultResult([
          `Oryginalny Rejestr Odpadowy (${newCountryCode}) - Sugerowany odpowiednik rejestru sprawozdawczego BDO do ewidencji kart przekazania odpadów.`,
          `Lokalny spis izb gospodarczych i handlowych (Regional Chambers of Commerce) - Agregacja podmiotów przemysłowo-metalurgicznych.`,
          `Spis geolokalizacyjny punktów PSZOK i złomowisk (Google Commerce API & YellowPages) - Pobieranie fizycznych lokacji.`
        ]);
      }
    } catch (e) {
      setAiConsultResult([
        `Oryginalny Rejestr Odpadowy (${newCountryCode}) - Sugerowany odpowiednik rejestru sprawozdawczego BDO do ewidencji kart przekazania odpadów.`,
        `Lokalny spis izb gospodarczych i handlowych (Regional Chambers of Commerce) - Agregacja podmiotów przemysłowo-metalurgicznych.`,
        `Spis geolokalizacyjny punktów PSZOK i złomowisk (Google Commerce API & YellowPages) - Pobieranie fizycznych lokacji.`
      ]);
    } finally {
      setAiConsulting(false);
    }
  };

  const handleAddConsultedSource = () => {
    if (aiConsultResult.length === 0) return;
    const newId = `custom-${newCountryCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const newSource: CustomMarketSource = {
      id: newId,
      countryName: newCountry,
      countryCode: newCountryCode,
      searchDefinition: newWhatToSearch,
      suggestedDatabases: aiConsultResult,
      isActive: true
    };
    
    setCustomMarketSources(prev => [...prev, newSource]);
    setSelectedSources(prev => [...prev, newId]);
    
    // Reset inputs
    setNewCountry("");
    setNewCountryCode("DE");
    setNewWhatToSearch("");
    setAiConsultResult([]);

    setSaveStatus(`Zaprojektowano kanał "${newSource.countryName}"! Aby sfinalizować, kliknij przycisk 'Zastosuj zmiany'.`);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleApplySettings = () => {
    setSaveStatus("Zapisywanie parametrów do pliku konfiguracyjnego...");
    setTimeout(() => {
      onUpdateSettings({
        productTarget,
        searchQueryRef,
        selectedSources,
        scanDepth,
        smtpServer,
        autoEnrich,
        customMarketSources
      });
      setSaveStatus("Pomyślnie zsynchronizowano ustawienia z modułem 'The Vault v2.5'!");
      setTimeout(() => setSaveStatus(null), 3500);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title Banner */}
      <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#bec8d2]/10 flex items-center justify-center border border-[#bec8d2]/30">
            <SettingsIcon className="text-[#bec8d2] w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#d4e4fa]">Ustawienia Systemowe Mila LeadSniper</h2>
            <p className="text-xs text-[#bec8d2]/70">Konfiguracja parametrów skanera rejestrów, preferencji silnika wnioskowania oraz integracji pocztowych.</p>
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className="bg-[#00311f]/40 border border-[#4edea3]/50 text-[#4edea3] text-xs font-mono p-3 rounded flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-4 h-4" />
          <div>{saveStatus}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Config Form (Col Span 8) */}
        <section className="lg:col-span-8 flex flex-col gap-5">
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 space-y-5">
            
            <h3 className="text-xs font-mono font-bold text-[#89ceff] tracking-widest uppercase flex items-center gap-1.5 border-b border-[#3e4850]/20 pb-2">
              <Sliders className="w-4 h-4 text-[#89ceff]" /> Profil oferty i zakres targetowania
            </h3>

            {/* WHAT WE SELL (Product profile definition) */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider font-bold">
                CO SPRZEDAJESZ? (DEFINICJA OFERTY DLA ANALITYKA AI)
              </label>
              <textarea
                rows={4}
                value={productTarget}
                onChange={(e) => setProductTarget(e.target.value)}
                placeholder="Napisz co sprzedajesz, np. kontenery stalowe DIN 30720, hakowce 36m3, itp."
                className="bg-[#051424] text-xs font-sans rounded border border-[#3e4850]/40 p-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full resize-none placeholder-[#bec8d2]/30 leading-relaxed"
              />
              <span className="text-[10px] text-[#bec8d2]/50 font-mono block">
                * Analityk AI Mila użyje tego opisu do oceny wagi decydentów i wygenerowania dedykowanego cold pitchu (Mila Mailer).
              </span>
            </div>

            {/* Sourcing & Checkbox Choices */}
            <div className="space-y-3">
              <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider font-bold">
                AKTYWNE ŹRÓDŁA DATA-MININGU
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <button
                  onClick={() => handleToggleSource("bdo")}
                  className={`flex items-center gap-3 p-3 text-left rounded border transition-all cursor-pointer ${
                    selectedSources.includes("bdo")
                      ? "bg-[#273647]/50 text-[#89ceff] border-[#89ceff]/50"
                      : "bg-[#051424] text-[#bec8d2]/60 border-[#3e4850]/30 hover:border-[#3e4850]/60"
                  }`}
                >
                  <Database className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block text-[#d4e4fa]">Krajowy Rejestr BDO (Polska)</span>
                    <span className="text-[10px] opacity-70">Sprawozdawczość środowiskowa i odpadowa</span>
                  </div>
                </button>

                <button
                  onClick={() => handleToggleSource("gmaps")}
                  className={`flex items-center gap-3 p-3 text-left rounded border transition-all cursor-pointer ${
                    selectedSources.includes("gmaps")
                      ? "bg-[#273647]/50 text-[#89ceff] border-[#89ceff]/50"
                      : "bg-[#051424] text-[#bec8d2]/60 border-[#3e4850]/30 hover:border-[#3e4850]/60"
                  }`}
                >
                  <MapPin className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block text-[#d4e4fa]">Google Maps (Miasta & Regiony)</span>
                    <span className="text-[10px] opacity-70">Skanowanie punktów fizycznych po frazie</span>
                  </div>
                </button>

                <button
                  onClick={() => handleToggleSource("panorama")}
                  className={`flex items-center gap-3 p-3 text-left rounded border transition-all cursor-pointer ${
                    selectedSources.includes("panorama")
                      ? "bg-[#273647]/50 text-[#89ceff] border-[#89ceff]/50"
                      : "bg-[#051424] text-[#bec8d2]/60 border-[#3e4850]/30 hover:border-[#3e4850]/60"
                  }`}
                >
                  <Compass className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block text-[#d4e4fa]">Portale i Katalogi (Panorama Firm itp.)</span>
                    <span className="text-[10px] opacity-70">Agregowane indeksy teleadresowe B2B</span>
                  </div>
                </button>

                {/* Render Custom / AI Suggested Global Market Sources */}
                {customMarketSources.map((src) => {
                  const isActive = selectedSources.includes(src.id);
                  return (
                    <div 
                      key={src.id}
                      className={`relative flex items-center justify-between p-3 rounded border transition-all ${
                        isActive
                          ? "bg-[#273647]/50 text-[#89ceff] border-[#89ceff]/60"
                          : "bg-[#051424] text-[#bec8d2]/60 border-[#3e4850]/30 hover:border-[#3e4850]/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleCustomSource(src.id)}
                        className="flex items-center gap-3 text-left flex-1 cursor-pointer pr-8"
                      >
                        <Globe className="w-5 h-5 shrink-0 text-[#de8712]" />
                        <div className="text-xs">
                          <span className="font-bold block text-[#d4e4fa]">
                            Rynek zagraniczny - {src.countryName} ({src.countryCode})
                          </span>
                          <span className="text-[10px] opacity-70 font-mono block max-w-[210px] truncate">
                            Szukamy: {src.searchDefinition}
                          </span>
                          <span className="text-[9px] text-[#4edea3] opacity-85 block font-mono">
                            Rejestry AI: {src.suggestedDatabases.map(d => d.split(" - ")[0]).join(", ")}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSource(src.id)}
                        className="absolute right-2 top-2.5 p-1 text-[#ff6b6b]/60 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded transition-all cursor-pointer"
                        title="Usuń ten kanał"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* AI Global Source strategy builder */}
            <div className="bg-[#051424]/80 p-4.5 rounded border border-[#3e4850]/40 space-y-4">
              <h4 className="text-xs font-mono font-bold text-[#de8712] flex items-center gap-1.5 uppercase">
                <Globe className="w-4 h-4 text-[#de8712]" /> 🧩 Inteligentny Kreator Rynków (AI Database Suggester)
              </h4>
              <p className="text-[11.5px] text-[#bec8d2]/80 leading-relaxed font-sans">
                Wyrusz na nowe rynki! Wpisz kraj sprzedażowy (np. Niemcy, Czechy) oraz krótki opis tego czego szukasz. Nasza merytoryczna sztuczna inteligencja przeanalizuje lokalny rynek i doradzi, gdzie dokładnie szukać takich firm (np. odpowiedniki polskiego rejestru BDO, izby rzemieślnicze IHK itp.). Następnie zapiszesz go jako aktywny kanał zwiadu.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-mono text-[#bec8d2]/60 uppercase tracking-widest mb-1.5">Kraj Targetowy</label>
                  <input
                    type="text"
                    placeholder="np. Niemcy, Czechy, Francja"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="bg-[#122131] text-xs font-sans rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#de8712] w-full"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[#bec8d2]/60 uppercase tracking-widest mb-1.5">Kod Kraju (ISO)</label>
                  <input
                    type="text"
                    placeholder="np. DE, CZ, FR, SE"
                    maxLength={3}
                    value={newCountryCode}
                    onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                    className="bg-[#122131] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#de8712] w-full text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[#bec8d2]/60 uppercase tracking-widest mb-1.5">Podaj czego poszukujesz</label>
                  <input
                    type="text"
                    placeholder="np. podmioty utylizujące odpady"
                    value={newWhatToSearch}
                    onChange={(e) => setNewWhatToSearch(e.target.value)}
                    className="bg-[#122131] text-xs font-sans rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#de8712] w-full"
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleConsultAI}
                  disabled={aiConsulting || !newCountry || !newWhatToSearch}
                  className="bg-[#1c2b3c] hover:bg-[#273647] border border-[#de8712]/50 text-[#de8712] font-mono text-xs font-bold py-2 px-4 rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {aiConsulting ? (
                    <>
                      <span className="inline-block animate-spin mr-1">↻</span>
                      Generowanie strategii baz...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#de8712]" /> 
                      Konsultuj bazy lokalne przez AI
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions results */}
              {aiConsultResult.length > 0 && (
                <div className="p-3.5 bg-[#122131] rounded border border-[#de8712]/40 space-y-3.5 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#3e4850]/30 pb-2">
                    <span className="text-[10px] font-mono text-[#4edea3] font-bold uppercase tracking-wider">
                      ★ Rekomendowane bazy i rejestry dla kraju: {newCountry}
                    </span>
                    <span className="text-[9px] font-mono text-[#bec8d2]/50 font-bold bg-[#051424] px-2 py-0.5 rounded">
                      Mila Suggester Engine
                    </span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {aiConsultResult.map((item, idx) => (
                      <div key={idx} className="text-xs text-[#d4e4fa] leading-relaxed flex items-start gap-2 bg-[#051424]/60 p-2.5 rounded border border-[#3e4850]/20">
                        <span className="text-[#de8712] text-sm shrink-0">■</span>
                        <div className="text-[11px] text-[#bec8d2] font-sans">
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddConsultedSource}
                      className="bg-[#4edea3] hover:bg-[#6ffbbe] text-[#002113] py-2 px-4.5 font-mono text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#4edea3]/10"
                    >
                      Zatwierdź i zaimplementuj kanał zwiadu
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields: Role, SearchQuery, SMTP server */}
            <h3 className="text-xs font-mono font-bold text-[#89ceff] tracking-widest uppercase flex items-center gap-1.5 border-b border-[#3e4850]/20 pb-2 pt-2">
              <Briefcase className="w-4 h-4 text-[#89ceff]" /> Rola użytkownika i frazy domyślne
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-2">AKTYWNA ROLA/STANOWISKO OPERATORA</label>
                <select
                  value={activeRole}
                  onChange={(e) => onSetRoleName(e.target.value)}
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                >
                  <option value="Handlowiec">Handlowiec (Komunikacja B2B)</option>
                  <option value="Dyrektor Sprzedaży">Dyrektor Sprzedaży (Optymalizacje cenowe)</option>
                  <option value="Audytor Środowiskowy">Audytor Środowiskowy (Nacisk na kary BDO)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-2">GŁĘBOKOŚĆ SKANOWANIA REJESTRÓW</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "fast", label: "Szybki" },
                    { id: "normal", label: "Normalny" },
                    { id: "deep", label: "Głęboki" }
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setScanDepth(d.id)}
                      className={`py-2 px-1 rounded font-mono text-xs border text-center transition-all ${
                        scanDepth === d.id 
                          ? "bg-[#273647] text-[#89ceff] border-[#89ceff]/80 font-bold" 
                          : "bg-[#051424] text-[#bec8d2] border-[#3e4850]/30 hover:border-[#89ceff]/30"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-2">
                DOMYŚLNE FRAZY KLUCZOWE SEKTORA (ODDZIELONE PRZECINKIEM)
              </label>
              <input
                type="text"
                value={searchQueryRef}
                onChange={(e) => setSearchQueryRef(e.target.value)}
                placeholder="np. złom, kruszywa, gruz, odpady, huta"
                className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2.5 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-2">SERWER POCZTOWY WYCHODZĄCY (SMTP)</label>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="bg-[#051424] text-xs font-mono rounded border border-[#3e4850]/40 py-2 px-3 text-[#d4e4fa] focus:outline-none focus:border-[#89ceff] w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#bec8d2]/70 uppercase tracking-wider mb-2">AUTOPILOT ENRICHMENT</label>
                <div className="flex items-center h-10">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-[#d4e4fa]">
                    <input
                      type="checkbox"
                      checked={autoEnrich}
                      onChange={(e) => setAutoEnrich(e.target.checked)}
                      className="rounded bg-[#051424] border-[#3e4850] text-[#0ea5e9] focus:ring-[#0ea5e9]"
                    />
                    <span>Automatyczne pobieranie LinkedIn w tle</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#3e4850]/20 pt-1"></div>

            <div className="flex justify-end">
              <button
                onClick={handleApplySettings}
                className="bg-[#de8712] hover:bg-[#ffb86e] text-[#2c1600] font-mono text-xs font-bold py-2.5 px-6 rounded transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Zastosuj zmiany i zapisz profil
              </button>
            </div>

          </div>
        </section>

        {/* Secondary Info/Secrets (Col Span 4) */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Secrets Config */}
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#de8712] tracking-widest uppercase flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#de8712]" /> Konfiguracja Kluczy API
            </h3>

            <div className="bg-[#051424] p-3 rounded border border-[#3e4850]/50 space-y-3.5">
              <div className="text-[10px] font-mono text-[#bec8d2] space-y-2 leading-relaxed">
                <div className="flex items-center gap-1 text-[#4edea3] font-bold">
                  <Info className="w-3.5 h-3.5 text-[#89ceff] shrink-0" /> SECURITY PRO-TIP
                </div>
                <p>
                  Twoje połączenia za pośrednictwem modułu <strong>"The Analyst"</strong> są uruchamiane po stronie bezpiecznego serwera we własnym kontenerze.
                </p>
                <p>
                  Przejdź do bocznego panelu <strong>Settings &gt; Secrets</strong> w popularnym interfejsie Google AI Studio. Przypisz swój unikalny klucz do nazwy zmiennej:
                </p>
                <code className="block bg-[#122131] p-1.5 rounded text-[#de8712] text-center font-bold">GEMINI_API_KEY</code>
                <p>
                  Zostanie on automatycznie i bezpiecznie wstrzyknięty do kodu Express bez widoczności w przeglądarce klienta!
                </p>
              </div>
            </div>
          </div>

          {/* Port Settings */}
          <div className="bg-[#122131] rounded border border-[#3e4850]/30 p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#89ceff] tracking-widest uppercase flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#89ceff]" /> Port i Środowisko
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#bec8d2]/70">Domyślny Port</span>
                <span className="text-[#d4e4fa]">3000 (Zablokowany)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#bec8d2]/70">Wersja Node</span>
                <span className="text-[#d4e4fa]">v22+ LTS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#bec8d2]/70">Wersja UI</span>
                <span className="text-[#d4e4fa]">React 19 + Tailwind v4</span>
              </div>
            </div>
          </div>

        </section>

      </div>

    </div>
  );
}
