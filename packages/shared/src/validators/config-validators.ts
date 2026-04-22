import * as Yup from 'yup';
import { ANIMAL_SPECIES } from '../constants/species.js';

const speciesOptional = Yup.string().oneOf(ANIMAL_SPECIES as unknown as string[]).optional();

export const createAnimalTypeSchema = Yup.object({
  species: Yup.string().oneOf(ANIMAL_SPECIES as unknown as string[]).required('Species is required'),
  name: Yup.string().required('Name is required').min(2).max(100),
  description: Yup.string().optional(),
});

export const updateAnimalTypeSchema = Yup.object({
  species: speciesOptional,
  name: Yup.string().min(2).max(100).optional(),
  description: Yup.string().optional(),
});

export const createVaccineTypeSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2).max(100),
  species: speciesOptional,
  description: Yup.string().optional(),
  intervalDays: Yup.number().integer().positive().optional(),
});

export const updateVaccineTypeSchema = Yup.object({
  name: Yup.string().min(2).max(100).optional(),
  species: speciesOptional,
  description: Yup.string().optional(),
  intervalDays: Yup.number().integer().positive().optional(),
});

export const createFeedTypeSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2).max(100),
  species: speciesOptional,
  description: Yup.string().optional(),
});

export const updateFeedTypeSchema = Yup.object({
  name: Yup.string().min(2).max(100).optional(),
  species: speciesOptional,
  description: Yup.string().optional(),
});

export const createDiseaseTypeSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2).max(100),
  species: speciesOptional,
  symptoms: Yup.string().optional(),
});

export const updateDiseaseTypeSchema = Yup.object({
  name: Yup.string().min(2).max(100).optional(),
  species: speciesOptional,
  symptoms: Yup.string().optional(),
});
