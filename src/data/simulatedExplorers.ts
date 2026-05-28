/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SimulatedCompany {
  id: string;
  companyName: string;
  nip: string;
  bdoNumber: string;
  city: string;
  province: string;
  industry: string;
  sourceType: 'BDO' | 'Google Maps' | 'Panorama' | 'Eksport';
  bdoStatus: 'Aktywny' | 'Weryfikacja' | 'Wygasły';
}

export interface SimulatedDecisionMaker {
  id: string;
  name: string;
  role: string;
  companyName: string;
  relevance: number;
  email: string;
  phone: string;
  linkedInUrl: string;
}

export interface SimulatedSentOffer {
  id: string;
  companyName: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  sentDate: string;
  pitchContent: string;
  status: 'Dostarczono' | 'Otwarto' | 'Odpowiedź!' | 'Kliknięto link';
}

export const SIMULATED_FOUND_COMPANIES: SimulatedCompany[] = [
  {
    id: "sim-1",
    companyName: "Ekolog Sp. z o.o. Oddział Gliwice",
    nip: "6312498102",
    bdoNumber: "000012489",
    city: "Gliwice",
    province: "Śląskie",
    industry: "Sortowanie i transport odpadów budowlanych",
    sourceType: "BDO",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-2",
    companyName: "KrakMet Recykling & Złom",
    nip: "6762490142",
    bdoNumber: "000008412",
    city: "Kraków",
    province: "Małopolskie",
    industry: "Recykling metali kolorowych i złomu stalowego",
    sourceType: "Google Maps",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-3",
    companyName: "Złom-Pol Sp. j. Tarnowskie Góry",
    nip: "6451294109",
    bdoNumber: "000094182",
    city: "Tarnowskie Góry",
    province: "Śląskie",
    industry: "Przerób i kasacja konstrukcji stalowych",
    sourceType: "Panorama",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-4",
    companyName: "Eisen- und Schrottverwertung GmbH",
    nip: "DE-815291410",
    bdoNumber: "LAGA-DE335",
    city: "Dresden",
    province: "Sachsen (Niemcy)",
    industry: "Kauf und Transport von Industrieschrott",
    sourceType: "Eksport",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-5",
    companyName: "Dansk Metalsortering A/S",
    nip: "DK-45819401",
    bdoNumber: "DK-AFF-229",
    city: "Aarhus",
    province: "Midtjylland (Dania)",
    industry: "Industrial scrap metal handling",
    sourceType: "Eksport",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-6",
    companyName: "Trans-Wróbel Sp. z o.o.",
    nip: "6292318491",
    bdoNumber: "000021489",
    city: "Sosnowiec",
    province: "Śląskie",
    industry: "Wyburzenia i kontenery na gruz",
    sourceType: "Google Maps",
    bdoStatus: "Weryfikacja"
  },
  {
    id: "sim-7",
    companyName: "Eko-Hut Metale Sp. z o.o.",
    nip: "5221049283",
    bdoNumber: "000045102",
    city: "Katowice",
    province: "Śląskie",
    industry: "Odpady przemysłowe i hutnicze",
    sourceType: "BDO",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-8",
    companyName: "Recykling Katowice sp. k.",
    nip: "9542718402",
    bdoNumber: "000081042",
    city: "Katowice",
    province: "Śląskie",
    industry: "Zbiórka zużytego sprzętu elektrycznego",
    sourceType: "BDO",
    bdoStatus: "Weryfikacja"
  },
  {
    id: "sim-9",
    companyName: "Remondis Hamburg GmbH",
    nip: "DE-312894102",
    bdoNumber: "LAGA-HH941",
    city: "Hamburg",
    province: "Hamburg (Niemcy)",
    industry: "Kommunale und industrielle Abfallwirtschaft",
    sourceType: "Eksport",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-10",
    companyName: "Miljø & Skrotsortering København",
    nip: "DK-90214801",
    bdoNumber: "DK-AFF-102",
    city: "København",
    province: "Hovedstaden (Dania)",
    industry: "Transport and sortering of commercial waste",
    sourceType: "Eksport",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-11",
    companyName: "Tarnomet Sp. z o.o.",
    nip: "8271039841",
    bdoNumber: "000034102",
    city: "Tarnów",
    province: "Małopolskie",
    industry: "Kasacja pojazdów, kontenery hakowe",
    sourceType: "Panorama",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-12",
    companyName: "Saneco Usługi Komunalne",
    nip: "6341295841",
    bdoNumber: "000019482",
    city: "Chorzów",
    province: "Śląskie",
    industry: "Wywóz gruzu i odpadów budowlanych",
    sourceType: "Google Maps",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-13",
    companyName: "Rudy-Schrott und Metall GmbH",
    nip: "DE-492109481",
    bdoNumber: "LAGA-SN041",
    city: "Görlitz",
    province: "Sachsen (Niemcy)",
    industry: "Altmetallhandel und Containerdienst",
    sourceType: "Eksport",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-14",
    companyName: "Pragomet s.r.o.",
    nip: "CZ-58194012",
    bdoNumber: "CZ-ISOH-918",
    city: "Praha",
    province: "Praha (Czechy)",
    industry: "Sběr druhotných surovin a kovových odpadů",
    sourceType: "Eksport",
    bdoStatus: "Aktywny"
  },
  {
    id: "sim-15",
    companyName: "Ekomat Recykling Plastików",
    nip: "6262940129",
    bdoNumber: "000028914",
    city: "Bytom",
    province: "Śląskie",
    industry: "Recykling tworzyw sztucznych i PET",
    sourceType: "BDO",
    bdoStatus: "Aktywny"
  }
];

