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

// Bag Types
export interface Bag {
  id: number
  name: string
  bean_id: number
  roast_date?: string
  weight?: number
  price?: number
  purchase_location?: string
  rating?: number
}

export interface BagCreate {
  name: string
  bean_id: number
  roast_date?: string
  weight?: number
  price?: number
  purchase_location?: string
  rating?: number
}

// Barista Types
export interface Barista {
  id: number
  first_name: string
  last_name: string
  email: string
}

export interface BaristaCreate {
  first_name: string
  last_name: string
  email: string
}

// Grinder Types
export interface Grinder {
  id: number
  name: string
  user_manual_link?: string
  image?: string
  setting_guide_chart?: string
}

export interface GrinderCreate {
  name: string
  user_manual_link?: string
  image?: string
  setting_guide_chart?: string
}

// Machine Types
export interface Machine {
  id: number
  name: string
  manufacturer?: string
  user_manual_link?: string
  image?: string
}

export interface MachineCreate {
  name: string
  manufacturer?: string
  user_manual_link?: string
  image?: string
}

// Brew Types
export interface Brew {
  id: number
  name: string
  machine_id: number
  bag_id: number
  grinder_id: number
  barista_id: number
  brew_time?: number
  timestamp?: string
  dose?: number
  yield?: number
  rating?: number
  tasting_notes?: string
  reflections?: string
}

export interface BrewCreate {
  name: string
  machine_id: number
  bag_id: number
  grinder_id: number
  barista_id: number
  brew_time?: number
  timestamp?: string
  dose?: number
  yield?: number
  rating?: number
  tasting_notes?: string
  reflections?: string
}