import * as Yup from 'yup';

export const createVaccinationSchema = Yup.object().shape({
  animalId: Yup.string().uuid('Invalid animal ID').required('Animal is required'),
  vaccineTypeId: Yup.string().uuid('Invalid vaccine type ID').required('Vaccine type is required'),
  batchNumber: Yup.string().max(100).optional(),
  vaccinatedAt: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .required('Vaccination date is required'),
  nextDueAt: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  notes: Yup.string().max(1000).optional(),
});

export const updateVaccinationSchema = Yup.object().shape({
  batchNumber: Yup.string().max(100).optional(),
  vaccinatedAt: Yup.string().optional(),
  nextDueAt: Yup.string().optional(),
  notes: Yup.string().max(1000).optional(),
});
