/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing
app.use(express.json());

// Multi-provider AI/LLM wrapper for local Ollama and Google Gemini
async function runAIQuery(params: {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}): Promise<string> {
  const provider = process.env.LLM_PROVIDER || "gemini";
  const apiKey = process.env.GEMINI_API_KEY;

  if (provider === "ollama" || (!apiKey && process.env.OLLAMA_API_BASE)) {
    const ollamaBase = process.env.OLLAMA_API_BASE || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "gemma2";

    try {
      console.log(`[Ollama Bridge] Querying local model "${ollamaModel}" at "${ollamaBase}"...`);
      const response = await fetch(`${ollamaBase}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            ...(params.systemInstruction ? [{ role: "system", content: params.systemInstruction }] : []),
            { role: "user", content: params.prompt }
          ],
          temperature: params.temperature ?? 0.2,
          response_format: params.responseMimeType === "application/json" ? { type: "json_object" } : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API responded with status ${response.status}`);
      }

      const responseData = await response.json() as any;
      return responseData.choices?.[0]?.message?.content || "{}";
    } catch (err: any) {
      console.error("[Ollama Bridge Error] Local Ollama failed:", err);
      throw new Error(`Ollama integration error: ${err.message}`);
    }
  }

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("No GEMINI_API_KEY provided and LLM_PROVIDER is not set to ollama.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: params.prompt,
    config: {
      systemInstruction: params.systemInstruction,
      temperature: params.temperature ?? 0.2,
      responseMimeType: params.responseMimeType,
    }
  });

  return response.text || "{}";
}

// Helper for live B2B mock data when API key is not present
const getSimulatedAnalystReport = (text: string, productTarget: string = "kontenery stalowe") => {
  const contentLower = text.toLowerCase();
  
  let companyName = "Zidentyfikowana Firma S.A.";
  if (contentLower.includes("fcc")) companyName = "FCC Śląsk Sp. z o.o.";
  else if (contentLower.includes("remondis")) companyName = "REMONDIS Sp. z o.o.";
  else if (contentLower.includes("alba")) companyName = "ALBA Polska Sp. z o.o.";
  else if (contentLower.includes("prezero")) companyName = "PreZero Recycling S.A.";
  else if (contentLower.includes("stena")) companyName = "Stena Recycling Sp. z o.o.";
  else if (contentLower.includes("suez")) companyName = "SUEZ Polska Sp. z o.o.";
  else if (contentLower.includes("hanseatische")) companyName = "Hanseatische Schrott & Metall GmbH";
  else if (contentLower.includes("nordic")) companyName = "Nordic Genbrug & Skrot ApS";
  
  const isContainers = productTarget.toLowerCase().includes("konten") || productTarget.toLowerCase().includes("din") || productTarget.toLowerCase().includes("muld");

  const buyingSignals = isContainers ? [
    `Zapotrzebowanie na wymianę wyeksploatowanej floty kontenerowej kompatybilnej z normą DIN 30720 / 30722`,
    "Zgłasza problem z szybkim uszkodzeniem asymetrycznych pojemników i muld na złom i ciężkie odpady",
    "Zainteresowany dostawą bezpośrednio od producenta kontenerów ze stali o wysokiej odporności"
  ] : [
    `Zgłasza zapytanie wdrożeniowe pod kątem: ${productTarget.slice(0, 60)}`,
    "Prace nad redukcją kosztów operacyjnych w logistyce B2B"
  ];

  const painPoints = isContainers ? [
    "Ugięcia i pęknięcia konstrukcji spawanych przy wywozie ciężkiego gruzu",
    "Rosnące marże dystrybutorskie na kontenery City Container DIN 30735 oraz bramowce",
    "Brak terminowych dostaw kontenerów hakowych 36m3 (DIN 30722-1 i 30722-2) dostosowanych do wiórów stalowych"
  ] : [
    "Przeładowanie czasowe operacji manualnych",
    "Rosnące stawki pośredników transportu",
    "Ryzyko obciążeń finansowych z powodu niezgodności w ewidencjach środowiskowych"
  ];

  const dms = [
    {
      name: contentLower.includes("nordic") ? "Lars Sørensen" : (contentLower.includes("hanseatische") ? "Hans-Dieter Meyer" : "Tomasz Nowakowski"),
      position: contentLower.includes("nordic") ? "Driftschef / Logistics Supervisor" : (contentLower.includes("hanseatische") ? "Einkaufsleiter / Chief Sourcing Coordinator" : "Dyrektor ds. Zakupów i Logistyki"),
      relevance_score: 9,
      linkedin_url: "https://www.linkedin.com/in/target-decision-maker",
      key_responsibility: isContainers 
         ? "Audyt norm DIN 30720 / 30722, negocjacje cenowe z producentem konstrukcji stalowych"
         : "Nadzór nad umowami podwykonawczymi i optymalizacjami kosztów operacyjnych"
    },
    {
      name: "Katarzyna Wiśniewska",
      position: "Kierownik ds. Ochrony Środowiska i BDO",
      relevance_score: 8,
      linkedin_url: "https://www.linkedin.com/in/katarzyna-wisniewska-mock",
      key_responsibility: "Nadzór nad sprawozdawczością odpadową i zgodnością prawną"
    }
  ];

  return {
    company_name: companyName,
    decision_makers: dms,
    buying_signals: buyingSignals,
    recommended_tone: "Techniczno-Inżynieryjny (powołanie się na konkretne specyfikacje i normy)",
    pain_points: painPoints
  };
};

// --- API ROUTES ---

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  const provider = process.env.LLM_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "simulation");
  res.json({ 
    status: "ok", 
    activeModel: provider === "ollama" 
      ? `Ollama (${process.env.OLLAMA_MODEL || "gemma2"})` 
      : (process.env.GEMINI_API_KEY ? "gemini-3.5-flash" : "Simulated Gemma-2 (Ollama)") 
  });
});

