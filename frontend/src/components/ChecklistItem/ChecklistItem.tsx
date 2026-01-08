import React from "react";
import {
  Box,
  Checkbox,
  TextField,
  IconButton,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { Delete, DragHandle } from "@mui/icons-material";
import { ChecklistItemProps } from "./types";
import { ChecklistItemModel } from "../../models/ChecklistItemModel";

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  isEditing,
  onUpdate,
  onDelete,
  onToggle,
  isDragging = false,
  dragHandleProps,
}) => {
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(item.updateTitle(event.target.value));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = Math.max(0, Number(event.target.value));
    onUpdate(item.updateAmount(newAmount));
  };

  const handleToggle = () => {
    if (!isEditing) {
      onToggle(item.id);
    }
  };

  const handleColorChange = (newColor: "red" | "yellow" | "green") => {
    onUpdate(item.updateColor(newColor));
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  const getBorderColor = () => {
    switch (item.color) {
      case "red":
        return "#f44336";
      case "yellow":
        return "#ffeb3b";
      case "green":
        return "#4caf50";
      default:
        return "#e0e0e0";
    }
  };

  return (
    <Card
      {...dragHandleProps}
      sx={{
        mb: 1,
        border: `2px solid ${getBorderColor()}`,
        opacity: isDragging ? 0.5 : 1,
        transition: "all 0.2s ease",
        cursor: isEditing ? "grab" : "default",
        "&:active": {
          cursor: isEditing ? "grabbing" : "default",
        },
      }}
    >
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1}>
          {/* Handle для перетаскивания */}
          {isEditing && (
            <Box sx={{ cursor: "grab" }}>
              <DragHandle />
            </Box>
          )}

          {!isEditing && (
            <Checkbox checked={item.completed} onChange={handleToggle} />
          )}

          <Box sx={{ flexGrow: 1 }}>
            {isEditing ? (
              <Box display="flex" gap={1} alignItems="center">
                <TextField
                  value={item.title}
                  onChange={handleTitleChange}
                  variant="standard"
                  placeholder="На что тратим?"
                  fullWidth
                />
                <TextField
                  type="number"
                  value={item.amount}
                  onChange={handleAmountChange}
                  variant="standard"
                  placeholder="Сколько?"
                  sx={{ width: 100 }}
                />
                <Typography>₽</Typography>
              </Box>
            ) : (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>{item.title}</Typography>
                <Typography sx={{ fontWeight: "normal" }}>
                  {item.amount.toLocaleString()} ₽
                </Typography>
              </Box>
            )}
          </Box>

          {isEditing && (
            <Box display="flex" gap={0.5} alignItems="center">
              <Box display="flex" gap={0.5} sx={{ mr: 1 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#f44336",
                    cursor: "pointer",
                    border:
                      item.color === "red"
                        ? "2px solid black"
                        : "1px solid #ccc",
                    boxShadow:
                      item.color === "red"
                        ? "0 0 4px rgba(244, 67, 54, 0.5)"
                        : "none",
                  }}
                  onClick={() => handleColorChange("red")}
                  title="Высокий приоритет"
                />
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#ffeb3b",
                    cursor: "pointer",
                    border:
                      item.color === "yellow"
                        ? "2px solid black"
                        : "1px solid #ccc",
                    boxShadow:
                      item.color === "yellow"
                        ? "0 0 4px rgba(255, 235, 59, 0.5)"
                        : "none",
                  }}
                  onClick={() => handleColorChange("yellow")}
                  title="Средний приоритет"
                />
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#4caf50",
                    cursor: "pointer",
                    border:
                      item.color === "green"
                        ? "2px solid black"
                        : "1px solid #ccc",
                    boxShadow:
                      item.color === "green"
                        ? "0 0 4px rgba(76, 175, 80, 0.5)"
                        : "none",
                  }}
                  onClick={() => handleColorChange("green")}
                  title="Низкий приоритет"
                />
              </Box>

              <IconButton onClick={handleDelete} size="small" color="error">
                <Delete />
              </IconButton>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChecklistItem;
