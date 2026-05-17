import React, { useState } from "react";
import { Box, Popover } from "@mui/material";
import { CellColor } from "../../../types/budget";
import { publicImageSrc } from "../../../utils/publicImageSrc";
import styles from "./ColorPickerButton.module.scss";

interface ColorPickerButtonProps {
  currentColor: CellColor;
  onColorChange: (color: CellColor) => void;
}

const colorPickerImageSrc = publicImageSrc("color_picker.png");

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
  const colorAreas = availableColors.map((color, index) => ({
    color,
    left: `${(index % 4) * 25}%`,
    top: `${Math.floor(index / 4) * 50}%`,
  }));

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
      >
        <img
          src={colorPickerImageSrc}
          alt=""
          aria-hidden="true"
          className={styles.triggerImage}
          draggable={false}
        />
      </button>

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
          vertical: 12,
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: 11,
        }}
        PaperProps={{
          className: styles.palettePaper,
        }}
      >
        <Box className={styles.palette} role="group" aria-label="Цвета ячейки">
          <img
            src={colorPickerImageSrc}
            alt=""
            aria-hidden="true"
            className={styles.paletteImage}
            draggable={false}
          />

          {colorAreas.map(({ color, left, top }) => (
            <button
              key={color}
              onClick={() => {
                onColorChange(color);
                handleClose();
              }}
              className={styles.paletteHitArea}
              style={
                {
                  "--picker-area-left": left,
                  "--picker-area-top": top,
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
