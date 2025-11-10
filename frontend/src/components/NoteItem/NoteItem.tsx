import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { Delete, DragHandle } from '@mui/icons-material';
import { NoteModel } from '../../models/NoteModel';

interface NoteItemProps {
  note: NoteModel;
  isEditing: boolean;
  onUpdate: (updatedNote: NoteModel) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isEditing,
  onUpdate,
  onDelete,
  isDragging = false,
  dragHandleProps
}) => {
  /**
   * Обрабатывает изменение содержимого заметки
   */
  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(note.updateContent(event.target.value));
  };

  /**
   * Обрабатывает удаление заметки
   */
  const handleDelete = () => {
    onDelete(note.id);
  };

  return (
    <Card 
      {...dragHandleProps}
      sx={{ 
        mb: 2,
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s ease',
        cursor: isEditing ? 'grab' : 'default',
        backgroundColor: note.isAIAdvice() ? 'background.default' : 'primary.light',
        color: note.isAIAdvice() ? 'text.primary' : 'white',
        '&:active': {
          cursor: isEditing ? 'grabbing' : 'default',
        },
        '&:hover': {
          boxShadow: isEditing ? 2 : 1,
        }
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box display="flex" gap={1}>
          {/* Handle для перетаскивания */}
          {isEditing && (
            <Box sx={{ cursor: 'grab', mt: 0.5 }}>
              <DragHandle />
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }}>
            {/* Поле ввода содержимого */}
            <TextField
              fullWidth
              multiline
              variant="standard"
              value={note.content}
              onChange={handleContentChange}
              InputProps={{
                readOnly: !isEditing,
                disableUnderline: !isEditing
              }}
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontSize: '0.9rem',
                  color: note.isAIAdvice() ? 'text.primary' : 'white'
                }
              }}
            />

            {/* Информация о типе заметки и кнопка удаления */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Chip 
                label={note.isAIAdvice() ? 'AI совет' : 'Моя заметка'} 
                size="small" 
                color={note.isAIAdvice() ? 'default' : 'primary'}
              />
              
              {/* Кнопка удаления */}
              {isEditing && (
                <IconButton 
                  onClick={handleDelete} 
                  size="small" 
                  color="error"
                  sx={{ 
                    color: note.isAIAdvice() ? 'error.main' : 'white'
                  }}
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NoteItem;