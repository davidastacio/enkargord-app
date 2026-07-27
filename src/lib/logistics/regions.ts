export type LogisticsRegion = "Metropolitana" | "Cibao" | "Norte" | "Sur" | "Este" | "Oeste";

const normalized = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const REGION_PROVINCES: Record<LogisticsRegion, string[]> = {
  Metropolitana: ["distrito nacional", "santo domingo"],
  Cibao: ["santiago", "la vega", "espaillat", "hermanas mirabal", "duarte", "sanchez ramirez", "monsenor nouel"],
  Norte: ["puerto plata", "maria trinidad sanchez", "samana"],
  Sur: ["san cristobal", "peravia", "san jose de ocoa", "azua", "san juan", "barahona", "bahoruco", "independencia", "pedernales", "elias pina"],
  Este: ["san pedro de macoris", "la romana", "la altagracia", "el seibo", "hato mayor", "monte plata"],
  Oeste: ["valverde", "santiago rodriguez", "dajabon", "monte cristi"],
};

export function logisticsRegion(provinceName: string): LogisticsRegion {
  const province = normalized(provinceName);
  for (const [region, provinces] of Object.entries(REGION_PROVINCES)) {
    if (provinces.some((candidate) => province.includes(candidate))) {
      return region as LogisticsRegion;
    }
  }
  return "Metropolitana";
}

export function routeLabel(region: LogisticsRegion, province?: string): string {
  if (province && normalized(province) === "santiago") {
    return "Santiago y zonas aledañas del Cibao";
  }
  return `${region} y zonas aledañas`;
}
