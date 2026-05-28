/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead } from "./types";

export const INITIAL_LEADS: Lead[] = [
  {
    id: "fcc-slask",
    companyName: "FCC Śląsk Sp. z o.o.",
    nip: "6340129481",
    regon: "272548102",
    bdoNumber: "000003482",
    province: "Śląskie",
    industry: "Gospodarka Odpadami & Recykling",
    sources: ['recycling', 'language'],
    bdoStatus: 'Aktywny',
    decisionMakerName: "Wojciech Byś",
    decisionMakerRole: "Właściciel / Dyrektor Generalny",
    decisionMakerRelevance: 10,
    email: "w.bys@fcc-group.pl",
    phone: "+48 32 201 40 10",
    address: "ul. Leśna 10, 41-500 Chorzów",
    website: "https://www.fcc-group.pl",
    scannedAt: "2026-05-19 14:10",
    rawTextSample: `Profil Firmy FCC Śląsk Sp. z o.o. na LinkedIn:
Jesteśmy wiodącym dostawcą usług w zakresie zintegrowanej gospodarki odpadami komunalnymi i przemysłowymi na Śląsku. 
Wojciech Byś, jako założyciel i Właściciel, od 15 lat koordynuje kluczowe inwestycje ekologiczne oraz decyduje o doborze podwykonawców logistycznych.
Firma poszukuje aktualnie rozszerzenia floty kontenerowej oraz nowoczesnych systemów RFID do ewidencji wwozu i wywozu do baz przeładunkowych. Posiadamy certyfikaty ISO 14001.`
  },
  {
    id: "remondis",
    companyName: "REMONDIS Sp. z o.o.",
    nip: "5220003412",
    regon: "010294109",
    bdoNumber: "000001092",
    province: "Mazowieckie",
    industry: "Recykling & Usługi Komunalne",
    sources: ['recycling', 'work'],
    bdoStatus: 'Aktywny',
    decisionMakerName: "Anna Kowalska",
    decisionMakerRole: "Dyrektor Operacyjny ds. Logistyki Odzysku",
    decisionMakerRelevance: 9,
    email: "anna.kowalska@remondis.pl",
    phone: "+48 22 571 11 00",
    address: "ul. Zawodzie 18, 02-981 Warszawa",
    website: "https://www.remondis-polska.pl",
    scannedAt: "2026-05-20 08:34",
    rawTextSample: `Zespół REMONDIS Polska - Kontakt Operacyjny:
Dyrektor ds. Logistyki Odzysku, Anna Kowalska, zarządza procesami operacyjnymi i systemem BDO. 
"Priorytetem operacyjnym na Q3 2026 jest zoptymalizowanie czasu rozliczania kart przekazania odpadu (KPO) oraz dążenie do pełnej zgodności z RODO przy wysyłce sprawozdań". Dyrekcja szuka dostawców automatyzacji BDO.`
  },
  {
    id: "alba",
    companyName: "ALBA Polska Sp. z o.o.",
    nip: "6262481029",
    regon: "277981024",
    bdoNumber: "000008471",
    province: "Dolnośląskie",
    industry: "Eko-Logistyka",
    sources: ['recycling'],
    bdoStatus: 'Weryfikacja',
    decisionMakerName: "Brak danych",
    decisionMakerRole: "Do zidentyfikowania w module Recon",
    email: "office@alba.com.pl",
    phone: "+48 71 334 15 00",
    address: "ul. Starogroblowa 4, 50-244 Wrocław",
    website: "https://www.alba.com.pl",
    scannedAt: "2026-05-20 09:12",
    rawTextSample: `O nas - ALBA Polska:
Działamy na terenie południowej Polski świadcząc usługi sortowania i odzysku makulatury oraz tworzyw sztucznych.
Zarząd reprezentowany jest jednoosobowo, jednakże szczegółowe dane personelu zakupowego nie zostały opublikowane na głównej witrynie ze względów prywatności.`
  },
  {
    id: "prezero",
    companyName: "PreZero Recycling Sp. z o.o.",
    nip: "5272391024",
    regon: "015291482",
    bdoNumber: "000011402",
    province: "Wielkopolskie",
    industry: "Odzysk Surowców i Termiczne Przetwarzanie",
    sources: ['recycling', 'language'],
    bdoStatus: 'Wygasły',
    decisionMakerName: "Jan Nowak",
    decisionMakerRole: "Członek Zarządu ds. Zakupów Raw Materials",
    decisionMakerRelevance: 8,
    email: "j.nowak@prezero.pl",
    phone: "+48 61 820 30 40",
    address: "ul. Przemysłowa 5, 60-100 Poznań",
    website: "https://prezero.pl",
    scannedAt: "2026-05-18 11:05",
    rawTextSample: `Aktualności PreZero:
Jan Nowak dołączył do zarządu PreZero Recycling i nadzoruje pozyskiwanie partnerów do odbioru frakcji RDF i pre-sortu. Posiadamy rozbudowaną siatkę punktów selektywnej zbiórki odpadów (PSZOK) w Wielkopolsce.`
  },
  {
    id: "stena",
    companyName: "Stena Recycling Sp. z o.o.",
    nip: "5213291485",
    regon: "015112480",
    bdoNumber: "000450124",
    province: "Mazowieckie",
    industry: "Surowce Wtórne & Elektronika",
    sources: ['recycling', 'language', 'work'],
    bdoStatus: 'Aktywny',
    decisionMakerName: "Marek Grabowski",
    decisionMakerRole: "Purchasing Manager (Kierownik ds. Zakupów i Surowców)",
    decisionMakerRelevance: 9,
    email: "marek.grabowski@stenarecycling.pl",
    phone: "+48 22 645 20 00",
    address: "ul. Okólna 10, 05-270 Marki",
    website: "https://www.stenarecycling.pl",
    scannedAt: "2026-05-20 06:15",
    rawTextSample: `Marek Grabowski - LinkedIn Profile Summary:
Zakupowiec z 10-letnim stażem w branży metalurgicznej i elektro-odpadów. Obecnie zarządza portfelem dostawców surowców wtórnych w Stena Recycling Polska.
Interesują mnie innowacyjne systemy monitorowania logistyki, optymalizacja kosztów frachtu kolejowego oraz pełne zabezpieczenie przed lukami prawnymi RODO.`
  },
  {
    id: "suez",
    companyName: "SUEZ Polska Sp. z o.o.",
    nip: "5251509142",
    regon: "011294812",
    bdoNumber: "000002148",
    province: "Śląskie",
    industry: "Logistyka Komunalna i Przemysłowa",
    sources: ['recycling', 'work'],
    bdoStatus: 'Aktywny',
    decisionMakerName: "Piotr Wiśniewski",
    decisionMakerRole: "Logistics Manager / Dyrektor Transportu",
    decisionMakerRelevance: 9,
    email: "piotr.wisniewski@suez.pl",
    phone: "+48 32 400 50 60",
    address: "ul. Rozwojowa 14, 40-001 Katowice",
    website: "https://www.suez.pl",
    scannedAt: "2026-05-19 16:50",
    rawTextSample: `SUEZ Polska - Struktura Organizacyjna Transportu:
Piotr Wiśniewski kieruje pionem logistyki komunalnej na południu Polski. 
Zajmuje się negocjowaniem stawek przewozowych, zarządzaniem bazą transportową i integracją systemów IT ze sprawozdawczością BDO. Dążymy do minimalizacji śladu węglowego.`
  }
];
