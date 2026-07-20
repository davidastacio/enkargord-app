export interface Province {
  id: string;
  name: string;
}

export interface Municipality {
  id: string;
  provinceId: string;
  name: string;
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

// 32 Provinces (31 provinces + 1 Distrito Nacional)
export const PROVINCES: Province[] = [
  { id: 'PROV_DN', name: 'Distrito Nacional' },
  { id: 'PROV_AZ', name: 'Azua' },
  { id: 'PROV_BA', name: 'Baoruco' },
  { id: 'PROV_BH', name: 'Barahona' },
  { id: 'PROV_DA', name: 'Dajabón' },
  { id: 'PROV_DU', name: 'Duarte' },
  { id: 'PROV_SE', name: 'El Seibo' },
  { id: 'PROV_EP', name: 'Elías Piña' },
  { id: 'PROV_ES', name: 'Espaillat' },
  { id: 'PROV_HM', name: 'Hato Mayor' },
  { id: 'PROV_HMIR', name: 'Hermanas Mirabal' },
  { id: 'PROV_IN', name: 'Independencia' },
  { id: 'PROV_LA', name: 'La Altagracia' },
  { id: 'PROV_LR', name: 'La Romana' },
  { id: 'PROV_LV', name: 'La Vega' },
  { id: 'PROV_MTS', name: 'María Trinidad Sánchez' },
  { id: 'PROV_MN', name: 'Monseñor Nouel' },
  { id: 'PROV_MC', name: 'Montecristi' },
  { id: 'PROV_MP', name: 'Monte Plata' },
  { id: 'PROV_PE', name: 'Pedernales' },
  { id: 'PROV_PR', name: 'Peravia' },
  { id: 'PROV_PP', name: 'Puerto Plata' },
  { id: 'PROV_SA', name: 'Samaná' },
  { id: 'PROV_SC', name: 'San Cristóbal' },
  { id: 'PROV_SJO', name: 'San José de Ocoa' },
  { id: 'PROV_SJ', name: 'San Juan' },
  { id: 'PROV_SPM', name: 'San Pedro de Macorís' },
  { id: 'PROV_SR', name: 'Sánchez Ramírez' },
  { id: 'PROV_STG', name: 'Santiago' },
  { id: 'PROV_SRod', name: 'Santiago Rodríguez' },
  { id: 'PROV_SD', name: 'Santo Domingo' },
  { id: 'PROV_VA', name: 'Valverde' }
];

// Municipalities (155)
export const MUNICIPALITIES: Municipality[] = [
  // Distrito Nacional
  { id: 'MUN_DN_01', provinceId: 'PROV_DN', name: 'Distrito Nacional' },

  // Azua
  { id: 'MUN_AZ_01', provinceId: 'PROV_AZ', name: 'Azua de Compostela' },
  { id: 'MUN_AZ_02', provinceId: 'PROV_AZ', name: 'Estebanía' },
  { id: 'MUN_AZ_03', provinceId: 'PROV_AZ', name: 'Guayabal' },
  { id: 'MUN_AZ_04', provinceId: 'PROV_AZ', name: 'Las Charcas' },
  { id: 'MUN_AZ_05', provinceId: 'PROV_AZ', name: 'Las Yayas de Viajama' },
  { id: 'MUN_AZ_06', provinceId: 'PROV_AZ', name: 'Padre Las Casas' },
  { id: 'MUN_AZ_07', provinceId: 'PROV_AZ', name: 'Peralta' },
  { id: 'MUN_AZ_08', provinceId: 'PROV_AZ', name: 'Pueblo Viejo' },
  { id: 'MUN_AZ_09', provinceId: 'PROV_AZ', name: 'Sabana Yegua' },
  { id: 'MUN_AZ_10', provinceId: 'PROV_AZ', name: 'Tábara Arriba' },

  // Baoruco
  { id: 'MUN_BA_01', provinceId: 'PROV_BA', name: 'Neiba' },
  { id: 'MUN_BA_02', provinceId: 'PROV_BA', name: 'Galván' },
  { id: 'MUN_BA_03', provinceId: 'PROV_BA', name: 'Los Ríos' },
  { id: 'MUN_BA_04', provinceId: 'PROV_BA', name: 'Tamayo' },
  { id: 'MUN_BA_05', provinceId: 'PROV_BA', name: 'Villa Jaragua' },

  // Barahona
  { id: 'MUN_BH_01', provinceId: 'PROV_BH', name: 'Barahona' },
  { id: 'MUN_BH_02', provinceId: 'PROV_BH', name: 'Cabral' },
  { id: 'MUN_BH_03', provinceId: 'PROV_BH', name: 'El Peñón' },
  { id: 'MUN_BH_04', provinceId: 'PROV_BH', name: 'Enriquillo' },
  { id: 'MUN_BH_05', provinceId: 'PROV_BH', name: 'Fundación' },
  { id: 'MUN_BH_06', provinceId: 'PROV_BH', name: 'Jaquimeyes' },
  { id: 'MUN_BH_07', provinceId: 'PROV_BH', name: 'La Ciénaga' },
  { id: 'MUN_BH_08', provinceId: 'PROV_BH', name: 'Las Salinas' },
  { id: 'MUN_BH_09', provinceId: 'PROV_BH', name: 'Paraíso' },
  { id: 'MUN_BH_10', provinceId: 'PROV_BH', name: 'Polo' },
  { id: 'MUN_BH_11', provinceId: 'PROV_BH', name: 'Vicente Noble' },

  // Dajabón
  { id: 'MUN_DA_01', provinceId: 'PROV_DA', name: 'Dajabón' },
  { id: 'MUN_DA_02', provinceId: 'PROV_DA', name: 'El Pino' },
  { id: 'MUN_DA_03', provinceId: 'PROV_DA', name: 'Loma de Cabrera' },
  { id: 'MUN_DA_04', provinceId: 'PROV_DA', name: 'Partido' },
  { id: 'MUN_DA_05', provinceId: 'PROV_DA', name: 'Restauración' },

  // Duarte
  { id: 'MUN_DU_01', provinceId: 'PROV_DU', name: 'San Francisco de Macorís' },
  { id: 'MUN_DU_02', provinceId: 'PROV_DU', name: 'Arenoso' },
  { id: 'MUN_DU_03', provinceId: 'PROV_DU', name: 'Castillo' },
  { id: 'MUN_DU_04', provinceId: 'PROV_DU', name: 'Eugenio María de Hostos' },
  { id: 'MUN_DU_05', provinceId: 'PROV_DU', name: 'Las Guáranas' },
  { id: 'MUN_DU_06', provinceId: 'PROV_DU', name: 'Pimentel' },
  { id: 'MUN_DU_07', provinceId: 'PROV_DU', name: 'Villa Riva' },

  // El Seibo
  { id: 'MUN_SE_01', provinceId: 'PROV_SE', name: 'El Seibo' },
  { id: 'MUN_SE_02', provinceId: 'PROV_SE', name: 'Miches' },

  // Elías Piña
  { id: 'MUN_EP_01', provinceId: 'PROV_EP', name: 'Comendador' },
  { id: 'MUN_EP_02', provinceId: 'PROV_EP', name: 'Bánica' },
  { id: 'MUN_EP_03', provinceId: 'PROV_EP', name: 'El Llano' },
  { id: 'MUN_EP_04', provinceId: 'PROV_EP', name: 'Hondo Valle' },
  { id: 'MUN_EP_05', provinceId: 'PROV_EP', name: 'Juan Santiago' },
  { id: 'MUN_EP_06', provinceId: 'PROV_EP', name: 'Pedro Santana' },

  // Espaillat
  { id: 'MUN_ES_01', provinceId: 'PROV_ES', name: 'Moca' },
  { id: 'MUN_ES_02', provinceId: 'PROV_ES', name: 'Cayetano Germosén' },
  { id: 'MUN_ES_03', provinceId: 'PROV_ES', name: 'Gaspar Hernández' },
  { id: 'MUN_ES_04', provinceId: 'PROV_ES', name: 'Jamao al Norte' },

  // Hato Mayor
  { id: 'MUN_HM_01', provinceId: 'PROV_HM', name: 'Hato Mayor del Rey' },
  { id: 'MUN_HM_02', provinceId: 'PROV_HM', name: 'El Valle' },
  { id: 'MUN_HM_03', provinceId: 'PROV_HM', name: 'Sabana de la Mar' },

  // Hermanas Mirabal
  { id: 'MUN_HMIR_01', provinceId: 'PROV_HMIR', name: 'Salcedo' },
  { id: 'MUN_HMIR_02', provinceId: 'PROV_HMIR', name: 'Tenares' },
  { id: 'MUN_HMIR_03', provinceId: 'PROV_HMIR', name: 'Villa Tapia' },

  // Independencia
  { id: 'MUN_IN_01', provinceId: 'PROV_IN', name: 'Jimaní' },
  { id: 'MUN_IN_02', provinceId: 'PROV_IN', name: 'Cristóbal' },
  { id: 'MUN_IN_03', provinceId: 'PROV_IN', name: 'Duvergé' },
  { id: 'MUN_IN_04', provinceId: 'PROV_IN', name: 'La Descubierta' },
  { id: 'MUN_IN_05', provinceId: 'PROV_IN', name: 'Mella' },
  { id: 'MUN_IN_06', provinceId: 'PROV_IN', name: 'Postrer Río' },

  // La Altagracia
  { id: 'MUN_LA_01', provinceId: 'PROV_LA', name: 'Higüey' },
  { id: 'MUN_LA_02', provinceId: 'PROV_LA', name: 'San Rafael del Yuma' },

  // La Romana
  { id: 'MUN_LR_01', provinceId: 'PROV_LR', name: 'La Romana' },
  { id: 'MUN_LR_02', provinceId: 'PROV_LR', name: 'Guaymate' },
  { id: 'MUN_LR_03', provinceId: 'PROV_LR', name: 'Villa Hermosa' },

  // La Vega
  { id: 'MUN_LV_01', provinceId: 'PROV_LV', name: 'La Concepción de La Vega' },
  { id: 'MUN_LV_02', provinceId: 'PROV_LV', name: 'Constanza' },
  { id: 'MUN_LV_03', provinceId: 'PROV_LV', name: 'Jarabacoa' },
  { id: 'MUN_LV_04', provinceId: 'PROV_LV', name: 'Jima Abajo' },

  // María Trinidad Sánchez
  { id: 'MUN_MTS_01', provinceId: 'PROV_MTS', name: 'Nagua' },
  { id: 'MUN_MTS_02', provinceId: 'PROV_MTS', name: 'Cabrera' },
  { id: 'MUN_MTS_03', provinceId: 'PROV_MTS', name: 'El Factor' },
  { id: 'MUN_MTS_04', provinceId: 'PROV_MTS', name: 'Río San Juan' },

  // Monseñor Nouel
  { id: 'MUN_MN_01', provinceId: 'PROV_MN', name: 'Bonao' },
  { id: 'MUN_MN_02', provinceId: 'PROV_MN', name: 'Maimón' },
  { id: 'MUN_MN_03', provinceId: 'PROV_MN', name: 'Piedra Blanca' },

  // Montecristi
  { id: 'MUN_MC_01', provinceId: 'PROV_MC', name: 'Montecristi' },
  { id: 'MUN_MC_02', provinceId: 'PROV_MC', name: 'Castañuelas' },
  { id: 'MUN_MC_03', provinceId: 'PROV_MC', name: 'Guayubín' },
  { id: 'MUN_MC_04', provinceId: 'PROV_MC', name: 'Las Matas de Santa Cruz' },
  { id: 'MUN_MC_05', provinceId: 'PROV_MC', name: 'Pepillo Salcedo' },
  { id: 'MUN_MC_06', provinceId: 'PROV_MC', name: 'Villa Vásquez' },

  // Monte Plata
  { id: 'MUN_MP_01', provinceId: 'PROV_MP', name: 'Monte Plata' },
  { id: 'MUN_MP_02', provinceId: 'PROV_MP', name: 'Bayaguana' },
  { id: 'MUN_MP_03', provinceId: 'PROV_MP', name: 'Peralvillo' },
  { id: 'MUN_MP_04', provinceId: 'PROV_MP', name: 'Sabana Grande de Boyá' },
  { id: 'MUN_MP_05', provinceId: 'PROV_MP', name: 'Yamasá' },

  // Pedernales
  { id: 'MUN_PE_01', provinceId: 'PROV_PE', name: 'Pedernales' },
  { id: 'MUN_PE_02', provinceId: 'PROV_PE', name: 'Oviedo' },

  // Peravia
  { id: 'MUN_PR_01', provinceId: 'PROV_PR', name: 'Baní' },
  { id: 'MUN_PR_02', provinceId: 'PROV_PR', name: 'Nizao' },

  // Puerto Plata
  { id: 'MUN_PP_01', provinceId: 'PROV_PP', name: 'Puerto Plata' },
  { id: 'MUN_PP_02', provinceId: 'PROV_PP', name: 'Altamira' },
  { id: 'MUN_PP_03', provinceId: 'PROV_PP', name: 'Guananico' },
  { id: 'MUN_PP_04', provinceId: 'PROV_PP', name: 'Imbert' },
  { id: 'MUN_PP_05', provinceId: 'PROV_PP', name: 'Los Hidalgos' },
  { id: 'MUN_PP_06', provinceId: 'PROV_PP', name: 'Luperón' },
  { id: 'MUN_PP_07', provinceId: 'PROV_PP', name: 'Sosúa' },
  { id: 'MUN_PP_08', provinceId: 'PROV_PP', name: 'Villa Isabela' },
  { id: 'MUN_PP_09', provinceId: 'PROV_PP', name: 'Villa Montellano' },

  // Samaná
  { id: 'MUN_SA_01', provinceId: 'PROV_SA', name: 'Samaná' },
  { id: 'MUN_SA_02', provinceId: 'PROV_SA', name: 'Las Terrenas' },
  { id: 'MUN_SA_03', provinceId: 'PROV_SA', name: 'Sánchez' },

  // San Cristóbal
  { id: 'MUN_SC_01', provinceId: 'PROV_SC', name: 'San Cristóbal' },
  { id: 'MUN_SC_02', provinceId: 'PROV_SC', name: 'Bajos de Haina' },
  { id: 'MUN_SC_03', provinceId: 'PROV_SC', name: 'Cambita Garabito' },
  { id: 'MUN_SC_04', provinceId: 'PROV_SC', name: 'Los Cacaos' },
  { id: 'MUN_SC_05', provinceId: 'PROV_SC', name: 'Sabana Grande de Palenque' },
  { id: 'MUN_SC_06', provinceId: 'PROV_SC', name: 'San Gregorio de Nigua' },
  { id: 'MUN_SC_07', provinceId: 'PROV_SC', name: 'Villa Altagracia' },
  { id: 'MUN_SC_08', provinceId: 'PROV_SC', name: 'Yaguate' },

  // San José de Ocoa
  { id: 'MUN_SJO_01', provinceId: 'PROV_SJO', name: 'San José de Ocoa' },
  { id: 'MUN_SJO_02', provinceId: 'PROV_SJO', name: 'Rancho Arriba' },
  { id: 'MUN_SJO_03', provinceId: 'PROV_SJO', name: 'Sabana Larga' },

  // San Juan
  { id: 'MUN_SJ_01', provinceId: 'PROV_SJ', name: 'San Juan de la Maguana' },
  { id: 'MUN_SJ_02', provinceId: 'PROV_SJ', name: 'Bohechío' },
  { id: 'MUN_SJ_03', provinceId: 'PROV_SJ', name: 'El Cercado' },
  { id: 'MUN_SJ_04', provinceId: 'PROV_SJ', name: 'Juan de Herrera' },
  { id: 'MUN_SJ_05', provinceId: 'PROV_SJ', name: 'Las Matas de Farfán' },
  { id: 'MUN_SJ_06', provinceId: 'PROV_SJ', name: 'Vallejuelo' },

  // San Pedro de Macorís
  { id: 'MUN_SPM_01', provinceId: 'PROV_SPM', name: 'San Pedro de Macorís' },
  { id: 'MUN_SPM_02', provinceId: 'PROV_SPM', name: 'Consuelo' },
  { id: 'MUN_SPM_03', provinceId: 'PROV_SPM', name: 'Guayacanes' },
  { id: 'MUN_SPM_04', provinceId: 'PROV_SPM', name: 'San José de Los Llanos' },
  { id: 'MUN_SPM_05', provinceId: 'PROV_SPM', name: 'Quisqueya' },
  { id: 'MUN_SPM_06', provinceId: 'PROV_SPM', name: 'Ramón Santana' },

  // Sánchez Ramírez
  { id: 'MUN_SR_01', provinceId: 'PROV_SR', name: 'Cotuí' },
  { id: 'MUN_SR_02', provinceId: 'PROV_SR', name: 'Cevicos' },
  { id: 'MUN_SR_03', provinceId: 'PROV_SR', name: 'Fantino' },
  { id: 'MUN_SR_04', provinceId: 'PROV_SR', name: 'La Mata' },

  // Santiago
  { id: 'MUN_STG_01', provinceId: 'PROV_STG', name: 'Santiago' },
  { id: 'MUN_STG_02', provinceId: 'PROV_STG', name: 'Bisonó' },
  { id: 'MUN_STG_03', provinceId: 'PROV_STG', name: 'Jánico' },
  { id: 'MUN_STG_04', provinceId: 'PROV_STG', name: 'Licey al Medio' },
  { id: 'MUN_STG_05', provinceId: 'PROV_STG', name: 'Puñal' },
  { id: 'MUN_STG_06', provinceId: 'PROV_STG', name: 'Sabana Iglesia' },
  { id: 'MUN_STG_07', provinceId: 'PROV_STG', name: 'San José de las Matas' },
  { id: 'MUN_STG_08', provinceId: 'PROV_STG', name: 'Tamboril' },
  { id: 'MUN_STG_09', provinceId: 'PROV_STG', name: 'Villa González' },

  // Santiago Rodríguez
  { id: 'MUN_SRod_01', provinceId: 'PROV_SRod', name: 'San Ignacio de Sabaneta' },
  { id: 'MUN_SRod_02', provinceId: 'PROV_SRod', name: 'Los Almácigos' },
  { id: 'MUN_SRod_03', provinceId: 'PROV_SRod', name: 'Monción' },

  // Santo Domingo
  { id: 'MUN_SD_01', provinceId: 'PROV_SD', name: 'Santo Domingo Este' },
  { id: 'MUN_SD_02', provinceId: 'PROV_SD', name: 'Boca Chica' },
  { id: 'MUN_SD_03', provinceId: 'PROV_SD', name: 'Los Alcarrizos' },
  { id: 'MUN_SD_04', provinceId: 'PROV_SD', name: 'Pedro Brand' },
  { id: 'MUN_SD_05', provinceId: 'PROV_SD', name: 'San Antonio de Guerra' },
  { id: 'MUN_SD_06', provinceId: 'PROV_SD', name: 'Santo Domingo Norte' },
  { id: 'MUN_SD_07', provinceId: 'PROV_SD', name: 'Santo Domingo Oeste' },

  // Valverde
  { id: 'MUN_VA_01', provinceId: 'PROV_VA', name: 'Mao' },
  { id: 'MUN_VA_02', provinceId: 'PROV_VA', name: 'Esperanza' },
  { id: 'MUN_VA_03', provinceId: 'PROV_VA', name: 'Laguna Salada' }
];

// Municipal Districts (228)
export const MUNICIPAL_DISTRICTS: MunicipalDistrict[] = [
  // Azua
  { id: 'DM_AZ_01', municipalityId: 'MUN_AZ_01', name: 'Barreras' },
  { id: 'DM_AZ_02', municipalityId: 'MUN_AZ_01', name: 'Barro Arriba' },
  { id: 'DM_AZ_03', municipalityId: 'MUN_AZ_01', name: 'Clavellina' },
  { id: 'DM_AZ_04', municipalityId: 'MUN_AZ_01', name: 'Emma Balaguer Viuda Vallejo' },
  { id: 'DM_AZ_05', municipalityId: 'MUN_AZ_01', name: 'Las Barías-La Estancia' },
  { id: 'DM_AZ_06', municipalityId: 'MUN_AZ_01', name: 'Las Lomas' },
  { id: 'DM_AZ_07', municipalityId: 'MUN_AZ_01', name: 'Los Jovillos' },
  { id: 'DM_AZ_08', municipalityId: 'MUN_AZ_01', name: 'Puerto Viejo' },
  { id: 'DM_AZ_09', municipalityId: 'MUN_AZ_04', name: 'Hatillo' },
  { id: 'DM_AZ_10', municipalityId: 'MUN_AZ_04', name: 'Palmar de Ocoa' },
  { id: 'DM_AZ_11', municipalityId: 'MUN_AZ_05', name: 'Villarpando' },
  { id: 'DM_AZ_12', municipalityId: 'MUN_AZ_05', name: 'Hato Nuevo-Cortés' },
  { id: 'DM_AZ_13', municipalityId: 'MUN_AZ_06', name: 'La Siembra' },
  { id: 'DM_AZ_14', municipalityId: 'MUN_AZ_06', name: 'Las Lagunas' },
  { id: 'DM_AZ_15', municipalityId: 'MUN_AZ_06', name: 'Los Fríos' },
  { id: 'DM_AZ_16', municipalityId: 'MUN_AZ_08', name: 'El Rosario' },
  { id: 'DM_AZ_17', municipalityId: 'MUN_AZ_09', name: 'Proyecto 4' },
  { id: 'DM_AZ_18', municipalityId: 'MUN_AZ_09', name: 'Ganadero' },
  { id: 'DM_AZ_19', municipalityId: 'MUN_AZ_09', name: 'Proyecto 2-C' },
  { id: 'DM_AZ_20', municipalityId: 'MUN_AZ_10', name: 'Amiama Gómez' },
  { id: 'DM_AZ_21', municipalityId: 'MUN_AZ_10', name: 'Los Toros' },
  { id: 'DM_AZ_22', municipalityId: 'MUN_AZ_10', name: 'Tábara Abajo' },

  // Baoruco
  { id: 'DM_BA_01', municipalityId: 'MUN_BA_01', name: 'El Palmar' },
  { id: 'DM_BA_02', municipalityId: 'MUN_BA_02', name: 'El Salado' },
  { id: 'DM_BA_03', municipalityId: 'MUN_BA_03', name: 'Las Clavellinas' },
  { id: 'DM_BA_04', municipalityId: 'MUN_BA_04', name: 'Cabeza de Toro' },
  { id: 'DM_BA_05', municipalityId: 'MUN_BA_04', name: 'Mena' },
  { id: 'DM_BA_06', municipalityId: 'MUN_BA_04', name: 'Monserrat' },
  { id: 'DM_BA_07', municipalityId: 'MUN_BA_04', name: 'Santa Bárbara-El 6' },
  { id: 'DM_BA_08', municipalityId: 'MUN_BA_04', name: 'Santana' },
  { id: 'DM_BA_09', municipalityId: 'MUN_BA_04', name: 'Uvilla' },

  // Barahona
  { id: 'DM_BH_01', municipalityId: 'MUN_BH_01', name: 'El Cachón' },
  { id: 'DM_BH_02', municipalityId: 'MUN_BH_01', name: 'La Guázara' },
  { id: 'DM_BH_03', municipalityId: 'MUN_BH_01', name: 'Villa Central' },
  { id: 'DM_BH_04', municipalityId: 'MUN_BH_04', name: 'Arroyo Dulce' },
  { id: 'DM_BH_05', municipalityId: 'MUN_BH_05', name: 'Pescadería' },
  { id: 'DM_BH_06', municipalityId: 'MUN_BH_06', name: 'Palo Alto' },
  { id: 'DM_BH_07', municipalityId: 'MUN_BH_07', name: 'Bahoruco' },
  { id: 'DM_BH_08', municipalityId: 'MUN_BH_09', name: 'Los Patos' },
  { id: 'DM_BH_09', municipalityId: 'MUN_BH_11', name: 'Canoa' },
  { id: 'DM_BH_10', municipalityId: 'MUN_BH_11', name: 'Fondo Negro' },
  { id: 'DM_BH_11', municipalityId: 'MUN_BH_11', name: 'Quita Coraza' },

  // Dajabón
  { id: 'DM_DA_01', municipalityId: 'MUN_DA_01', name: 'Cañongo' },
  { id: 'DM_DA_02', municipalityId: 'MUN_DA_02', name: 'Manuel Bueno' },
  { id: 'DM_DA_03', municipalityId: 'MUN_DA_03', name: 'Capotillo' },
  { id: 'DM_DA_04', municipalityId: 'MUN_DA_03', name: 'Santiago de la Cruz' },

  // Duarte
  { id: 'DM_DU_01', municipalityId: 'MUN_DU_01', name: 'Cenoví' },
  { id: 'DM_DU_02', municipalityId: 'MUN_DU_01', name: 'Jaya' },
  { id: 'DM_DU_03', municipalityId: 'MUN_DU_01', name: 'La Peña' },
  { id: 'DM_DU_04', municipalityId: 'MUN_DU_01', name: 'Presidente Don Antonio Guzmán Fernández' },
  { id: 'DM_DU_05', municipalityId: 'MUN_DU_02', name: 'Aguacate' },
  { id: 'DM_DU_06', municipalityId: 'MUN_DU_02', name: 'Las Coles' },
  { id: 'DM_DU_07', municipalityId: 'MUN_DU_04', name: 'Sabana Grande' },
  { id: 'DM_DU_08', municipalityId: 'MUN_DU_07', name: 'Agua Santa del Yuna' },
  { id: 'DM_DU_09', municipalityId: 'MUN_DU_07', name: 'Barraquito' },
  { id: 'DM_DU_10', municipalityId: 'MUN_DU_07', name: 'Cristo Rey de Guaraguao' },
  { id: 'DM_DU_11', municipalityId: 'MUN_DU_07', name: 'Las Táranas' },

  // El Seibo
  { id: 'DM_SE_01', municipalityId: 'MUN_SE_01', name: 'Pedro Sánchez' },
  { id: 'DM_SE_02', municipalityId: 'MUN_SE_01', name: 'San Francisco-Vicentillo' },
  { id: 'DM_SE_03', municipalityId: 'MUN_SE_01', name: 'Santa Lucía' },
  { id: 'DM_SE_04', municipalityId: 'MUN_SE_02', name: 'El Cedro' },
  { id: 'DM_SE_05', municipalityId: 'MUN_SE_02', name: 'La Gina' },

  // Elías Piña
  { id: 'DM_EP_01', municipalityId: 'MUN_EP_01', name: 'Guayabo' },
  { id: 'DM_EP_02', municipalityId: 'MUN_EP_01', name: 'Sabana Larga' },
  { id: 'DM_EP_03', municipalityId: 'MUN_EP_02', name: 'Sabana Cruz' },
  { id: 'DM_EP_04', municipalityId: 'MUN_EP_02', name: 'Sabana Higüero' },
  { id: 'DM_EP_05', municipalityId: 'MUN_EP_03', name: 'Guanito' },
  { id: 'DM_EP_06', municipalityId: 'MUN_EP_04', name: 'Rancho de la Guardia' },
  { id: 'DM_EP_07', municipalityId: 'MUN_EP_06', name: 'Río Limpio' },

  // Espaillat
  { id: 'DM_ES_01', municipalityId: 'MUN_ES_01', name: 'Canca La Reina' },
  { id: 'DM_ES_02', municipalityId: 'MUN_ES_01', name: 'El Higüerito' },
  { id: 'DM_ES_03', municipalityId: 'MUN_ES_01', name: 'José Contreras' },
  { id: 'DM_ES_04', municipalityId: 'MUN_ES_01', name: 'Juan López' },
  { id: 'DM_ES_05', municipalityId: 'MUN_ES_01', name: 'La Ortega' },
  { id: 'DM_ES_06', municipalityId: 'MUN_ES_01', name: 'Las Lagunas' },
  { id: 'DM_ES_07', municipalityId: 'MUN_ES_01', name: 'Monte de la Jagua' },
  { id: 'DM_ES_08', municipalityId: 'MUN_ES_01', name: 'San Víctor' },
  { id: 'DM_ES_09', municipalityId: 'MUN_ES_03', name: 'Joba Arriba' },
  { id: 'DM_ES_10', municipalityId: 'MUN_ES_03', name: 'Veragua' },
  { id: 'DM_ES_11', municipalityId: 'MUN_ES_03', name: 'Villa Magante' },

  // Hato Mayor
  { id: 'DM_HM_01', municipalityId: 'MUN_HM_01', name: 'Guayabo Dulce' },
  { id: 'DM_HM_02', municipalityId: 'MUN_HM_01', name: 'Mata Palacio' },
  { id: 'DM_HM_03', municipalityId: 'MUN_HM_01', name: 'Yerba Buena' },
  { id: 'DM_HM_04', municipalityId: 'MUN_HM_03', name: 'Elupina Cordero de Las Cañitas' },

  // Hermanas Mirabal
  { id: 'DM_HMIR_01', municipalityId: 'MUN_HMIR_01', name: 'Jamao Afuera' },
  { id: 'DM_HMIR_02', municipalityId: 'MUN_HMIR_02', name: 'Blanco' },

  // Independencia
  { id: 'DM_IN_01', municipalityId: 'MUN_IN_01', name: 'Boca de Cachón' },
  { id: 'DM_IN_02', municipalityId: 'MUN_IN_01', name: 'El Limón' },
  { id: 'DM_IN_03', municipalityId: 'MUN_IN_02', name: 'Batey 8' },
  { id: 'DM_IN_04', municipalityId: 'MUN_IN_03', name: 'Vengan a Ver' },
  { id: 'DM_IN_05', municipalityId: 'MUN_IN_05', name: 'La Colonia' },
  { id: 'DM_IN_06', municipalityId: 'MUN_IN_06', name: 'Guayabal' },

  // La Altagracia
  { id: 'DM_LA_01', municipalityId: 'MUN_LA_01', name: 'La Otra Banda' },
  { id: 'DM_LA_02', municipalityId: 'MUN_LA_01', name: 'Lagunas de Nisibón' },
  { id: 'DM_LA_03', municipalityId: 'MUN_LA_01', name: 'Verón-Punta Cana' },
  { id: 'DM_LA_04', municipalityId: 'MUN_LA_02', name: 'Bayahibe' },
  { id: 'DM_LA_05', municipalityId: 'MUN_LA_02', name: 'Boca de Yuma' },

  // La Romana
  { id: 'DM_LR_01', municipalityId: 'MUN_LR_01', name: 'Caleta' },
  { id: 'DM_LR_02', municipalityId: 'MUN_LR_03', name: 'Cumayasa' },

  // La Vega
  { id: 'DM_LV_01', municipalityId: 'MUN_LV_01', name: 'El Ranchito' },
  { id: 'DM_LV_02', municipalityId: 'MUN_LV_01', name: 'Río Verde Arriba' },
  { id: 'DM_LV_03', municipalityId: 'MUN_LV_02', name: 'La Sabina' },
  { id: 'DM_LV_04', municipalityId: 'MUN_LV_02', name: 'Tireo' },
  { id: 'DM_LV_05', municipalityId: 'MUN_LV_03', name: 'Buena Vista' },
  { id: 'DM_LV_06', municipalityId: 'MUN_LV_03', name: 'Manabao' },
  { id: 'DM_LV_07', municipalityId: 'MUN_LV_04', name: 'Rincón' },

  // María Trinidad Sánchez
  { id: 'DM_MTS_01', municipalityId: 'MUN_MTS_01', name: 'Arroyo al Medio' },
  { id: 'DM_MTS_02', municipalityId: 'MUN_MTS_01', name: 'Las Gordas' },
  { id: 'DM_MTS_03', municipalityId: 'MUN_MTS_01', name: 'San José de Matanzas' },
  { id: 'DM_MTS_04', municipalityId: 'MUN_MTS_02', name: 'Arroyo Salado' },
  { id: 'DM_MTS_05', municipalityId: 'MUN_MTS_02', name: 'La Entrada' },
  { id: 'DM_MTS_06', municipalityId: 'MUN_MTS_03', name: 'El Pozo' },

  // Monseñor Nouel
  { id: 'DM_MN_01', municipalityId: 'MUN_MN_01', name: 'Arroyo Toro-Masipedro' },
  { id: 'DM_MN_02', municipalityId: 'MUN_MN_01', name: 'La Salvia-Los Quemados' },
  { id: 'DM_MN_03', municipalityId: 'MUN_MN_01', name: 'Jayaco' },
  { id: 'DM_MN_04', municipalityId: 'MUN_MN_01', name: 'Juma Bejucal' },
  { id: 'DM_MN_05', municipalityId: 'MUN_MN_01', name: 'Sabana del Puerto' },
  { id: 'DM_MN_06', municipalityId: 'MUN_MN_03', name: 'Juan Adrián' },
  { id: 'DM_MN_07', municipalityId: 'MUN_MN_03', name: 'Villa Sonador' },

  // Montecristi
  { id: 'DM_MC_01', municipalityId: 'MUN_MC_02', name: 'Palo Verde' },
  { id: 'DM_MC_02', municipalityId: 'MUN_MC_03', name: 'Cana Chapetón' },
  { id: 'DM_MC_03', municipalityId: 'MUN_MC_03', name: 'Hatillo Palma' },
  { id: 'DM_MC_04', municipalityId: 'MUN_MC_03', name: 'Villa Elisa' },

  // Monte Plata
  { id: 'DM_MP_01', municipalityId: 'MUN_MP_01', name: 'Boyá' },
  { id: 'DM_MP_02', municipalityId: 'MUN_MP_01', name: 'Chirino' },
  { id: 'DM_MP_03', municipalityId: 'MUN_MP_01', name: 'Don Juan' },
  { id: 'DM_MP_04', municipalityId: 'MUN_MP_04', name: 'Gonzalo' },
  { id: 'DM_MP_05', municipalityId: 'MUN_MP_04', name: 'Majagual' },
  { id: 'DM_MP_06', municipalityId: 'MUN_MP_05', name: 'Los Botados' },

  // Pedernales
  { id: 'DM_PE_01', municipalityId: 'MUN_PE_01', name: 'José Francisco Peña Gómez' },
  { id: 'DM_PE_02', municipalityId: 'MUN_PE_02', name: 'Juancho' },

  // Peravia
  { id: 'DM_PR_01', municipalityId: 'MUN_PR_01', name: 'Catalina' },
  { id: 'DM_PR_02', municipalityId: 'MUN_PR_01', name: 'El Carretón' },
  { id: 'DM_PR_03', municipalityId: 'MUN_PR_01', name: 'El Limonal' },
  { id: 'DM_PR_04', municipalityId: 'MUN_PR_01', name: 'Las Barías' },
  { id: 'DM_PR_05', municipalityId: 'MUN_PR_01', name: 'Matanzas' },
  { id: 'DM_PR_06', municipalityId: 'MUN_PR_01', name: 'Paya' },
  { id: 'DM_PR_07', municipalityId: 'MUN_PR_01', name: 'Sabana Buey' },
  { id: 'DM_PR_08', municipalityId: 'MUN_PR_01', name: 'Villa Fundación' },
  { id: 'DM_PR_09', municipalityId: 'MUN_PR_01', name: 'Villa Sombrero' },
  { id: 'DM_PR_10', municipalityId: 'MUN_PR_02', name: 'Pizarrete' },
  { id: 'DM_PR_11', municipalityId: 'MUN_PR_02', name: 'Santana' },

  // Puerto Plata
  { id: 'DM_PP_01', municipalityId: 'MUN_PP_01', name: 'Maimón' },
  { id: 'DM_PP_02', municipalityId: 'MUN_PP_01', name: 'Yásica Arriba' },
  { id: 'DM_PP_03', municipalityId: 'MUN_PP_02', name: 'Río Grande' },
  { id: 'DM_PP_04', municipalityId: 'MUN_PP_05', name: 'Navas' },
  { id: 'DM_PP_05', municipalityId: 'MUN_PP_06', name: 'Belloso' },
  { id: 'DM_PP_06', municipalityId: 'MUN_PP_06', name: 'Estrecho' },
  { id: 'DM_PP_07', municipalityId: 'MUN_PP_06', name: 'La Isabela' },
  { id: 'DM_PP_08', municipalityId: 'MUN_PP_07', name: 'Cabarete' },
  { id: 'DM_PP_09', municipalityId: 'MUN_PP_07', name: 'Sabaneta de Yásica' },
  { id: 'DM_PP_10', municipalityId: 'MUN_PP_08', name: 'Estero Hondo' },
  { id: 'DM_PP_11', municipalityId: 'MUN_PP_08', name: 'Gualete' },
  { id: 'DM_PP_12', municipalityId: 'MUN_PP_08', name: 'La Jaiba' },

  // Samaná
  { id: 'DM_SA_01', municipalityId: 'MUN_SA_01', name: 'Arroyo Barril' },
  { id: 'DM_SA_02', municipalityId: 'MUN_SA_01', name: 'El Limón' },
  { id: 'DM_SA_03', municipalityId: 'MUN_SA_01', name: 'Las Galeras' },

  // San Cristóbal
  { id: 'DM_SC_01', municipalityId: 'MUN_SC_01', name: 'Hato Damas' },
  { id: 'DM_SC_02', municipalityId: 'MUN_SC_02', name: 'El Carril' },
  { id: 'DM_SC_03', municipalityId: 'MUN_SC_03', name: 'Cambita El Pueblecito' },
  { id: 'DM_SC_04', municipalityId: 'MUN_SC_07', name: 'La Cuchilla' },
  { id: 'DM_SC_05', municipalityId: 'MUN_SC_07', name: 'Medina' },
  { id: 'DM_SC_06', municipalityId: 'MUN_SC_07', name: 'San José del Puerto' },

  // San José de Ocoa
  { id: 'DM_SJO_01', municipalityId: 'MUN_SJO_01', name: 'El Naranjal' },
  { id: 'DM_SJO_02', municipalityId: 'MUN_SJO_01', name: 'El Pinar' },
  { id: 'DM_SJO_03', municipalityId: 'MUN_SJO_01', name: 'La Ciénaga' },
  { id: 'DM_SJO_04', municipalityId: 'MUN_SJO_01', name: 'Nizao-Las Auyamas' },

  // San Juan
  { id: 'DM_SJ_01', municipalityId: 'MUN_SJ_01', name: 'El Rosario' },
  { id: 'DM_SJ_02', municipalityId: 'MUN_SJ_01', name: 'Guanito' },
  { id: 'DM_SJ_03', municipalityId: 'MUN_SJ_01', name: 'Hato del Padre' },
  { id: 'DM_SJ_04', municipalityId: 'MUN_SJ_01', name: 'Hato Nuevo' },
  { id: 'DM_SJ_05', municipalityId: 'MUN_SJ_01', name: 'La Jagua' },
  { id: 'DM_SJ_06', municipalityId: 'MUN_SJ_01', name: 'Las Charcas de María Nova' },
  { id: 'DM_SJ_07', municipalityId: 'MUN_SJ_01', name: 'Pedro Corto' },
  { id: 'DM_SJ_08', municipalityId: 'MUN_SJ_01', name: 'Sabana Alta' },
  { id: 'DM_SJ_09', municipalityId: 'MUN_SJ_01', name: 'Sabaneta' },
  { id: 'DM_SJ_10', municipalityId: 'MUN_SJ_02', name: 'Arroyo Cano' },
  { id: 'DM_SJ_11', municipalityId: 'MUN_SJ_02', name: 'Yaque' },
  { id: 'DM_SJ_12', municipalityId: 'MUN_SJ_03', name: 'Batista' },
  { id: 'DM_SJ_13', municipalityId: 'MUN_SJ_03', name: 'Derrumbadero' },
  { id: 'DM_SJ_14', municipalityId: 'MUN_SJ_04', name: 'Jínova' },
  { id: 'DM_SJ_15', municipalityId: 'MUN_SJ_05', name: 'Carrera de Yegua' },
  { id: 'DM_SJ_16', municipalityId: 'MUN_SJ_05', name: 'Matayaya' },
  { id: 'DM_SJ_17', municipalityId: 'MUN_SJ_06', name: 'Jorjillo' },

  // San Pedro de Macorís
  { id: 'DM_SPM_01', municipalityId: 'MUN_SPM_04', name: 'El Puerto' },
  { id: 'DM_SPM_02', municipalityId: 'MUN_SPM_04', name: 'Gautier' },

  // Sánchez Ramírez
  { id: 'DM_SR_01', municipalityId: 'MUN_SR_01', name: 'Caballero' },
  { id: 'DM_SR_02', municipalityId: 'MUN_SR_01', name: 'Comedero Arriba' },
  { id: 'DM_SR_03', municipalityId: 'MUN_SR_01', name: 'Quita Sueño' },
  { id: 'DM_SR_04', municipalityId: 'MUN_SR_02', name: 'La Cueva' },
  { id: 'DM_SR_05', municipalityId: 'MUN_SR_02', name: 'Platanal' },
  { id: 'DM_SR_06', municipalityId: 'MUN_SR_04', name: 'Angelina' },
  { id: 'DM_SR_07', municipalityId: 'MUN_SR_04', name: 'La Bija' },
  { id: 'DM_SR_08', municipalityId: 'MUN_SR_04', name: 'Hernando Alonzo' },

  // Santiago
  { id: 'DM_STG_01', municipalityId: 'MUN_STG_01', name: 'Baitoa' },
  { id: 'DM_STG_02', municipalityId: 'MUN_STG_01', name: 'Hato del Yaque' },
  { id: 'DM_STG_03', municipalityId: 'MUN_STG_01', name: 'La Canela' },
  { id: 'DM_STG_04', municipalityId: 'MUN_STG_01', name: 'Pedro García' },
  { id: 'DM_STG_05', municipalityId: 'MUN_STG_01', name: 'San Francisco de Jacagua' },
  { id: 'DM_STG_06', municipalityId: 'MUN_STG_03', name: 'El Caimito' },
  { id: 'DM_STG_07', municipalityId: 'MUN_STG_03', name: 'Juncalito' },
  { id: 'DM_STG_08', municipalityId: 'MUN_STG_04', name: 'Las Palomas' },
  { id: 'DM_STG_09', municipalityId: 'MUN_STG_05', name: 'Canabacoa' },
  { id: 'DM_STG_10', municipalityId: 'MUN_STG_05', name: 'Guayabal' },
  { id: 'DM_STG_11', municipalityId: 'MUN_STG_07', name: 'El Rubio' },
  { id: 'DM_STG_12', municipalityId: 'MUN_STG_07', name: 'La Cuesta' },
  { id: 'DM_STG_13', municipalityId: 'MUN_STG_07', name: 'Las Placetas' },
  { id: 'DM_STG_14', municipalityId: 'MUN_STG_08', name: 'Canca La Piedra' },
  { id: 'DM_STG_15', municipalityId: 'MUN_STG_09', name: 'El Limón' },
  { id: 'DM_STG_16', municipalityId: 'MUN_STG_09', name: 'Palmar Arriba' },

  // Santo Domingo
  { id: 'DM_SD_01', municipalityId: 'MUN_SD_01', name: 'San Luis' },
  { id: 'DM_SD_02', municipalityId: 'MUN_SD_02', name: 'La Caleta' },
  { id: 'DM_SD_03', municipalityId: 'MUN_SD_03', name: 'Palmarejo-Villa Linda' },
  { id: 'DM_SD_04', municipalityId: 'MUN_SD_03', name: 'Pantoja' },
  { id: 'DM_SD_05', municipalityId: 'MUN_SD_04', name: 'La Cuaba' },
  { id: 'DM_SD_06', municipalityId: 'MUN_SD_04', name: 'La Guáyiga' },
  { id: 'DM_SD_07', municipalityId: 'MUN_SD_05', name: 'Hato Viejo' },
  { id: 'DM_SD_08', municipalityId: 'MUN_SD_06', name: 'La Victoria' },

  // Valverde
  { id: 'DM_VA_01', municipalityId: 'MUN_VA_01', name: 'Amina' },
  { id: 'DM_VA_02', municipalityId: 'MUN_VA_01', name: 'Guatapanal' },
  { id: 'DM_VA_03', municipalityId: 'MUN_VA_01', name: 'Jaibón (Pueblo Nuevo)' },
  { id: 'DM_VA_04', municipalityId: 'MUN_VA_02', name: 'Boca de Mao' },
  { id: 'DM_VA_05', municipalityId: 'MUN_VA_02', name: 'Jicomé' },
  { id: 'DM_VA_06', municipalityId: 'MUN_VA_02', name: 'Maizal' },
  { id: 'DM_VA_07', municipalityId: 'MUN_VA_02', name: 'Paradero' },
  { id: 'DM_VA_08', municipalityId: 'MUN_VA_03', name: 'Cruce de Guayacanes' },
  { id: 'DM_VA_09', municipalityId: 'MUN_VA_03', name: 'Jaibón' },
  { id: 'DM_VA_10', municipalityId: 'MUN_VA_03', name: 'La Caya' }
];

// Helper database of key sectors to provide autocomplete lists
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
  
  // Santo Domingo Norte
  { id: 'SEC_SDN_01', municipalityId: 'MUN_SD_06', name: 'Villa Mella' }
];

// Alias normalizer
const ALIAS_MAP: Record<string, string> = {
  'stgo': 'Santiago',
  'santiago': 'Santiago',
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

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function matchTerritoryName(rawName: string, type: 'province' | 'municipality'): string | null {
  if (!rawName) return null;
  const normalizedRaw = normalizeText(rawName);

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

  return null;
}
