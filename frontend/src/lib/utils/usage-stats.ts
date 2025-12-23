import type { Barista, Brew } from '@shared/types';

export interface EquipmentUsageStats {
  usageCounts: Record<string, number>;
  topBaristaByEquipment: Record<string, Barista | undefined>;
}

export function buildEquipmentUsageStats(
  brews: Brew[],
  baristas: Barista[]
): EquipmentUsageStats {
  const baristaMap = baristas.reduce<Record<string, Barista>>((acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  }, {});

  const usageCounts: Record<string, number> = {};
  const baristaUsageByEquipment: Record<string, Record<string, number>> = {};

  brews.forEach((brew) => {
    const equipmentIds = [brew.machine_id, brew.grinder_id];

    equipmentIds.forEach((equipmentId) => {
      if (!equipmentId) return;

      usageCounts[equipmentId] = (usageCounts[equipmentId] ?? 0) + 1;

      const baristaCounts =
        baristaUsageByEquipment[equipmentId] ?? (baristaUsageByEquipment[equipmentId] = {});
      baristaCounts[brew.barista_id] = (baristaCounts[brew.barista_id] ?? 0) + 1;
    });
  });

  const topBaristaByEquipment: Record<string, Barista | undefined> = {};

  Object.entries(baristaUsageByEquipment).forEach(([equipmentId, baristaCounts]) => {
    let topBaristaId: string | null = null;
    let topCount = 0;

    Object.entries(baristaCounts).forEach(([baristaId, count]) => {
      if (count > topCount) {
        topBaristaId = baristaId;
        topCount = count;
      }
    });

    topBaristaByEquipment[equipmentId] = topBaristaId ? baristaMap[topBaristaId] : undefined;
  });

  return { usageCounts, topBaristaByEquipment };
}

export function formatMostUsedBy(
  equipmentId: string,
  usageCounts: Record<string, number>,
  topBaristaByEquipment: Record<string, Barista | undefined>
): string {
  const barista = topBaristaByEquipment[equipmentId];

  if (barista) return barista.display_name;
  if (usageCounts[equipmentId]) return 'Unknown barista';
  return 'No brews yet';
}
