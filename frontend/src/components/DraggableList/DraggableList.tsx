import React from 'react';
import { Box } from '@mui/material';
import { DragDropService } from '../../services/DragDropService';

interface DraggableListProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T, index: number, dragHandleProps: any) => React.ReactNode;
  onReorder: (newItems: T[], oldIndex: number, newIndex: number) => void;
  isEditing: boolean;
}

/**
 * Универсальный компонент для списка с поддержкой drag & drop
 */
function DraggableList<T extends { id: string }>({
  items,
  renderItem,
  onReorder,
  isEditing
}: DraggableListProps<T>) {
  const dragDropService = React.useRef(new DragDropService<T>());
  const [draggedOverIndex, setDraggedOverIndex] = React.useState<number | null>(null);

  /**
   * Обрабатывает начало перетаскивания
   */
  const handleDragStart = (item: T, index: number) => {
    if (isEditing) {
      dragDropService.current.startDrag(item, index);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isEditing) {
      e.preventDefault();
      setDraggedOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    if (isEditing) {
      e.preventDefault();
      const result = dragDropService.current.endDrag(items, index);
      if (result) {
        onReorder(result.newItems, result.oldIndex, result.newIndex);
      }
      setDraggedOverIndex(null);
    }
  };

  const createDragHandleProps = (item: T, index: number) => ({
    draggable: isEditing,
    onDragStart: () => handleDragStart(item, index),
    onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
    onDragLeave: handleDragLeave,
    onDrop: (e: React.DragEvent) => handleDrop(e, index),
    style: {
      cursor: isEditing ? 'grab' : 'default',
    }
  });

  return (
    <Box>
      {items.map((item, index) => (
        <Box
          key={item.id}
          onDragOver={(e) => {
            if (isEditing) {
              e.preventDefault(); // Разрешаем drop
            }
          }}
        >
          {renderItem(item, index, createDragHandleProps(item, index))}
        </Box>
      ))}
    </Box>
  );
}

export default DraggableList;