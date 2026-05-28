/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DecisionMaker {
  name: string;
  position: string;
  relevance_score: number; // 1-10
  linkedin_url?: string;
  key_responsibility: string;
}

export interface Lead {
  id: string;
  companyName: string;
  nip: string;
  regon: string;
  bdoNumber: string;
  province: string; // Województwo
  industry: string; // Branża
  sources: ('recycling' | 'language' | 'work')[]; // BDO, WorldWideWeb, LinkedIn
  bdoStatus: 'Aktywny' | 'Weryfikacja' | 'Wygasły';
  decisionMakerName: string;
  decisionMakerRole: string;
  decisionMakerRelevance?: number;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  rawTextSample?: string; // Text for LLM analysis
  analystReport?: AnalystReport | null;
  scannedAt: string;
}

export interface AnalystReport {
  company_name: string;
  decision_makers: DecisionMaker[];
  buying_signals: string[];
  recommended_tone: string;
  pain_points: string[];
  generated_pitch?: string;
}

export interface FunnelState {
  foundLeadsCount: number;
  identifiedDMsCount: number;
  sentOffersCount: number;
  responsesCount: number;
}

export interface SystemHealthState {
  cpuLoad: number;
  memoryAlloc: string;
  activeModel: string;
  currentLog: string;
  inferenceStatus: 'idle' | 'processing' | 'success' | 'failed';
}

export interface ScanTask {
  id: string;
  progress: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentStep: string;
  foundName?: string;
}

export interface CustomMarketSource {
  id: string;
  countryName: string;
  countryCode: string;
  searchDefinition: string;
  suggestedDatabases: string[];
  isActive: boolean;
}

export interface AppSettings {
  productTarget: string; // What we are selling, e.g., "Steel containers DIN 30720, DIN 30722, custom hooks"
  selectedSources: string[]; // e.g. ['bdo', 'gmaps', 'panorama', 'de', 'dk']
  searchQueryRef: string; // e.g., "złom, PSZOK, odpady, wywóz gruzu"
  smtpServer: string;
  autoEnrich: boolean;
  scanDepth: string;
  customMarketSources?: CustomMarketSource[];
}
