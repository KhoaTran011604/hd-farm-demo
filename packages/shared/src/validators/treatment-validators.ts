import * as Yup from 'yup';

export const createTreatmentSchema = Yup.object().shape({
  animalId: Yup.string().uuid('Invalid animal ID').required('Animal is required'),
  diseaseRecordId: Yup.string().uuid('Invalid disease record ID').optional().nullable(),
  medicine: Yup.string().required('Medicine is required').max(200),
  dosage: Yup.string().max(200).optional(),
  withdrawalDays: Yup.number().integer().min(0).max(365).optional(),
  treatedAt: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .required('Treatment date is required'),
  endedAt: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  notes: Yup.string().max(1000).optional(),
});

export const updateTreatmentSchema = Yup.object().shape({
  medicine: Yup.string().max(200).optional(),
  dosage: Yup.string().max(200).optional(),
  withdrawalDays: Yup.number().integer().min(0).max(365).nullable().optional(),
  treatedAt: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endedAt: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: Yup.string().max(1000).optional(),
});

/**
 * Withdrawal end date = treatedAt (or endedAt if present) + withdrawalDays.
 * Returns null if withdrawalDays is not set.
 */
export function withdrawalEndDate(
  treatedAt: Date | string,
  withdrawalDays: number | null | undefined,
  endedAt?: Date | string | null,
): Date | null {
  if (!withdrawalDays || withdrawalDays <= 0) return null;
  const base = endedAt ? new Date(endedAt) : new Date(treatedAt);
  const end = new Date(base);
  end.setDate(end.getDate() + withdrawalDays);
  return end;
}
