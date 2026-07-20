export interface Province {
  id: string;
  name: string;
  code: string;
}

export interface Municipality {
  id: string;
  provinceId: string;
  name: string;
  code: string;
}

export interface MunicipalDistrict {
  id: string;
  municipalityId: string;
  name: string;
}

export interface Sector {
  id: string;
  municipalityId: string;
  municipalDistrictId?: string;
  name: string;
  isCustom?: boolean;
}

// 1. Provinces
export const PROVINCES: Province[] = [
  { id: 'PROV_01', name: 'Distrito Nacional', code: 'DN' },
  { id: 'PROV_02', name: 'Santo Domingo', code: 'SD' },
  { id: 'PROV_03', name: 'Santiago', code: 'STG' },
  { id: 'PROV_04', name: 'La Romana', code: 'LR' }
];

// 2. Municipalities
export const MUNICIPALITIES: Municipality[] = [
  { id: 'MUN_DN_01', provinceId: 'PROV_01', name: 'Distrito Nacional', code: 'DN_MUN' },
  
  { id: 'MUN_SD_01', provinceId: 'PROV_02', name: 'Santo Domingo Este', code: 'SDE' },
  { id: 'MUN_SD_02', provinceId: 'PROV_02', name: 'Santo Domingo Oeste', code: 'SDO' },
  { id: 'MUN_SD_03', provinceId: 'PROV_02', name: 'Santo Domingo Norte', code: 'SDN' },

  { id: 'MUN_STG_01', provinceId: 'PROV_03', name: 'Santiago de los Caballeros', code: 'STG_MUN' },
  { id: 'MUN_LR_01', provinceId: 'PROV_04', name: 'La Romana', code: 'LR_MUN' }
];

// 3. Municipal Districts (Opcional)
export const MUNICIPAL_DISTRICTS: MunicipalDistrict[] = [
  { id: 'DM_SDN_01', municipalityId: 'MUN_SD_03', name: 'La Victoria' }
];

// 4. Sectors (Filtrados por municipio para alto rendimiento)
export const SECTORS: Sector[] = [
  // Distrito Nacional
  { id: 'SEC_DN_01', municipalityId: 'MUN_DN_01', name: 'Naco' },
  { id: 'SEC_DN_02', municipalityId: 'MUN_DN_01', name: 'Bella Vista' },
  { id: 'SEC_DN_03', municipalityId: 'MUN_DN_01', name: 'Piantini' },
  { id: 'SEC_DN_04', municipalityId: 'MUN_DN_01', name: 'Zona Colonial' },
  { id: 'SEC_DN_05', municipalityId: 'MUN_DN_01', name: 'Evaristo Morales' },
  { id: 'SEC_DN_06', municipalityId: 'MUN_DN_01', name: 'Gascue' },

  // Santo Domingo Este
  { id: 'SEC_SDE_01', municipalityId: 'MUN_SD_01', name: 'Alma Rosa I' },
  { id: 'SEC_SDE_02', municipalityId: 'MUN_SD_01', name: 'Los Mina' },
  { id: 'SEC_SDE_03', municipalityId: 'MUN_SD_01', name: 'Ensanche Ozama' },
  { id: 'SEC_SDE_04', municipalityId: 'MUN_SD_01', name: 'El Almirante' },

  // Santo Domingo Oeste
  { id: 'SEC_SDO_01', municipalityId: 'MUN_SD_02', name: 'Herrera' },
  { id: 'SEC_SDO_02', municipalityId: 'MUN_SD_02', name: 'Las Caobas' },

  // Santo Domingo Norte
  { id: 'SEC_SDN_01', municipalityId: 'MUN_SD_03', name: 'Villa Mella' },
  { id: 'SEC_SDN_02', municipalityId: 'MUN_SD_03', name: 'Sabaneta', municipalDistrictId: 'DM_SDN_01' },

  // Santiago
  { id: 'SEC_STG_01', municipalityId: 'MUN_STG_01', name: 'Villa Olga' },
  { id: 'SEC_STG_02', municipalityId: 'MUN_STG_01', name: 'Los Jardines Metropolitanos' },

  // La Romana
  { id: 'SEC_LR_01', municipalityId: 'MUN_LR_01', name: 'Vista Hermosa' }
];

// Alias mapping for normalisation
const ALIAS_MAP: Record<string, string> = {
  'stgo': 'Santiago de los Caballeros',
  'santiago': 'Santiago de los Caballeros',
  'sto dgo': 'Santo Domingo',
  'sto dgo este': 'Santo Domingo Este',
  'sde': 'Santo Domingo Este',
  'sto dgo oeste': 'Santo Domingo Oeste',
  'sdo': 'Santo Domingo Oeste',
  'sto dgo norte': 'Santo Domingo Norte',
  'sdn': 'Santo Domingo Norte',
  'distrito nacional': 'Distrito Nacional',
  'la romana': 'La Romana'
};

// Text normalisation helper
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .trim();
}

// Map geo-response name to official internal catalogue name
export function matchTerritoryName(rawName: string, type: 'province' | 'municipality' | 'sector'): string | null {
  if (!rawName) return null;
  
  const normalizedRaw = normalizeText(rawName);

  // Check alias map first
  if (ALIAS_MAP[normalizedRaw]) {
    return ALIAS_MAP[normalizedRaw];
  }

  if (type === 'province') {
    const match = PROVINCES.find(p => normalizeText(p.name) === normalizedRaw || normalizeText(p.name).includes(normalizedRaw));
    return match ? match.name : null;
  }

  if (type === 'municipality') {
    const match = MUNICIPALITIES.find(m => normalizeText(m.name) === normalizedRaw || normalizeText(m.name).includes(normalizedRaw));
    return match ? match.name : null;
  }

  if (type === 'sector') {
    const match = SECTORS.find(s => normalizeText(s.name) === normalizedRaw || normalizeText(s.name).includes(normalizedRaw));
    return match ? match.name : null;
  }

  return null;
}
