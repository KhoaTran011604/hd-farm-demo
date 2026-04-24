import { sql } from 'drizzle-orm';
import type { Database } from '@hd-farm/db';

export interface UpcomingVaccination {
  animalId: string;
  animalName: string;
  species: string;
  vaccineTypeId: string;
  vaccineName: string;
  dueDate: Date;
}

export async function getUpcomingVaccinations(
  db: Database,
  companyId: string,
  farmId?: string,
  days = 7
): Promise<UpcomingVaccination[]> {
  const farmFilter = farmId
    ? sql`AND a.farm_id = ${farmId}`
    : sql``;

  // Compute due_date per animal+vaccine pair:
  //   COALESCE(MAX(next_due_at), MAX(vaccinated_at) + interval_days days)
  // Only returns rows where due_date falls within [now, now + days]
  const result = await db.execute<{
    animal_id: string;
    animal_name: string;
    species: string;
    vaccine_type_id: string;
    vaccine_name: string;
    due_date: Date;
  }>(sql`
    SELECT
      a.id           AS animal_id,
      a.name         AS animal_name,
      a.species      AS species,
      vt.id          AS vaccine_type_id,
      vt.name        AS vaccine_name,
      COALESCE(
        MAX(vr.next_due_at),
        MAX(vr.vaccinated_at) + vt.interval_days * INTERVAL '1 day',
        NOW()
      )              AS due_date
    FROM animals a
    JOIN vaccine_types vt ON vt.species = a.species
    LEFT JOIN vaccination_records vr
      ON vr.animal_id = a.id
      AND vr.vaccine_type_id = vt.id
    WHERE
      a.company_id = ${companyId}
      AND a.deleted_at IS NULL
      AND a.status NOT IN ('dead', 'sold')
      AND vt.interval_days IS NOT NULL
      ${farmFilter}
    GROUP BY a.id, a.name, a.species, vt.id, vt.name, vt.interval_days
    HAVING
      COALESCE(
        MAX(vr.next_due_at),
        MAX(vr.vaccinated_at) + vt.interval_days * INTERVAL '1 day',
        NOW()
      ) BETWEEN NOW() - INTERVAL '1 day' AND NOW() + ${days} * INTERVAL '1 day'
    ORDER BY due_date ASC
    LIMIT 200
  `);

  return Array.from(result).map((r) => ({
    animalId: r.animal_id,
    animalName: r.animal_name,
    species: r.species,
    vaccineTypeId: r.vaccine_type_id,
    vaccineName: r.vaccine_name,
    dueDate: r.due_date,
  }));
}
