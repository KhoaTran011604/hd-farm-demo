import * as Yup from 'yup';

export const DISEASE_SEVERITIES = ['mild', 'moderate', 'severe'] as const;
export type DiseaseSeverity = (typeof DISEASE_SEVERITIES)[number];

export const DISEASE_SEVERITY_LABELS: Record<DiseaseSeverity, string> = {
  mild: 'Nhẹ',
  moderate: 'Trung bình',
  severe: 'Nặng',
};

const SEVERITY_RANK: Record<DiseaseSeverity, number> = { mild: 1, moderate: 2, severe: 3 };

export function severityRequiresSick(s: DiseaseSeverity): boolean {
  return SEVERITY_RANK[s] >= SEVERITY_RANK.moderate;
}

export const createDiseaseSchema = Yup.object().shape({
  animalId: Yup.string().uuid('Invalid animal ID').required('Animal is required'),
  diseaseTypeId: Yup.string().uuid('Invalid disease type ID').optional().nullable(),
  severity: Yup.string()
    .oneOf(DISEASE_SEVERITIES as unknown as string[], 'Invalid severity')
    .required('Severity is required'),
  symptoms: Yup.string().max(2000).optional(),
  notes: Yup.string().max(2000).optional(),
  diagnosedAt: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .required('Diagnosis date is required'),
});

export const updateDiseaseSchema = Yup.object().shape({
  severity: Yup.string().oneOf(DISEASE_SEVERITIES as unknown as string[]).optional(),
  symptoms: Yup.string().max(2000).optional(),
  notes: Yup.string().max(2000).optional(),
  diagnosedAt: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/).optional(),
  resolvedAt: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
});
