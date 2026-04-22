import type { FastifyPluginAsync } from 'fastify';
import { animalTypes, vaccineTypes, feedTypes, diseaseTypes } from '@hd-farm/db';
import { createConfigRoutes } from './config-factory.js';
import {
  createAnimalTypeSchema, updateAnimalTypeSchema,
  createVaccineTypeSchema, updateVaccineTypeSchema,
  createFeedTypeSchema, updateFeedTypeSchema,
  createDiseaseTypeSchema, updateDiseaseTypeSchema,
} from '@hd-farm/shared';

const configRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(createConfigRoutes('config/animal-types', animalTypes, createAnimalTypeSchema, updateAnimalTypeSchema));
  await fastify.register(createConfigRoutes('config/vaccine-types', vaccineTypes, createVaccineTypeSchema, updateVaccineTypeSchema));
  await fastify.register(createConfigRoutes('config/feed-types', feedTypes, createFeedTypeSchema, updateFeedTypeSchema));
  await fastify.register(createConfigRoutes('config/disease-types', diseaseTypes, createDiseaseTypeSchema, updateDiseaseTypeSchema));
};

export default configRoutes;
