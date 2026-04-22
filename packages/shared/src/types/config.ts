import type { AnimalSpecies } from './animal.js';

export type AnimalType = {
  id: string;
  species: AnimalSpecies;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type VaccineType = {
  id: string;
  name: string;
  species: AnimalSpecies | null;
  description: string | null;
  intervalDays: number | null;
  createdAt: Date;
};

export type FeedType = {
  id: string;
  name: string;
  species: AnimalSpecies | null;
  description: string | null;
  createdAt: Date;
};

export type DiseaseType = {
  id: string;
  name: string;
  species: AnimalSpecies | null;
  symptoms: string | null;
  createdAt: Date;
};