export const SIMULATED_DECISION_MAKERS: SimulatedDecisionMaker[] = [
  {
    id: "dm-1",
    name: "Janusz Kowalczyk",
    role: "Kierownik ds. Logistyki i Zakupów",
    companyName: "Ekolog Sp. z o.o. Oddział Gliwice",
    relevance: 10,
    email: "j.kowalczyk@ekolog-gliwice.pl",
    phone: "+48 32 345 10 90",
    linkedInUrl: "https://linkedin.com/in/janusz-kowalczyk-logistics-pl"
  },
  {
    id: "dm-2",
    name: "Marek Krakowski",
    role: "Właściciel / Dyrektor Zakupowości",
    companyName: "KrakMet Recykling & Złom",
    relevance: 9,
    email: "m.krakowski@krakmet-recykling.pl",
    phone: "+48 12 554 22 10",
    linkedInUrl: "https://linkedin.com/in/marek-krakowski-recykling"
  },
  {
    id: "dm-3",
    name: "Zbigniew Polak",
    role: "Dyrektor Operacyjny ds. Floty",
    companyName: "Złom-Pol Sp. j. Tarnowskie Góry",
    relevance: 9,
    email: "fleet@zlom-pol-tg.pl",
    phone: "+48 32 285 40 50",
    linkedInUrl: "https://linkedin.com/in/zbigniew-polak-fleet-manager"
  },
  {
    id: "dm-4",
    name: "Dieter Schmidt",
    role: "Einkaufsleiter / Head of Procurement",
    companyName: "Eisen- und Schrottverwertung GmbH",
    relevance: 10,
    email: "d.schmidt@isv-dresden.de",
    phone: "+49 351 445209",
    linkedInUrl: "https://linkedin.com/in/dieter-schmidt-procurement-de"
  },
  {
    id: "dm-5",
    name: "Lars Mikkelsen",
    role: "Logistical Operations Supervisor",
    companyName: "Dansk Metalsortering A/S",
    relevance: 8,
    email: "l.mikkelsen@danskmetal.dk",
    phone: "+45 86 12 90 44",
    linkedInUrl: "https://linkedin.com/in/lars-mikkelsen-operations"
  },
  {
    id: "dm-6",
    name: "Andrzej Wróbel",
    role: "Prezes Zarządu / Decydent Zakupowy",
    companyName: "Trans-Wróbel Sp. z o.o.",
    relevance: 10,
    email: "a.wrobel@trans-wrobel.com.pl",
    phone: "+48 32 263 11 20",
    linkedInUrl: "https://linkedin.com/in/andrzej-wrobel-prezes"
  },
  {
    id: "dm-7",
    name: "Helena Eko-Hut",
    role: "Główny Logistyk ds. Kontenerów",
    companyName: "Eko-Hut Metale Sp. z o.o.",
    relevance: 9,
    email: "h.matuszek@ekohut.pl",
    phone: "+48 32 721 40 30",
    linkedInUrl: "https://linkedin.com/in/helena-matuszek-ekohut"
  },
  {
    id: "dm-8",
    name: "Hans-Jürgen Weber",
    role: "Technischer Einkaufsdirektor",
    companyName: "Remondis Hamburg GmbH",
    relevance: 10,
    email: "juergen.weber@remondis.de",
    phone: "+49 40 5142099",
    linkedInUrl: "https://linkedin.com/in/hans-juergen-weber-remondis"
  },
  {
    id: "dm-9",
    name: "Karl Lindegard",
    role: "Logistical Procurement Director",
    companyName: "Miljø & Skrotsortering København",
    relevance: 9,
    email: "k.lind@miljoskrot.dk",
    phone: "+45 35 44 22 11",
    linkedInUrl: "https://linkedin.com/in/karl-lindegard-procurement"
  },
  {
    id: "dm-10",
    name: "Janusz Tarnowski",
    role: "Właściciel / Kierownik Floty",
    companyName: "Tarnomet Sp. z o.o.",
    relevance: 10,
    email: "j.tarnowski@tarnomet.pl",
    phone: "+48 14 621 11 00",
    linkedInUrl: "https://linkedin.com/in/janusz-tarnowski-tarnomet"
  }
];

