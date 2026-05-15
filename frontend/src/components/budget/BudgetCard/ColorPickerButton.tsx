import React, { useState } from "react";
import { Box, Popover } from "@mui/material";
import { CellColor } from "../../../types/budget";
import styles from "./ColorPickerButton.module.scss";

interface ColorPickerButtonProps {
  currentColor: CellColor;
  onColorChange: (color: CellColor) => void;
}

export const ColorPickerButton: React.FC<ColorPickerButtonProps> = ({
  currentColor,
  onColorChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const availableColors: CellColor[] = [
    "#D87B7B",
    "#507B5D",
    "#69B5D3",
    "#FCD688",
    "#FFDFDF",
    "#ABD0B7",
    "#CAEEFC",
    "#FFE8B9",
  ];

  return (
    <>
      <button
        onClick={handleClick}
        className={styles.trigger}
        style={
          {
            "--picker-current-color": currentColor,
          } as React.CSSProperties
        }
        aria-label="Выбрать цвет фона"
        title="Изменить цвет фона"
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        disableScrollLock
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        transitionDuration={0}
        keepMounted
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box className={styles.palette}>
          {availableColors.map((color) => (
            <button
              key={color}
              onClick={() => {
                onColorChange(color);
                handleClose();
              }}
              className={`${styles.swatch} ${
                color === currentColor ? styles.swatchActive : ""
              }`}
              style={
                {
                  "--picker-color": color,
                } as React.CSSProperties
              }
              aria-label={`Выбрать цвет ${color}`}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
};

export default ColorPickerButton;
