// Roaster Types
export interface Roaster {
  id: number
  name: string
}

export interface RoasterCreate {
  name: string
}

// Bean Types
export enum RoastLevel {
  Dark = "Dark",
  MediumDark = "Medium Dark",
  Medium = "Medium",
  MediumLight = "Medium Light",
  Light = "Light"
}

export interface Bean {
  id: number
  name: string
  roaster_id: number
  roast_level: RoastLevel
  country_of_origin?: string
  tasting_notes?: string
  rating?: number
}

export interface BeanCreate {
  name: string
  roaster_id: number
  roast_level: RoastLevel
  country_of_origin?: string
  tasting_notes?: string
  rating?: number
}