export const SIMULATED_SENT_OFFERS: SimulatedSentOffer[] = [
  {
    id: "off-1",
    companyName: "FCC Śląsk Sp. z o.o.",
    recipientName: "Wojciech Byś",
    recipientEmail: "w.bys@fcc-group.pl",
    subject: "KPO & BDO Automatyzacja oraz Wycena Kontenerów DIN 30722 - Mila LeadSniper",
    sentDate: "2026-05-20 14:15",
    status: "Odpowiedź!",
    pitchContent: `Dzień dobry Panie Wojciechu,

Nasz system zidentyfikował, że FCC Śląsk Sp. z o.o. (BDO: 000003482) aktywnie poszukuje rozbudowy floty kontenerowej i wdraża standardy ewidencji wwozu i wywozu odpadów hutniczych/metalowych.

Jako certyfikowany dostawca stalowej infrastruktury logistycznej proponujemy:
1. Dostawę solidnych kontenerów bramowych (muldy asymetryczne) zgodnych z DIN 30720 o wzmocnionym dnie ze stali S355.
2. Dostawę kontenerów hakowych o pojemności od 15m3 do 36m3 wykonanych ściśle pod normę DIN 30722-1 (wieniec hakowy o podwyższonej sprężystości).
3. Bezpośrednią kompatybilność wymiarową oraz zabezpieczenie antykorozyjne lakierami klasy C4.

Czy znajdzie Pan w najbliższy czwartek o godzinie 11:00 czas na krótkie, 10-minutowe połączenie telefoniczne, aby omówić nasze fabryczne moce produkcyjne z dostawą bezpośrednio do Chorzowa?

Z poważaniem,
Dział Logistyki i Wycen Eksportowych
Mila LeadSniper Autopilot`
  },
  {
    id: "off-2",
    companyName: "REMONDIS Sp. z o.o.",
    recipientName: "Anna Kowalska",
    recipientEmail: "anna.kowalska@remondis.pl",
    subject: "Zautomatyzowane raportowanie sprawozdań BDO i certyfikacja KPO dla REMONDIS",
    sentDate: "2026-05-21 09:30",
    status: "Odpowiedź!",
    pitchContent: `Szanowna Pani Dyrektor,

W odpowiedzi na Pani priorytet operacyjny na Q3 2026 dotyczący optymalizacji czasu rozliczania kart przekazania odpadów (KPO) przy pełnej zgodności z normami RODO, przygotowaliśmy dedykowaną architekturę integracji API The Vault.

Nasza aplikacja automatyzuje:
- Monitorowanie statusów ewidencyjnych BDO w tle.
- Bezbłędne generowanie masowych kart przekazania odpadów na bazie systemów logistycznych.
- Szyfrowaną bramkę RODO z automatyczną retencją danych osobowych transportu.

Chętnie zaprezentuję demo systemu w formie krótkiej prezentacji wideo (Teams lub Zoom). Proponuję termin w przyszły wtorek o 10:00 lub środę o 12:00.

Z poważaniem,
Inżynier Rozwiązań Systemowych, Mila AI`
  },
  {
    id: "off-3",
    companyName: "Stena Recycling Sp. z o.o.",
    recipientName: "Marek Grabowski",
    recipientEmail: "marek.grabowski@stenarecycling.pl",
    subject: "Oferta: Kontenery Hakowe 36m3 DIN 30722 ze stali S355 dla Stena Recycling",
    sentDate: "2026-05-22 11:00",
    status: "Otwarto",
    pitchContent: `Dzień dobry Panie Marku,

Biorąc pod uwagę Pana wieloletnie doświadczenie w zakupach i logistyce elektro-odpadów i surowców w Stena Recycling, chcemy wyjść z bezpośrednią propozycją redukcji kosztów zakupu floty kontenerowej.

Zmechanizowana linia produkcyjna w Polsce pozwala nam dostarczyć kontenery hakowe 36m3 (DIN 30722-1) o 15-18% korzystniej cenowo niż zachodnie odpowiedniki, przy zachowaniu najwyższych standardów konstrukcyjnych:
- Grubość blachy: boki 4 mm, dno 5 mm ze stali S355 o podwyższonej odporności na deformację.
- Ślizgi o profilu wzmocnionym.
- Zgodność z pełnymi wymogami bezpiecznego frachtu kolejowego.

Czy dopuszcza Pan możliwość przetargowej wyceny dostaw testowych na najbliższe zamówienie? Chętnie przygotujemy specyfikację techniczną.

Z poważaniem,
Mila LeadSniper Procurement Agent`
  },
  {
    id: "off-4",
    companyName: "PreZero Recycling Sp. z o.o.",
    recipientName: "Jan Nowak",
    recipientEmail: "j.nowak@prezero.pl",
    subject: "Dedykowana oferta dostawy muld bramowych DIN 30720 i City Container dla PreZero",
    sentDate: "2026-05-22 13:40",
    status: "Dostarczono",
    pitchContent: `Szanowny Panie Członku Zarządu,

Zwracamy się z zapytaniem ofertowym odnośnie planowanych zakupów infrastruktury pod obsługę sieci PSZOK na terenie Wielkopolski.

Oferujemy bezpośrednie dostawy:
- City Container DIN 30735 (muldy o zmniejszonym gabarycie, idealne pod lżejsze samochody hakowe).
- Muldy symetryczne pokrywane farbami o podwyższonej chemoodporności (odporność na trudne frakcje odpadów komunalnych).

Jako certyfikowany producent oferujemy stałe harmonogramy dostaw i gwarancję darmowego audytu BDO w pierwszym roku współpracy. Zapraszam do rozmowy telefonicznej.

Łączę wyrazy szacunku,
Dyrektor ds. Sprzedaży Klienta Kluczowego`
  },
  {
    id: "off-5",
    companyName: "SUEZ Polska Sp. z o.o.",
    recipientName: "Piotr Wiśniewski",
    recipientEmail: "piotr.wisniewski@suez.pl",
    subject: "Redukcja śladu węglowego floty kontenerowej SUEZ - Rozwiązania Lekkich Konstrukcji DIN",
    sentDate: "2026-05-23 15:20",
    status: "Kliknięto link",
    pitchContent: `Dzień dobry Panie Piotrze,

Nasz system przeanalizował strukturę floty transportowej SUEZ na Śląsku. Wiemy, że kładą Państwo ogromny nacisk na minimalizacje śladu węglowego i optymalizację masy własnej zestawów.

Wprowadziliśmy nową linię "Lightweight Tough" dla kontenerów hakowych DIN 30722. Wykorzystanie szwedzkiej stali o wysokiej wytrzymałości pozwoliło nam obniżyć wagę kontenera o ponad 450 kg bez utraty żywotności struktury spawu. Przekłada się to na oszczędność do 1.2 l paliwa na 100 km przy pełnych transportach.

Dostęp do pełnej karty technofizycznej i certyfikacji umieszczam w załączniku. Chętnie umówię krótką prezentację telefoniczną.

Pozdrawiam serdecznie,
Inżynier Handlowy, Mila LeadSniper`
  },
  {
    id: "off-6",
    companyName: "Ekolog Sp. z o.o. Oddział Gliwice",
    recipientName: "Janusz Kowalczyk",
    recipientEmail: "j.kowalczyk@ekolog-gliwice.pl",
    subject: "Optymalizacja budżetu na kontenery gruzowe i budowlane w Gliwicach",
    sentDate: "2026-05-23 16:45",
    status: "Dostarczono",
    pitchContent: `Szanowny Panie Januszu,

Kontaktuję się w nawiązaniu do obsługiwanych przez Waszą firmę zleceń budowlanych na obszarze aglomeracji śląskiej. Wiemy, że koszty eksploatacji kontenerów na gruz są znaczącą pozycją w budżecie logistycznym.

Przygotowaliśmy ofertę specjalną na kontenery asymetryczne 7m3 DIN 30720 z uchylną klapą, przeznaczone specjalnie do ciężkiego gruzu cementowego. Nasz wariant Heavy-Duty cechuje się dodatkowymi ożebrowaniami podłużnymi.

Czy moglibyśmy wysłać państwu próbną specyfikację i cennik hurtowy?

Z wyrazami szacunku,
Dział Handlowy, Mila LeadSniper`
  },
  {
    id: "off-7",
    companyName: "Eisen- und Schrottverwertung GmbH",
    recipientName: "Dieter Schmidt",
    recipientEmail: "d.schmidt@isv-dresden.de",
    subject: "Haltbare Abrollcontainer DIN 30722 von polnischem Hersteller - Kostensenkung",
    sentDate: "2026-05-24 10:10",
    status: "Otwarto",
    pitchContent: `Sehr geehrter Herr Schmidt,

als führender polnischer Hersteller von zertifizierten Behältern bieten wir Ihnen eine strategische Kooperation zur Optimierung Ihrer Beschaffungskosten für Abrollcontainer nach DIN 30722-1 und Absetzkippermulden nach DIN 30720.

Durch den Einkauf direkt ab Werk in Polen können Sie Ihre Investitionsausgaben um bis zu 22% senken – bei uneingeschränkter Konformität mit deutschen Sicherheitsbestimmungen und Qualitätsprüfungen (Stahlqualität S355, 100% robuster Schweißnaht-Ultraschalltest).

Dürfen wir Ihnen ein unverbindliches Preisangebot für Ihren aktuellen Bedarf zukommen lassen? Über eine kurze Rückmeldung würden wir uns sehr freuen.

Mit freundlichen Grüßen,
Vertriebsleitung, Mila LeadSniper Metallbau`
  },
  {
    id: "off-8",
    companyName: "Dansk Metalsortering A/S",
    recipientName: "Lars Mikkelsen",
    recipientEmail: "l.mikkelsen@danskmetal.dk",
    subject: "High-Strength Steel Hook Containers (DIN 30722) - Direct Factory Supply Denmark",
    sentDate: "2026-05-24 11:30",
    status: "Dostarczono",
    pitchContent: `Dear Mr. Mikkelsen,

We have identified that Dansk Metalsortering A/S requires high-durability container equipment for heavy scrap transport in Aarhus. 

We offer direct factory pricing on custom hook containers designed exactly to DIN 30722 standards, utilizing S355 structure steel with double-welded joints to withstand severe impact from falling steel scrap. 

We provide quick logistics directly to your terminal. Would it be possible to arrange a brief call to compare our prices with your current suppliers?

Best regards,
Procurement Desk, Mila LeadSniper Export`
  },
  {
    id: "off-9",
    companyName: "KrakMet Recykling & Złom",
    recipientName: "Marek Krakowski",
    recipientEmail: "m.krakowski@krakmet-recykling.pl",
    subject: "Zapytanie ofertowe: Dostawy ram kontenerowych i muld hutniczych do Krakowa",
    sentDate: "2026-05-24 14:22",
    status: "Dostarczono",
    pitchContent: `Dzień dobry Panie Marku,

Reprezentuję dział handlowy polskiego producenta kontenerów stalowych. Przygotowaliśmy cennik fabryczny produktów skierowany bezpośrednio do przedsiębiorstw zajmujących się skupem złomu stalowego i metali nieżelaznych w Małopolsce.

Oferujemy muldy symetryczne otwarte typu DIN 30720 oraz duże kontenery hakowe ze ścianami skośnymi, które ułatwiają szybki wysyp zakleszczonego złomu miedzianego i wiórów stalowych.

Czy byłby Pan zainteresowany otrzymaniem bezpłatnego kosztorysu dla 5 lub 10 sztuk kontenerów przykładowych?

Z poważaniem,
Inżynier Sprzedaży Krajowej`
  },
  {
    id: "off-10",
    companyName: "Złom-Pol Sp. j. Tarnowskie Góry",
    recipientName: "Zbigniew Polak",
    recipientEmail: "fleet@zlom-pol-tg.pl",
    subject: "Wzmocnione kontenery hakowe o pojemności do 36m3 pod rygorystyczną eksploatację",
    sentDate: "2026-05-25 08:30",
    status: "Otwarto",
    pitchContent: `Dzień dobry Panie Zbigniewie,

Wiedząc, że pełni Pan rolę Dyrektora ds. Floty w firmie Złom-Pol i odpowiada za sprawność taboru kontenerowego w Tarnowskich Górach, pragnę złożyć ofertę na wykonanie kontenerów hakowych typu Heavy-Duty.

Rozumiemy, że transport ciężkich zrębków, konstrukcji i złomu powoduje gwałtowne naprężenia podłogi. Nasze kontenery wyposażamy standardowo w gęstsze ożebrowanie denne (co 250 mm zamiast standardowych 375 mm) oraz grubsze pasy jezdne. Zapobiega to tzw. "falowaniu dna".

Czy możemy przesłać Państwu nasz rysunek techniczny i kalkulację kosztów produkcji?

Z wyrazami szacunku,
Główny Projektant Konstrukcji Stalowych`
  }
];
