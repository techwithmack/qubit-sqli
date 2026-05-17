export type Creature = {
  id: number;
  name: string;
  species: string;
  danger_level: number;
  home_planet: string;
  description: string;
};

export type User = {
  id: number;
  username: string;
  password: string;
  clearance_level: string;
};

export type AdminSession = {
  id: number;
  username: string;
  clearance_level: string;
};
