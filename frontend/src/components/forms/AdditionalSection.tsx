import React from "react";
import { Box, Typography } from "@mui/material";
import BudgetFormSection from "./BudgetFormSection";
import { FormSection, FormInputItem } from "../../types/form";
import { getSurfaceShadowVariable } from "../../styles/theme";
import styles from "./AdditionalSection.module.scss";

interface AdditionalSectionProps {
  section: FormSection;
  onChange: (items: FormInputItem[]) => void;
}

const AdditionalSection: React.FC<AdditionalSectionProps> = ({
  section,
  onChange,
}) => {
  return (
    <Box
      className={styles.sectionWrap}
      style={
        {
          "--section-color": section.color,
          "--section-shadow": getSurfaceShadowVariable(section.color),
        } as React.CSSProperties
      }
    >
      <Box className={styles.header}>
        <Typography variant="h3" className={styles.title}>
          {section.title}
        </Typography>
      </Box>

      <BudgetFormSection
        section={section}
        onChange={onChange}
        isNested
        showHeader={false}
      />
    </Box>
  );
};

export default AdditionalSection;
