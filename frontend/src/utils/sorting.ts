import { ChecklistItemModel } from "../types/checklist-item";

export const sortChecklistItems = (
  items: ChecklistItemModel[],
): ChecklistItemModel[] => {
  if (!items || items.length === 0) return [];

  // Разделяем на активные и выполненные
  const activeItems = items.filter((item) => !item.completed);
  const completedItems = items.filter((item) => item.completed);

  // Сортируем активные: приоритетные → старые → новые
  const sortedActive = [...activeItems].sort((a, b) => {
    // Приоритетные сверху
    if (a.priority === "priority" && b.priority !== "priority") return -1;
    if (a.priority !== "priority" && b.priority === "priority") return 1;

    // Старые выше новых
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Сортируем выполненные: самые свежие сверху
  const sortedCompleted = [...completedItems].sort(
    (a, b) =>
      new Date(b.completedAt || 0).getTime() -
      new Date(a.completedAt || 0).getTime(),
  );

  // Объединяем: активные → выполненные
  return [...sortedActive, ...sortedCompleted];
};
