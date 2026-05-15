import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { ChecklistItemModel } from '../../types/checklist-item';
import styles from './DragDropProvider.module.scss';

export type DroppableArea = 'required' | 'desired' | 'notes';

interface DragDropContextType {
  activeItem: ChecklistItemModel | null;
  activeArea: DroppableArea | null;
  isDragging: boolean;
  handleDragStart: (item: ChecklistItemModel, area: DroppableArea) => void;
  handleDragEnd: () => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

interface DragDropProviderProps {
  children: ReactNode;
  onMoveItem?: (itemId: string, fromArea: DroppableArea, toArea: DroppableArea) => void;
  onReorderItems?: (area: DroppableArea, oldIndex: number, newIndex: number) => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onMoveItem = () => {},
  onReorderItems = () => {},
}) => {
  const [activeItem, setActiveItem] = useState<ChecklistItemModel | null>(null);
  const [activeArea, setActiveArea] = useState<DroppableArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current?.item as ChecklistItemModel;
    const area = active.data.current?.area as DroppableArea;
    
    if (item && area) {
      setActiveItem(item);
      setActiveArea(area);
      setIsDragging(true);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!activeItem || !activeArea) {
      resetDragState();
      return;
    }

    if (!over) {
      resetDragState();
      return;
    }

    const targetArea = over.data.current?.area as DroppableArea;

    if (activeArea === targetArea) {
      const activeIndex = active.data.current?.sortable?.index;
      const overIndex = over.data.current?.sortable?.index;
      
      if (activeIndex !== undefined && overIndex !== undefined && activeIndex !== overIndex) {
        onReorderItems(activeArea, activeIndex, overIndex);
      }
    } else if (
      (activeArea === 'required' && targetArea === 'desired') ||
      (activeArea === 'desired' && targetArea === 'required')
    ) {
      onMoveItem(activeItem.id, activeArea, targetArea);
    }

    resetDragState();
  }, [activeItem, activeArea, onMoveItem, onReorderItems]);

  const resetDragState = useCallback(() => {
    setActiveItem(null);
    setActiveArea(null);
    setIsDragging(false);
  }, []);

  const value: DragDropContextType = {
    activeItem,
    activeArea,
    isDragging,
    handleDragStart: (item, area) => {
      setActiveItem(item);
      setActiveArea(area);
      setIsDragging(true);
    },
    handleDragEnd: resetDragState,
  };

  return (
    <DragDropContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeItem && (
            <div className={styles.overlay}>
              <div className={styles.overlayTitle}>
                {activeItem.title}
              </div>
              <div className={styles.overlayAmount}>
                {activeItem.amount.toLocaleString('ru-RU')}₽
              </div>
              <div
                className={styles.overlayMeta}
                style={
                  {
                    '--overlay-meta-color':
                      activeArea === 'required'
                        ? 'var(--color-accent-red)'
                        : 'var(--color-accent-green)',
                  } as React.CSSProperties
                }
              >
                {activeArea === 'required' ? 'Обязательные' : 'Необязательные'}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
};

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
};
