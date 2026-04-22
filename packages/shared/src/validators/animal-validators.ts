import * as Yup from 'yup';
import { ANIMAL_SPECIES, HEALTH_STATUSES } from '../constants/species.js';

export const createAnimalSchema = Yup.object().shape({
  name: Yup.string().required('Animal name is required').min(2).max(100),
  species: Yup.string().oneOf(ANIMAL_SPECIES as unknown as string[]).required('Species is required'),
  penId: Yup.string().uuid('Invalid pen ID').required('Pen is required'),
  qrCode: Yup.string().optional(),
  typeMetadata: Yup.object().optional(),
});

export const updateAnimalSchema = Yup.object().shape({
  name: Yup.string().min(2).max(100).optional(),
  penId: Yup.string().uuid('Invalid pen ID').optional(),
  status: Yup.string().oneOf(HEALTH_STATUSES as unknown as string[]).optional(),
  typeMetadata: Yup.object().optional(),
});

export const createBatchSchema = Yup.object().shape({
  name: Yup.string().required('Batch name is required').min(2).max(100),
  species: Yup.string().oneOf(ANIMAL_SPECIES as unknown as string[]).required('Species is required'),
  count: Yup.number().integer().min(1).required('Count is required'),
});
