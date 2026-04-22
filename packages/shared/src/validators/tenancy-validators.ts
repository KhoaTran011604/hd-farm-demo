import * as Yup from 'yup';

export const createFarmSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2).max(100),
  location: Yup.string().optional(),
});

export const updateFarmSchema = Yup.object({
  name: Yup.string().min(2).max(100).optional(),
  location: Yup.string().optional(),
});

export const createZoneSchema = Yup.object({
  farmId: Yup.string().uuid('Invalid farm ID').required('Farm is required'),
  name: Yup.string().required('Name is required').min(2).max(100),
  type: Yup.string().optional(),
});

export const updateZoneSchema = Yup.object({
  name: Yup.string().min(2).max(100).optional(),
  type: Yup.string().optional(),
});

export const createPenSchema = Yup.object({
  zoneId: Yup.string().uuid('Invalid zone ID').required('Zone is required'),
  name: Yup.string().required('Name is required').min(2).max(100),
  capacity: Yup.number().integer().positive().optional(),
});

export const updatePenSchema = Yup.object({
  name: Yup.string().min(2).max(100).optional(),
  capacity: Yup.number().integer().positive().optional(),
});