// LinkedIn Scraper Endpoint
app.post("/api/discovery/linkedin-scraper", async (req: Request, res: Response) => {
  try {
    const { companyName, productTarget } = req.body;
    
    if (!companyName || typeof companyName !== "string" || companyName.trim().length === 0) {
      return res.status(400).json({ error: "Podaj nazwę firmy (companyName) do zebrania danych z LinkedIn." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isOllama = process.env.LLM_PROVIDER === "ollama" || (!apiKey && process.env.OLLAMA_API_BASE);

    // Simulate/Fallback when API key is not present or mock is desired AND Ollama is not being used
    if (!isOllama && (!apiKey || apiKey === "MY_GEMINI_API_KEY")) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const companyNameLower = companyName.toLowerCase();
      
      let employeeCount = "101-500 pracowników";
      let headquarters = "Katowice, Śląskie, PL";
      let linkedinUrl = `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      let description = `Zrównoważony recykling w Europie Środkowo-Wschodniej. Specjalizujemy się w obróbce metali oraz odzysku odpadów poprodukcyjnych.`;
      let recentActivity = [
        "Inwestujemy w ekologiczną logistykę: ujednolicamy flotę kontenerów hakowych i bramowych by unikać postoi sprzętowych.",
        "Nasz park kontenerów powiększa się o asortyment muld i hakowców ze stali o podwyższonej odporności na deformacje.",
        "Kompleksowe doradztwo: pomagamy klientom w sprawozdawczości BDO przy odbiorze złomu stalowego i wiórów z produkcji."
      ];
      
      if (companyNameLower.includes("fcc")) {
        employeeCount = "250-500 pracowników";
        headquarters = "Chorzów, Śląskie, PL";
        description = "Przemysłowy, zintegrowany operator usług zbierania i logistyki odpadów komunalnych oraz surowców wtórnych.";
        recentActivity = [
          "Wprowadzamy dodatkowe kontenery hakowe o podwyższonej kubaturze 36m3 pod załadunki u śląskich partnerów hutniczych.",
          "Wystartowaliśmy ze szkoleniami eksperckimi: Optymalizacja KPO (Karty Przekazania Odpadu) a sprawny proces logistyczny.",
          "Modernizacja systemów RFID na wagach w naszych centrach recyklingu: automatyczny odczyt numeracji kontenera."
        ];
      } else if (companyNameLower.includes("remondis")) {
        employeeCount = "1000-5000 pracowników";
        headquarters = "Warszawa, Mazowieckie, PL";
        description = "Globalny lider usług komunalnych, gospodarki surowcami wtórnymi oraz bezpiecznej ewidencji procesów odzysku.";
        recentActivity = [
          "Circular Economy w praktyce: uruchomiliśmy nowy hub odzysku metali nieżelaznych i frakcji stalowej ze stopów ciężkich.",
          "Standaryzacja procesów BLO: wprowadzamy jednolity standard muld bramowych DIN 30720 i DIN 30735 dla naszych oddziałów regionalnych.",
          "Zakończony proces migracji ewidencji systemowej: Nasz zespół połączył operacje wagowe z centralną bazą BDO w czasie rzeczywistym."
        ];
      } else if (companyNameLower.includes("stena")) {
        employeeCount = "501-1000 pracowników";
        headquarters = "Marki, Mazowieckie, PL";
        description = "Skandynawskie standardy recyklingu i zagospodarowania surowców wtórnych, dedykowane dla fabryk oraz hutnictwa.";
        recentActivity = [
          "Raport emisji CO2 wykazuje, że optymalna trwałość kontenerów hakowych i transportowych redukuje szkodliwy ślad węglowy o 18%.",
          "Aktualny post na LinkedIn: Poszukujemy certyfikowanego, długofalowego producenta kontenerów bramowych ze stali S355 o wzmocnionym wieńcu.",
          "Wspieramy naszych dostawców w minimalizowaniu braków sprawozdawczych w ewidencji odpadów. Unikamy kar i opóźnień operacyjnych."
        ];
      } else if (companyNameLower.includes("prezero")) {
        employeeCount = "500-1000 pracowników";
        headquarters = "Poznań, Wielkopolskie, PL";
        description = "Operator innowacyjnych i zaawansowanych technologicznie usług ekologicznych na rzecz gospodarki zamkniętej.";
        recentActivity = [
          "Inwestycje w park maszynowy: rozbudowujemy bazy PSZOK w Wielkopolsce, co wiąże się z zapotrzebowaniem na dostawy kontenerów.",
          "Wspólnie ze śląskimi jednostkami recyklingowymi testujemy nowe typy muld bramowych DIN na ciężkie odpady po-hutnicze.",
          "Wdrożenie portalu dla klientów ułatwiającego zgłaszanie KPO jednym kliknięciem."
        ];
      } else if (companyNameLower.includes("huta silesia")) {
        employeeCount = "101-250 pracowników";
        headquarters = "Katowice, Śląskie, PL";
        description = "Zakład obróbki stali, odzysku metali nieżelaznych oraz hurtowego składowania konstrukcji przemysłowych na Górnym Śląsku.";
        recentActivity = [
          "Aktualizacja inwestycyjna: zwiększyliśmy tonaż składowania surowców wtórnych. Zakupujemy kolejne kontenery bramowe.",
          "Audyt ISO 14001 przeszedł pomyślnie. Zabezpieczamy nasze procesy ekologiczne zgodnie z rygorystycznymi wymogami.",
          "Szukamy dostawców kontenerów hakowych 36m3 (DIN 30722-1) o podwyższonej odporności na rozciąganie oraz pękanie."
        ];
      } else if (companyNameLower.includes("hanseatische")) {
        employeeCount = "51-200 pracowników";
        headquarters = "Hamburg, Niemcy";
        description = "Hanseatische Schrott & Metall GmbH ist ein spezialisierter Entsorgungs- und Metallrecycling-Fachbetrieb in Norddeutschland.";
        recentActivity = [
          "Wir erweitern unseren Schrottplatz und suchen Kooperationspartner für den Import hochwertiger Abrollcontainer nach DIN 30722.",
          "Sicherung der Logistikketten: Neuer Auftrag zur Entsorgung schwerer Industrieabfälle im Hamburger Hafen erfolgreich gestartet.",
          "Fokus Quality: Alle unsere Container-Systeme werden kontinuierlich auf Belastbarkeit und Schweißnaht-Qualität überprüft."
        ];
      }

      const rawTextSample = `📊 PROFIL FIRMY NA LINKEDIN (UDOSTĘPNIONE DANE METRYKALNE):
- Nazwa Firmy: ${companyName}
- LinkedIn URL: ${linkedinUrl}
- Siedziba Główna: ${headquarters}
- Szacowana Liczba Pracowników (Employee Count): ${employeeCount}
- Profil Działalności: ${description}

📝 OSTATNIE POSTY I AKTYWNOŚĆ NA LINKEDIN (RECENT ACTIVITY):
1. "${recentActivity[0]}"
2. "${recentActivity[1]}"
3. "${recentActivity[2]}"

💡 POTENCJAŁ I SYGNAŁY ZAKUPOWE (POD KĄTEM SFORMUŁOWANEGO PRODUKTU: ${productTarget || "Kontenery stalowe"}):
- Na podstawie profilu zatrudnienia (${employeeCount}) oraz aktywności na placach składowania, podmiot ten posiada wysokie obciążenia logistyczne i generuje stałe zapotrzebowanie na wymianę wyeksploatowanego parku kontenerowego.
- Informacje o optymalizacji transportu i dążeniu do norm DIN korelują z naszym asortymentem kontenerów hakowych typ DIN 30722 oraz kontenerów asymetrycznych bramowych standard DIN 30720. 
- Idealny punkt zaczepienia w zimnym kontakcie: Powołanie się na ich niedawne wzmianki o standaryzacji floty i zaoferowanie bezpośrednich dostaw bezpośrednio od producenta stali bez pośredników handlowych. Wynik zinterpretowany.`;

      return res.json({
        companyName,
        employeeCount,
        headquarters,
        linkedinUrl,
        description,
        recentActivity,
        rawTextSample,
        status: "simulated",
        warning: "Brak zweryfikowanego GEMINI_API_KEY. Uruchomiono tryb inteligentnego generatora profili."
      });
    }

    const promptText = `
Wyszukaj za pomocą wyszukiwarki Google i zbierz aktualne (lub wysoce prawdopodobne, publicznie dostępne w sieci) te podane informacje dla firmy o nazwie "${companyName}":
1. Prawdziwy, poprawny adres URL jej profilu firmowego na LinkedIn (linkedinUrl, np. "https://www.linkedin.com/company/remondis-polska").
2. Lokalizacja siedziby głównej (headquarters, miasto i państwo, np. "Chorzów, Polska").
3. Szacowana całkowita liczba pracowników na LinkedIn (employeeCount, np. "501-1000 pracowników").
4. Krótkie podsumowanie profilu i misji firmy (description).
5. 3 najbardziej charakterystyczne, niedawne posty, aktualności biznesowe, przejęcia, inwestycje sprzętowe lub ogłoszenia rekrutacyjne (recentActivity) - zapisz je w postaci zwięzłych zdań.
6. Zbiorczy raport (enrichedRawSample) sformatowany w wysoce profesjonalny sposób. Ten tekst trafi bezpośrednio do pola 'rawTextSample' nowo utworzonego leadu. W raporcie tym musisz zintegrować powyższe metadane, ich ostatnie posty/rekrutacje i wywnioskować jak najgłębiej, w jaki sposób koresponduje to z ich potrzebą zakupową odnośnie:
   "${productTarget || "atestowane kontenery stalowe dla przemysłu ciężkiego i odpadów (normy DIN 30720 i DIN 30722)"}". Powołaj się na te dane jako idealne podłoże (tzw. trigger event) do rozpoczęcia oferty handlowej (cold email).

Sformatuj wynik wyłącznie jako poprawny, jedno-linijkowy lub poprawnie sformatowany obiekt JSON o następującej strukturze pól:
{
  "companyName": "${companyName}",
  "employeeCount": "liczba i przedział pracowników",
  "headquarters": "miasto, kraj",
  "linkedinUrl": "pełny url spółki",
  "description": "krótki opis spółki",
  "recentActivity": [
    "Post 1: treść postu",
    "Post 2: treść postu",
    "Post 3: treść postu"
  ],
  "enrichedRawSample": "profesjonalny zbiorczy raport tekstowy o wielkości, profilu i dopasowaniu oferty z punktami zaczepienia..."
}

BARDZO WAŻNE: Zwróć wyłącznie czysty kod JSON w formacie stringa bez żadnych znaczników markdown \`\`\`json i bez żadnego tekstu przed ani po nim. Ma to być poprawnie parsowane za pomocą JSON.parse.
`;

    let textOutput = "{}";

    if (isOllama) {
      textOutput = await runAIQuery({
        prompt: promptText,
        responseMimeType: "application/json",
        temperature: 0.2
      });
    } else {
      // Lazy initialization of Gemini client
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });
      textOutput = response.text || "{}";
    }

    const parsedData = JSON.parse(textOutput);
    
    // Fallback block mapping
    if (!parsedData.enrichedRawSample) {
      parsedData.enrichedRawSample = `📊 PROFIL FIRMY NA LINKEDIN (UDOSTĘPNIONE DANE METRYKALNE):
- Nazwa Firmy: ${parsedData.companyName || companyName}
- LinkedIn URL: ${parsedData.linkedinUrl || 'Bezpośredni profil LinkedIn'}
- Siedziba Główna: ${parsedData.headquarters || 'Nie zidentyfikowano'}
- Szacowana Liczba Pracowników (Employee Count): ${parsedData.employeeCount || 'Brak danych spisu'}
- Profil Działalności: ${parsedData.description || 'Brak danych'}

NOTE: Zoptymalizowane zapytanie pod kątem: ${productTarget}`;
    }

    return res.json({
      companyName: parsedData.companyName || companyName,
      employeeCount: parsedData.employeeCount || "Nie określono",
      headquarters: parsedData.headquarters || "Polska",
      linkedinUrl: parsedData.linkedinUrl || "https://www.linkedin.com",
      description: parsedData.description || "Brak szczegółowego opisu.",
      recentActivity: parsedData.recentActivity || [],
      rawTextSample: parsedData.enrichedRawSample,
      status: "live"
    });

  } catch (error: any) {
    console.error("LinkedIn Scraper Route Error:", error);
    return res.status(500).json({ 
      error: "Błąd integracyjny po stronie LinkedIn Scraper API.", 
      message: error.message 
    });
  }
});

// AI Campaign Strategy & Smart Search Expansion
app.post("/api/discovery/analyze-strategy", async (req: Request, res: Response) => {
  try {
    const { whoAreYou, whatAreYouLookingFor, examplesAndIdeas } = req.body;

    const queryLower = (examplesAndIdeas || "").toLowerCase() + " " + (whatAreYouLookingFor || "").toLowerCase();
    
    // Check if Gemini API or Ollama exists
    const apiKey = process.env.GEMINI_API_KEY;
    const isOllama = process.env.LLM_PROVIDER === "ollama" || (!apiKey && process.env.OLLAMA_API_BASE);

    if (!isOllama && (!apiKey || apiKey === "MY_GEMINI_API_KEY")) {
      // Return high quality simulation designed dynamically to match the user's intent:
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let locationText = "Poznań, Wielkopolskie";
      if (queryLower.includes("śląsk") || queryLower.includes("katowic") || queryLower.includes("gliwic")) {
        locationText = "Górny Śląsk (Katowice/Gliwice)";
      } else if (queryLower.includes("warszaw") || queryLower.includes("mazowieck")) {
        locationText = "Warszawa, Mazowieckie";
      } else if (queryLower.includes("wrocław") || queryLower.includes("dolnoślą")) {
        locationText = "Wrocław, Dolnośląskie";
      }

      // Base expansion results
      let expandedLeads = [
        {
          id: "exp-1",
          companyName: "EKOGRUZ POZNAŃ s.c.",
          address: "ul. Syrenia 4, 61-005 Poznań",
          nip: "7773245112",
          description: "Prężny wielkopolski dostawca usług wywozu gruzu, odpadów budowlanych oraz wynajmu kontenerów bramowych.",
          recommenedTool: "LinkedIn Scraper (API) / Google Maps",
          potential: "Wysoki - logistyka oparta na muldach asymetrycznych (DIN 30720). Trwa rekrutacja kierowcy kat. C."
        },
        {
          id: "exp-2",
          companyName: "SKIPGROUP Sp. z o.o.",
          address: "ul. Obodrzycka 65, 61-249 Poznań",
          nip: "7822558910",
          description: "Szybki wywóz odpadów komunalnych, zielonych oraz gruzu pobudowlanego. Park pojazdów bramowych i hakowych.",
          recommenedTool: "LinkedIn Scraper (API)",
          potential: "Krytyczny - posiadają szeroką flotę kontenerów hakowych 7m3 do 40m3. Zgłaszają zapotrzebowanie na wymianę taboru."
        },
        {
          id: "exp-3",
          companyName: "CDS RECYKLING s.c.",
          address: "ul. Główna 15, 62-020 Swarzędz",
          nip: "7773024883",
          description: "Zbiórka surowców wtórnych, odzysk gruzu, kruszywa budowlane i drogowe z recyklingu.",
          recommenedTool: "Krajowy Rejestr BDO (PL)",
          potential: "Średni - wysoki tonaż obrotu odpadami na kartach KPO, stałe zlecenia logistyczne."
        },
        {
          id: "exp-4",
          companyName: "EKO-GRUZ PL Sp. z o.o.",
          address: "ul. Kamiennogórska 12, 60-179 Poznań",
          nip: "7792429110",
          description: "Transport kruszyw oraz kompleksowy odbiór śmieci i kontenerów na odpady poremontowe.",
          recommenedTool: "Google Maps Regionalnie",
          potential: "Wysoki - zapotrzebowanie na stabilne, spawane robotem kontenery bramowe symetryczne oraz asymetryczne."
        },
        {
          id: "exp-5",
          companyName: "SMI ECO Sp. z o.o.",
          address: "Suchy Las, pl. Grzybowy 2, 62-002",
          nip: "7773349221",
          description: "Usługi asenizacyjne, komunalne oraz specjalistyczny wywóz materiałów sypkich i pobudowlanych w kontenerach hakowych.",
          recommenedTool: "LinkedIn Scraper (API)",
          potential: "Średni - rosnące zapotrzebowanie na kontenery muldowe DIN 30720 pod wywóz ciężkiego kruszywa."
        }
      ];

      // Customise expansion results if query indicates a different region or industry
      if ((queryLower.includes("śląsk") || queryLower.includes("recykling") || queryLower.includes("huta") || queryLower.includes("złom")) && !queryLower.includes("pozna")) {
        expandedLeads = [
          {
            id: "exp-sl-1",
            companyName: "Huta Silesia Recykling Sp. z o.o.",
            address: "ul. Roździeńskiego 188, 40-315 Katowice",
            nip: "6348129011",
            description: "Wiodąca huta przetwarzająca odpady poprodukcyjne, złom stalowy oraz wióry obróbcze na Górnym Śląsku.",
            recommenedTool: "Krajowy Rejestr BDO (PL)",
            potential: "Krytyczny - sprawozdawczość BDO wykazuje braki kontenerów hakowych 36m3 (DIN 30722-1) o podwyższonej odporności."
          },
          {
            id: "exp-sl-2",
            companyName: "SCRAP & METAL Silesia Sp. z o.o.",
            address: "ul. Przemysłowa 3, 41-902 Bytom",
            nip: "6263004811",
            description: "Hurtowy skup złomu, demontaż konstrukcji stalowych, magazynowanie odpadów metalurgicznych.",
            recommenedTool: "LinkedIn Scraper (API)",
            potential: "Wysoki - dynamiczny obrót ciężkimi ładunkami. Potrzeba dostaw ustandaryzowanego parku maszynowego typu DIN."
          },
          {
            id: "exp-sl-3",
            companyName: "EKO-GIGANT Recykling Karb",
            address: "ul. Konstytucji 82, 41-905 Bytom",
            nip: "6262919877",
            description: "Gospodarka surowcami wtórnymi, przetwarzanie kabli i złomu metali nieżelaznych.",
            recommenedTool: "Google Maps Regionalnie",
            potential: "Średni - mniejszy tonaż, ale operują na stałych umowach z fabrykami motoryzacyjnymi."
          }
        ];
      }

      const strategicAnalysis = `W oparciu o profil Twojej firmy (${whoAreYou || "Producenta stali i kontenerów"}) oraz cel wyszukiwania (${whatAreYouLookingFor || "odbiorców handlowych"}), zidentyfikowaliśmy silną synergię z rynkiem lokalnego wywozu odpadów w regionie: **${locationText}**.
Te podmioty posiadają ciągłe i naturalne zużycie taboru kontenerowego. Stalowe muldy asymetryczne (DIN 30720) i kontenery hakowe (DIN 30722) na gruz pękają na spawach lub ulegają korozji chemicznej pod wpływem wilgoci.

**🧠 Rekomendowana taktyka zimnego kontaktu (Cold Contact):**
1. Omiń ogólny mail biurowy. Użyj modułu **LinkedIn Scraper** dla wybranej poniżej firmy, aby namierzyć Kierownika Logistyki, Właściciela lub Dyrektora ds. Zakupów (Purchasing Manager).
2. Jako argument początkowy (trigger event) w mailu handlowym/ofercie powołaj się na ich dynamiczny rozwój floty (często widoczny w ich postach lub ogłoszeniach o pracę dla kierowców kategorii C+E) i zaoferuj dostawy bezpośrednie prosto od polskiego producenta ze stali S355 (zwiększona odporność o 40%).
3. Sprawdź ich status w **BDO** - jeśli mają duży wolumen, zaoferuj kontenery spełniające kryteria transportu odpadów niebezpiecznych (wymóg uszczelnienia poliuretanowego).`;

      return res.json({
        strategicAnalysis,
        recommendedKeywords: ["wywóz gruzu", "kontenery poremontowe", "odpady budowlane", "skip", "złom", "kruszywa"],
        recommendedTools: ["Google Maps Regionalnie", "LinkedIn Scraper (API)", "Krajowy Rejestr BDO (PL)"],
        expandedLeads,
        status: "simulated"
      });
    }

    const promptText = `
Zostajesz wdrożony jako ekspert ds. rozwoju biznesu B2B (Business Development). Twój użytkownik korzysta z systemu "MilaSignal" do automatycznego wyszukiwania i profilowania leadów handlowych.
Dane wejściowe użytkownika:
- Kim jest / Czym się zajmuje: "${whoAreYou || "Producent atestowanych kontenerów stalowych wg DIN"}"
- Kogo/Czego szuka w terenie: "${whatAreYouLookingFor || "Firma wywozowych, budowlanych, PSZOKów, złomowisk"}"
- Przykłady / Podpowiedzi bazowe: "${examplesAndIdeas || "ekogruz poznań"}"

Twoim nadrzędnym zadaniem jest:
1. Sformułować precyzyjną, taktyczną analizę strategiczną (strategicAnalysis) w języku polskim, tłumaczącą użytkownikowi jak ugryźć ten segment rynku, co jest ich głównym problemem (pain point) oraz jak rozpocząć ofertę (cold pitch) powołując się na informacje z sieci.
2. Zaproponować od 4 do 6 najtrafniejszych, wyspecjalizowanych słów kluczowych (recommendedKeywords) do wyszukiwania w Google Maps / Panoramie na ten rykem.
3. Wybrać optymalne narzędzia w aplikacji (recommendedTools), np. ["Google Maps Regionalnie", "LinkedIn Scraper (API)", "Krajowy Rejestr BDO (PL)"].
4. **BARDZO WAŻNE (Smart Semantyczna Ekstrakcja)**: Przeanalizuj podany przez użytkownika przykład lub region (np. "ekogruz poznań") i wygeneruj tablicę (expandedLeads) od 3 do 5 realnych lub wysoce prawdopodobnych dla tej lokalizacji podobnych, konkurencyjnych firm z tej samej branży w regionie. Np. jeśli wpisał "ekogruz poznań", wykaż takie podmioty jak "Skipgroup Poznań", "CDS Recykling Swarzędz", "Eko-Gruz s.c.", "Smart-Unit" itp. Dla każdego podmiotu wygeneruj:
   - "companyName": Pełna, poprawna nazwa firmy
   - "address": Realnie brzmiący lub dokładny adres tej firmy w tym regionie
   - "nip": Prawdziwy lub prawdopodobny 10-cyfrowy NIP
   - "description": Krótki, merytoryczny opis profilu tej firmy i czym się zajmuje
   - "recommenedTool": Rekomendowane dla niej narzędzie skanujące (np. "LinkedIn Scraper (API)" lub "Krajowy Rejestr BDO")
   - "potential": Ocena potencjału zakupowego wraz z krótkim uzasadnieniem merytorycznym (np. "Krytyczny - rozbudowana flota hakowców...")

Zwróć wynik wyłącznie jako poprawnie sformatowany obiekt JSON o następującej strukturze, bez żadnych znaczników markdown i dodatkowego tekstu:
{
  "strategicAnalysis": "Treść analizy i taktyki kontaktu po polsku...",
  "recommendedKeywords": ["słowo1", "słowo2"],
  "recommendedTools": ["narzędzie1", "narzędzie2"],
  "expandedLeads": [
    {
      "id": "exp-1",
      "companyName": "Nazwa firmy",
      "address": "Adres",
      "nip": "NIP",
      "description": "Opis firmy",
      "recommenedTool": "narzędzie",
      "potential": "Wysoki - uzasadnienie..."
    }
  ]
}
`;

    // Live AI execution
    let textOutput = "{}";

    if (isOllama) {
      textOutput = await runAIQuery({
        prompt: promptText,
        responseMimeType: "application/json",
        temperature: 0.25
      });
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          temperature: 0.25
        }
      });
      textOutput = response.text || "{}";
    }

    const parsedData = JSON.parse(textOutput);

    return res.json({
      strategicAnalysis: parsedData.strategicAnalysis || "Przeprowadzono analizę semantyczną rynków.",
      recommendedKeywords: parsedData.recommendedKeywords || ["wywóz śmieci", "odpady budowlane", "recykling", "kontenery"],
      recommendedTools: parsedData.recommendedTools || ["Google Maps Regionalnie", "LinkedIn Scraper (API)"],
      expandedLeads: parsedData.expandedLeads || [],
      status: "live"
    });

  } catch (error: any) {
    console.error("Analyze Strategy Route Error:", error);
    return res.status(500).json({ 
      error: "Błąd analizy strategicznej po stronie AI API.", 
      message: error.message 
    });
  }
});

