import React, { useState, useRef, useEffect } from 'react';
import { NoteModel } from '../../../types/note';
import { Box, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface NoteItemProps {
  note: NoteModel;
  isEditing: boolean;
  onUpdate: (note: NoteModel) => void;
  onDelete: (id: string) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  isEditing,
  onUpdate,
  onDelete,
}) => {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Обработчик сохранения заметки
  const handleSave = () => {
    if (tempContent.trim() && tempContent !== note.content) {
      onUpdate(note.updateContent(tempContent.trim()));
    }
    setIsEditingContent(false);
  };

  // Обработчик нажатия клавиш
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setTempContent(note.content);
      setIsEditingContent(false);
    }
  };

  // Фокус на textarea при начале редактирования
  useEffect(() => {
    if (isEditingContent && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditingContent]);

  // Клик вне поля ввода
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        handleSave();
      }
    };

    if (isEditingContent) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingContent, tempContent]);

  return (
    <Box
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '10px',
        position: 'relative',
        border: '2px solid #ffffff',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: isEditing ? '-2px 2px 1px rgba(0, 0, 0, 0.25)' : 'none',
        },
      }}
    >
      {isEditing && isEditingContent ? (
        <textarea
          ref={textareaRef}
          value={tempContent}
          onChange={(e) => setTempContent(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          style={{
            width: '100%',
            minHeight: '80px',
            border: 'none',
            borderRadius: '5px',
            padding: '8px',
            fontSize: '18px',
            fontFamily: '"Roboto Condensed", sans-serif',
            color: '#0D0D0D',
            backgroundColor: '#FFFFFF',
            resize: 'vertical',
          }}
          placeholder="Введите текст заметки..."
        />
      ) : (
        <Box
          onClick={() => isEditing && setIsEditingContent(true)}
          sx={{
            minHeight: '60px',
            cursor: isEditing ? 'text' : 'default',
          }}
        >
          <Typography
            sx={{
              fontSize: '18px',
              color: '#0D0D0D',
              fontFamily: '"Roboto Condensed", sans-serif',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {note.content}
          </Typography>
        </Box>
      )}

      {/* Подпись заметки */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '4px',
          right: '8px',
        }}
      >
        <Typography
          sx={{
            fontSize: '12px',
            color: '#5B5B5B',
            fontFamily: '"Roboto Condensed", sans-serif',
            opacity: 0.7,
          }}
        >
          {note.getSignature()}
        </Typography>
      </Box>

      {/* Кнопка удаления (только в режиме редактирования) */}
      {isEditing && (
        <Box
          sx={{
            position: 'absolute',
            top: '8px',
            right: '8px',
          }}
        >
          <Box
            onClick={() => onDelete(note.id)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#FFCCCC',
              },
            }}
            title="Удалить заметку"
          >
            <DeleteIcon
              sx={{
                color: '#D87B7B',
                fontSize: '16px',
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NoteItem;