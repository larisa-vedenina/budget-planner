import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { NoteModel } from '../../models/NoteModel';

interface NoteItemProps {
  note: NoteModel;
  isEditing: boolean;
  onUpdate: (updatedNote: NoteModel) => void;
  onDelete: (id: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isEditing,
  onUpdate,
  onDelete
}) => {
  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(note.updateContent(event.target.value));
  };

  const handleDelete = () => {
    onDelete(note.id);
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        backgroundColor: note.isAIAdvice() ? 'background.default' : 'primary.light',
        color: note.isAIAdvice() ? 'text.primary' : 'white'
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box>
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
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
            <Chip 
              label={note.isAIAdvice() ? 'AI совет' : 'Моя заметка'} 
              size="small" 
              color={note.isAIAdvice() ? 'default' : 'primary'}
            />
            
            {isEditing && (
              <IconButton onClick={handleDelete} size="small" color="error">
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NoteItem;