// AI Analyze Company Text
app.post("/api/recon/analyze", async (req: Request, res: Response) => {
  try {
    const { textSample, productTarget } = req.body;
    
    if (!textSample || typeof textSample !== "string" || textSample.trim().length === 0) {
      return res.status(400).json({ error: "Brak tekstu źródłowego do analizy (textSample)." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isOllama = process.env.LLM_PROVIDER === "ollama" || (!apiKey && process.env.OLLAMA_API_BASE);

    if (!isOllama && (!apiKey || apiKey === "MY_GEMINI_API_KEY")) {
      // Simulate slow model processing for authenticity
      await new Promise(resolve => setTimeout(resolve, 1500));
      const simulatedResult = getSimulatedAnalystReport(textSample, productTarget);
      return res.json({
        report: simulatedResult,
        status: "simulated",
        warning: "Brak aktywnego GEMINI_API_KEY w panelu Secrets. Uruchomiono tryb symulacji z polskimi bazami danych."
      });
    }

    const systemInstruction = `
Jesteś modułem "The Analyst" w systemie Mila LeadSniper. 
Twoim zadaniem jest przetworzenie surowych danych tekstowych pobranych z profilu firmy na LinkedIn oraz podstron "O nas/Zespół" i zidentyfikowanie kluczowych decydentów zakupowych (DMU - Decision Making Unit).

BARDZO WAŻNE: Twoje analizy i oceny dopasuj bezpośrednio pod kątem sprzedaży następującego produktu lub usługi:
"${productTarget || "Kontenery stalowe na odpady przemysłowe / muldy i kontenery hakowe"}".

Twoje Cele:
1. Mapowanie Decydentów: Znajdź osoby na stanowiskach odpowiadających za zakupy, logistykę lub infrastrukturę pod ten produkt: Purchasing Manager, Supply Chain Director, Logistics Manager, Właściciel, Dyrektor Operacyjny itp.
2. Analiza Potencjału: Na podstawie opisów stanowisk i publikacji firmy oceń w skali 1-10 (relevance_score), jak prawdopodobne jest, że ta osoba odpowiada za zakupy tego produktu lub optymalizację logistyki/odpadów.
3. Sentiment & Tone: Określ optymalny styl komunikacji z firmą (Formalny / Relacyjny / Techniczny / Inżynieryjny).
4. Do NOT hallucinate names. If not clearly stated, use 'Nie zidentyfikowano' or 'Brak danych' for individual values.
Dokonaj analizy w języku polskim.
`;

    let textOutput = "{}";

    if (isOllama) {
      const gemmaPrompt = `Oto pobrana treść ze strony i profilu firmy do przeanalizowania:\n\n${textSample}

Zwróć wynik wyłącznie jako poprawnie sformatowany obiekt JSON o następującej strukturze, bez żadnych znaczników markdown:
{
  "company_name": "Pełna nazwa firmy z tekstu",
  "decision_makers": [
    {
      "name": "Imię i nazwisko osoby",
      "position": "Pełne stanowisko po polsku lub angielsku",
      "relevance_score": 9,
      "linkedin_url": "url lub pusty string",
      "key_responsibility": "Krótka rekonstrukcja odpowiedzialności zakupowej"
    }
  ],
  "buying_signals": ["sygnał1", "sygnał2"],
  "recommended_tone": "Ton kontaktu",
  "pain_points": ["słabość1", "słabość2"]
}
`;
      textOutput = await runAIQuery({
        systemInstruction,
        prompt: gemmaPrompt,
        responseMimeType: "application/json",
        temperature: 0.2
      });
    } else {
      // Lazy initialization of Gemini client
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Oto pobrana treść ze strony i profilu firmy do przeanalizowania:\n\n${textSample}`,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              company_name: {
                type: Type.STRING,
                description: "Pełna nazwa firmy z tekstu."
              },
              decision_makers: {
                type: Type.ARRAY,
                description: "Kluczowe osoby decyzyjne zidentyfikowane w treści.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Imię i nazwisko osoby" },
                    position: { type: Type.STRING, description: "Pełne stanowisko po polsku lub angielsku" },
                    relevance_score: { type: Type.INTEGER, description: "Jak ważna to osoba w procesie zakupowym (skala 1-10)" },
                    linkedin_url: { type: Type.STRING, description: "Prawdziwy url lub pusty string, jeśli nie znaleziono" },
                    key_responsibility: { type: Type.STRING, description: "Krótka rekonstrukcja odpowiedzialności zakupowej" }
                  },
                  required: ["name", "position", "relevance_score", "key_responsibility"]
                }
              },
              buying_signals: {
                type: Type.ARRAY,
                description: "Jakie sygnały zakupowe, plany rozwoju czy wyzwania zostały powiedziane?",
                items: { type: Type.STRING }
              },
              recommended_tone: {
                type: Type.STRING,
                description: "Jaki ton korespondencji należy przyjąć (np. Bardzo formalny, Techniczno-konkretny, Partnerski, Inżynieryjny)."
              },
              pain_points: {
                type: Type.ARRAY,
                description: "Kluczowe słabości lub wyzwania, z którymi mierzy się ta firma.",
                items: { type: Type.STRING }
              }
            },
            required: ["company_name", "decision_makers", "buying_signals", "recommended_tone", "pain_points"]
          }
        }
      });
      textOutput = response.text || "{}";
    }

    const parsedReport = JSON.parse(textOutput || '{}');
    return res.json({
      report: parsedReport,
      status: "live",
      model: isOllama ? `Ollama (${process.env.OLLAMA_MODEL || "gemma2"})` : "gemini-3.5-flash"
    });

  } catch (error: any) {
    console.error("Gemini Recon API Error:", error);
    return res.status(500).json({ 
      error: "Wystąpił błąd podczas analizy biznesowej przez silnik Gemini.", 
      message: error.message 
    });
  }
});

// AI Pitch Generator
app.post("/api/recon/pitch", async (req: Request, res: Response) => {
  try {
    const { report, productTarget, activeRole } = req.body;
    if (!report || !report.company_name) {
      return res.status(400).json({ error: "Prześlij zaktualizowany raport (AnalystReport) do generowania oferty." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isOllama = process.env.LLM_PROVIDER === "ollama" || (!apiKey && process.env.OLLAMA_API_BASE);

    if (!isOllama && (!apiKey || apiKey === "MY_GEMINI_API_KEY")) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const targetStr = productTarget || "atestowane kontenery stalowe DIN 30720 / DIN 30722";
      const isDe = report.company_name.toLowerCase().includes("gmbh") || report.decision_makers?.[0]?.position.toLowerCase().includes("einkauf") || false;
      const isDk = report.company_name.toLowerCase().includes("aps") || report.decision_makers?.[0]?.position.toLowerCase().includes("drift") || false;
      const roleSign = activeRole || "Doradca Techniczno-Handlowy";

      if (isDe) {
        return res.json({
          pitch: `Sehr geehrter Herr ${report.decision_makers?.[0]?.name.split(' ').pop() || 'Meyer'},\n\nich kontaktiere Sie bezüglich Ihrer Entsorgungs- und Metallrecyclingaktivitäten bei ${report.company_name}.\n\nAls Hersteller hochwertiger Stahlbehälter bieten wir zertifizierte Behälter nach DIN 30720 (Absetzkipper) sowie Großcontainer nach DIN 30722-1/2 (Abrollkipper) direkt ab Werk an. Wir wissen, dass in Ihrer Branche folgendes ein kritisches Thema ist: ${report.pain_points?.[0] || 'Verschleiß von Schrottcontainern'}.\n\nGerade dla ${report.company_name} können wir maßgeschneiderte, verstärkte Ausführungen anbieten, die Ihre logistischen Ausfallzeiten minimieren.\n\nHätten Sie Zeit für ein kurzes, 5-minütiges Telefonat in dieser Woche, um Spezifikationen und Frachtpreise zu besprechen?\n\nMit freundlichen Grüßen,\nIhr Team Mila LeadSniper\n(Position: ${roleSign} | Export-Abteilung)\n[Simulierte DE-Generierung]`
        });
      }

      if (isDk) {
        return res.json({
          pitch: `Kære ${report.decision_makers?.[0]?.name.split(' ').shift() || 'Lars'},\n\nJeg kontakter dig angående drifts- og logistikaktiviteterne hos ${report.company_name}.\n\nSom producent af industrielle stålcontainere tilbyder vi robuste containere i henhold til DIN 30720 og store krogcontainere (DIN 30722-1/2 op til 36m3) direkte fra fabrikken. Vi forstår, at I står overfor udfordringer som: ${report.pain_points?.[0] || 'slid på stålbeholdere'}.\n\nKan vi aftale et kort 5-minutters opkald i denne uge for at drøfte jeres containerbehov og priser?\n\nMed venlig hilsen,\nTeam Mila LeadSniper\n(Rolle: ${roleSign} | Skandinavien)\n[Simuleret DK-Generering]`
        });
      }

      return res.json({
        pitch: `Szanowny Panie ${report.decision_makers?.[0]?.name.split(' ').pop() || 'Nowakowski'},\n\nKontaktuję się bezpośrednio w nawiązaniu do operacji logistycznych w firmie ${report.company_name}.\n\nRozumiemy wyzwania rynkowe i techniczne, z którymi się Państwo mierzą, w szczególności: ${report.pain_points?.[0] || 'uszkodzenia mechaniczne konstrukcji'}.\n\nW odpowiedzi na te potrzeby oferujemy bezpośrednie dostawy od producenta obejmujące: ${targetStr}.\n\nZapewniamy pełną zgodność z normami DIN 30720 (muldy i bramowce), DIN 30735 (city) oraz hakowcami o pojemności do 36m3 (DIN 30722-1/2), wykonanymi ze stali o podwyższonej sprężystości.\n\nCzy ${report.decision_makers?.[0]?.name || 'Pan Dyrektor'} znalazłby 5 minut na krótką, techniczną rozmowę w tym tygodniu?\n\nZ wyrazami szacunku,\nZespół Mila LeadSniper\n(Stanowisko nadawcy: ${roleSign})\n[Simulated PL-Generierung]`
      });
    }

    const primaryDM = report.decision_makers?.[0];
    const dmName = primaryDM ? primaryDM.name : "Państwa";
    const dmRole = primaryDM ? primaryDM.position : "osoba decyzyjna";

    const prompt = `
Stwórz wysoce spersonalizowaną, profesjonalną, precyzyjną wiadomość sprzedażową (cold email) od firmy oferującej następujący produkt/usługę:
"${productTarget || "Kontenery stalowe na odpady przemysłowe DIN"}"
Nadawca wiadomości reprezentuje rolę: "${activeRole || "Doradca Techniczny"}".

Adresat wiadomości: ${dmName} (${dmRole}) z firmy ${report.company_name}.
Rekomendowany ton wypowiedzi: ${report.recommended_tone}.
Wykorzystaj te zidentyfikowane wyzwania (pain points): ${report.pain_points?.join(", ")}.
Sygnały zakupowe: ${report.buying_signals?.join(", ")}.

Zasady:
1. Wiadomość ma być zwięzła (maksymalnie 150-180 słów), pozbawiona 'marketingowego lania wody', konkretna i techniczna.
2. Powołaj się bezpośrednio na oferowany produkt oraz to, jak bezpośrednie dostawy od producenta pomagają rozwiązać wymienione wyzwania (pain points). Jeśli adresat jest z Niemiec (np. firma GmbH lub stanowisko z językiem niemieckim) napisz tę wiadomość profesjonalnie w języku niemieckim! Jeśli adresat jest z Danii (np. firma ApS lub kontakt z Danii), napisz w języku duńskim! W innym przypadku napisz po polsku.
3. Zaproponuj konkretny call-to-action (np. krótkie spotkanie darmowe 5-minutowe lub kalkulację bezpośredniej dostawy fabrycznej).
4. Nie wpisuj sztucznych placeholderów we wzorze - generujesz gotową wiadomość bez '[Wpisz imię]' itp.
`;

    let textOutput = "";
    if (isOllama) {
      textOutput = await runAIQuery({
        prompt,
        temperature: 0.7
      });
    } else {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
      textOutput = response.text || "";
    }

    return res.json({
      pitch: textOutput
    });

  } catch (error: any) {
    console.error("Gemini Pitch API Error:", error);
    return res.status(500).json({ 
      error: "Błąd podczas generowania oferty spersonalizowanej.", 
      message: error.message 
    });
  }
});


// AI Database / Register Suggester for Foreign Markets
app.post("/api/recon/suggest-databases", async (req: Request, res: Response) => {
  try {
    const { country, whatToSearch, productTarget } = req.body;
    if (!country || !whatToSearch) {
      return res.status(400).json({ error: "Podaj nazwę kraju oraz krótki opis tego co szukamy." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isOllama = process.env.LLM_PROVIDER === "ollama" || (!apiKey && process.env.OLLAMA_API_BASE);
    const countryLower = country.toLowerCase().trim();

    if (!isOllama && (!apiKey || apiKey === "MY_GEMINI_API_KEY")) {
      // High fidelity localized presets for when Gemini API key is not present
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let suggestions: string[] = [];
      if (countryLower.includes("niemc") || countryLower.includes("germany") || countryLower === "de") {
        suggestions = [
          "LAGA (Länderarbeitsgemeinschaft Abfall) - Niemieckie rejestry odpadów poszczególnych landów (odpowiednik polskiego BDO). Kluczowy rejestr firm wytwarzających i utylizujących odpady przemysłowe.",
          "KrWG § 54 (Befördererlaubnis Register) - Oficjalny niemiecki rejestr przewoźników odpadów posiadających zezwolenie na transport materiałów niebezpiecznych oraz zwykłych gruzów.",
          "IHK (Industrie- und Handelskammer) Regionalregister - Izby przemysłowo-handlowe z podziałem na landy (np. IHK München, IHK Hamburg), służące jako doskonały agregator firm produkcyjnych i logistycznych.",
          "Handelsregister (rejestr handlowy RFN) - Bezpośredni wgląd w formy prawne (GmbH, GmbH & Co. KG) o profilu Schrotthandel (złomowanie) i Metallrecycling."
        ];
      } else if (countryLower.includes("dan") || countryLower.includes("denmark") || countryLower === "dk") {
        suggestions = [
          "Affaldsregisteret (Miljøstyrelsen) - Krajowy duński spis podmiotów odpowiedzialnych za transport, zbieranie i produkcję odpadów (odpowiednik BDO).",
          "Virk CVR Register (Central Business Register) - Bezpłatny państwowy portal duński z kompletnymi danymi kontaktowymi i kodami branżowymi (NACE/DB07).",
          "Krak Markedsdata B2B / Proff.dk - Platformy finansowo-handlowe i indeksy przydatne do ekstrakcji decydentów (Driftschef, Direktør) z branży kruszyw, złomu i budownictwa."
        ];
      } else if (countryLower.includes("czech") || countryLower.includes("cz")) {
        suggestions = [
          "ISOH (Informační Systém Odpadového Hospodářství) - Czeski system gospodarki odpadami rejestrujący ewidencję sprawozdawczą, bezpośredni odpowiednik polskiego rejestru BDO.",
          "ARES (Administrativní Registr Ekonomických Subjektů) - Baza Ministerstwa Finansów Czech umożliwiająca wyszukanie podmiotów metalurgicznych i budowlanych.",
          "Firmy.cz B2B Index - Najlepszy czeski katalog firm do pobierania adresów i weryfikacji placów złomowania surowców wtórnych."
        ];
      } else if (countryLower.includes("fran") || countryLower.includes("fr") || countryLower.includes("france")) {
        suggestions = [
          "Sinoe (Système d'Information National sur l'Eau et les Déchets) - Francuski krajowy rejestr odpadowy służący jako precyzyjna baza transportu i odzysku odpadów komunalnych.",
          "Infogreffe - Oficjalny rejestr handlowy we Francji dostarczający nazwiska kierowników logistyki i dyrektorów zakupów (Directeur des Achats).",
          "Federec (Annuaire des Entreprises de Recyclage) - Branżowa baza zrzeszenia francuskich recyklerów stali, złomu i wyburzeń."
        ];
      } else if (countryLower.includes("szwec") || countryLower.includes("se") || countryLower.includes("sweden")) {
        suggestions = [
          "Avfallsregistret (Naturvårdsverket) - Szwedzki rejestr ewidencji i przewozu odpadów (odpowiednik BDO) z pełną bazą podmiotów transportujących gruz i złom.",
          "Allabolag.se - Uniwersalny szwedzki portal z danymi operacyjnymi, przychodami oraz nazwiskami osób decyzyjnych (Inköpschef / Inköpare).",
          "Bolagsverket - Szwedzki urząd rejestracji spółek (odpowiednik KRS) zapewniający weryfikację autentyczności placów złomowych."
        ];
      } else {
        suggestions = [
          `${country} Central Environmental & Waste Registry - Lokalny rejestr pozwoleń środowiskowych na zbieranie i transport odpadów, odpowiednik polskiego BDO.`,
          `${country} Federal Commercial Register - Krajowa Izba Gospodarcza i Rejestr Handlowy zrzeszający spółki z sektora odpadowego / recyklingu metalu.`,
          "Local YellowPages & Google Places API Locator - Agregatory pozwalające na zidentyfikowanie lokalizacji fizycznych placów składowania i punktów PSZOK."
        ];
      }

      return res.json({
        country,
        whatToSearch,
        suggestions,
        status: "simulated",
        engine: "Mila Database Brain v2.5"
      });
    }

    // Call live AI to build premium localized database strategy
    const prompt = `
Jesteś starszym architektem data-miningu i ekspertem B2B w systemie Mila LeadSniper.
Użytkownik sprzedaje produkt: "${productTarget || "stalowe kontenery na odpady, hakowce, muldy DIN 30720 / 30722"}".
Użytkownik chce pozyskać leady w kraju: "${country}", poszukując: "${whatToSearch}".

Zasugeruj konkretną listę 3-4 lokalnych baz danych, rejestrów państwowych (np. odpowiednik polskiego rejestru sprawozdawczości środowiskowej BDO, czyli ewidencji odpadów), rejestrów izb handlowych czy oficjalnych katalogów przemysłowych, które należy przeszukać/skanować, aby znaleźć te firmy.

Dla każdego rejestru podaj jego oryginalną nazwę lokalną i opisz w jednym zwięzłym zdaniu w języku polskim, dlaczego jest idealny do tego wyszukiwania i jakiego rodzaju informacje (licencje, sprawozdania, transport, kontakty) możemy z niego wyciągnąć.

Zwróć odpowiedź jako poprawny obiekt JSON o strukturze:
{
  "country": "${country}",
  "whatToSearch": "${whatToSearch}",
  "suggestions": [
    "OryginalnaNazwaRejestru (Skrót) - Opis po polsku jak on pasuje pod ten profil i co z niego wyjmiemy.",
    ...
  ]
}
Sformatuj wyłącznie jako czysty JSON bez znaczników markdown \`\`\`json. Do not use surrounding markdown markup.
`;

    let textOutput = "{}";

    if (isOllama) {
      textOutput = await runAIQuery({
        prompt,
        responseMimeType: "application/json"
      });
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      textOutput = response.text || "{}";
    }

    const parsedData = JSON.parse(textOutput || '{}');
    return res.json({
      country: parsedData.country || country,
      whatToSearch: parsedData.whatToSearch || whatToSearch,
      suggestions: parsedData.suggestions || [],
      status: "live",
      engine: isOllama ? `Ollama (${process.env.OLLAMA_MODEL || "gemma2"})` : "Gemini 3.5 Core Sourcing"
    });

  } catch (error: any) {
    console.error("Suggest databases route error:", error);
    return res.status(500).json({ error: "Błąd podczas generowania rekomendacji rejestrów.", message: error.message });
  }
});


// --- VITE MIDDLEWARE SETUP AND BOOTSTRAP ---

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start Server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Mila LeadSniper booted successfully at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Vite/Express bootstrap failure:", err);
});
