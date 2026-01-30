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
  DragOverEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ChecklistItemModel } from '../../types/checklist-item';

// Типы для Drag & Drop
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
  // Callbacks для перемещения между категориями
  onMoveItem?: (itemId: string, fromArea: DroppableArea, toArea: DroppableArea) => void;
  // Callbacks для перемещения внутри категории
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

  // Настройка сенсоров для мыши/тача
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Нужно переместить на 8px чтобы начать drag
      },
    })
  );

  // Начало перетаскивания
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const item = active.data.current?.item as ChecklistItemModel;
    const area = active.data.current?.area as DroppableArea;
    
    if (item && area) {
      setActiveItem(item);
      setActiveArea(area);
      setIsDragging(true);
      console.log('DragDropProvider: Начало перетаскивания', { item: item.title, area });
    }
  }, []);

  // Завершение перетаскивания
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!activeItem || !activeArea) {
      resetDragState();
      return;
    }

    // Если бросили не на droppable область
    if (!over) {
      console.log('DragDropProvider: Бросили вне droppable области');
      resetDragState();
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const targetArea = over.data.current?.area as DroppableArea;

    console.log('DragDropProvider: Завершение перетаскивания', {
      activeId,
      overId,
      activeArea,
      targetArea,
      activeItem: activeItem.title
    });

    // Если перемещаем внутри одной категории
    if (activeArea === targetArea) {
      const activeIndex = active.data.current?.sortable?.index;
      const overIndex = over.data.current?.sortable?.index;
      
      if (activeIndex !== undefined && overIndex !== undefined && activeIndex !== overIndex) {
        console.log('DragDropProvider: Перемещение внутри категории', {
          area: activeArea,
          fromIndex: activeIndex,
          toIndex: overIndex
        });
        onReorderItems(activeArea, activeIndex, overIndex);
      }
    } 
    // Если перемещаем между категориями (только required <-> desired)
    else if (
      (activeArea === 'required' && targetArea === 'desired') ||
      (activeArea === 'desired' && targetArea === 'required')
    ) {
      console.log('DragDropProvider: Перемещение между категориями', {
        from: activeArea,
        to: targetArea,
        itemId: activeItem.id
      });
      onMoveItem(activeItem.id, activeArea, targetArea);
    }

    resetDragState();
  }, [activeItem, activeArea, onMoveItem, onReorderItems]);

  // Событие при наведении на droppable область
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeArea = active.data.current?.area as DroppableArea;
    const overArea = over.data.current?.area as DroppableArea;
    
    // Можно добавить визуальную обратную связь при наведении
    console.log('DragDropProvider: Наведение на область', { activeArea, overArea });
  }, []);

  // Сброс состояния
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
        onDragOver={handleDragOver}
      >
        {children}
        {/* DragOverlay для превью перетаскиваемого элемента */}
        <DragOverlay>
          {activeItem && (
            <div style={{
              opacity: 0.8,
              transform: 'rotate(5deg)',
              backgroundColor: '#FFFFFF',
              border: '2px solid #69B5D3',
              borderRadius: '10px',
              padding: '15px',
              boxShadow: '-4px 4px 8px rgba(0, 0, 0, 0.3)',
              maxWidth: '300px',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {activeItem.title}
              </div>
              <div style={{ fontSize: '16px', color: '#666', marginTop: '5px' }}>
                {activeItem.amount.toLocaleString('ru-RU')}₽
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: activeArea === 'required' ? '#D87B7B' : '#507B5D',
                marginTop: '5px'
              }}>
                {activeArea === 'required' ? 'Обязательные' : 'Желаемые'}
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