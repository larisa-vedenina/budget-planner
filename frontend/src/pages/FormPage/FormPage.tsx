import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Container, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import BudgetFormSection from "../../components/forms/BudgetFormSection";
import AdditionalSection from "../../components/forms/AdditionalSection";
import InfoHint from "../../components/ui/InfoHint";
import {
  ADDITIONAL_FORM_SECTIONS,
  DEFAULT_FORM_SECTIONS,
  FormData,
  FormInputItem,
  MAIN_FORM_SECTIONS,
  SectionType,
} from "../../types/form";
import { useBudget } from "../../contexts/BudgetContext";
import { formDataToBudget } from "../../utils/formToBudget";
import { formDataToAIBudgetPlanRequest } from "../../utils/formToBudgetRequest";
import { generateAIBudgetPlan } from "../../services/aiBudgetService";
import { aiBudgetPlanToBudget } from "../../utils/aiBudgetPlanToBudget";
import {
  clearFormDraft,
  loadFormDraft,
  saveFormDraft,
} from "../../utils/formDraftStorage";
import { pxToRem, remSpace } from "../../styles/units";
import { getSurfaceShadowVariable } from "../../styles/theme";
import { NoteModel } from "../../types/note";
import { createReturnState, getReturnPath } from "../../utils/navigationState";
import styles from "./FormPage.module.scss";

const getAdditionalButtonSx = (sectionColor: string) => ({
  border: `${pxToRem(3)} solid ${sectionColor}`,
  borderRadius: pxToRem(10),
  backgroundColor: "#FFFFFF",
  color: "#0D0D0D",
  minHeight: pxToRem(50),
  height: pxToRem(50),
  padding: remSpace(0, 20),
  boxShadow: getSurfaceShadowVariable(sectionColor),
  minWidth: { xs: "100%", sm: "auto" },
  justifyContent: "center",
  transition:
    "transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)",
  "&:hover": {
    backgroundColor: "#FFFFFF",
    transform: `translate(${pxToRem(3)}, ${pxToRem(2)})`,
    boxShadow: "none",
  },
  "&:active": {
    backgroundColor: "#FFFFFF",
    transform: `translate(${pxToRem(3)}, ${pxToRem(2)})`,
    boxShadow: "none",
  },
  fontSize: "1rem",
  fontWeight: 400,
  letterSpacing: "0",
  textTransform: "uppercase",
});

const aiCommentSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-surface-red-soft)",
    "& fieldset": {
      borderColor: "var(--surface-red-soft)",
      borderWidth: pxToRem(2),
      borderRadius: "var(--radius-md)",
    },
    "&:hover fieldset": {
      borderColor: "var(--surface-red-soft)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--surface-red-soft)",
      borderWidth: pxToRem(2),
    },
    "& textarea": {
      color: "#0D0D0D",
      fontFamily: "'Roboto Condensed', sans-serif",
      fontSize: pxToRem(16),
      opacity: 1,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    "& textarea::placeholder": {
      color: "#5B5B5B",
      fontSize: pxToRem(16),
      opacity: 0.6,
    },
  },
};

const contextFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: pxToRem(50),
    height: pxToRem(50),
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-surface-red-soft)",
    "& fieldset": {
      borderColor: "var(--surface-red-soft)",
      borderWidth: pxToRem(2),
      borderRadius: "var(--radius-md)",
    },
    "&:hover fieldset": {
      borderColor: "var(--surface-red-soft)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--surface-red-soft)",
      borderWidth: pxToRem(2),
    },
    "& input": {
      color: "#0D0D0D",
      fontFamily: "'Roboto Condensed', sans-serif",
      fontSize: pxToRem(16),
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    "& input::placeholder": {
      color: "#5B5B5B",
      fontSize: pxToRem(16),
      opacity: 0.6,
    },
  },
};

const dailySpendingFieldSx = {
  ...contextFieldSx,
  "& .MuiOutlinedInput-root": {
    ...contextFieldSx["& .MuiOutlinedInput-root"],
    minHeight: { xs: pxToRem(74), sm: pxToRem(50) },
    height: { xs: pxToRem(74), sm: pxToRem(50) },
    alignItems: "center",
    "& textarea": {
      color: "#0D0D0D",
      fontFamily: "'Roboto Condensed', sans-serif",
      fontSize: pxToRem(16),
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
      minHeight: { xs: pxToRem(48), sm: "auto" },
      overflow: "hidden",
      resize: "none",
    },
    "& textarea::placeholder": {
      color: "#5B5B5B",
      fontSize: pxToRem(16),
      opacity: 0.6,
    },
  },
};

const FormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadBudget } = useBudget();
  const initialDraft = useMemo(loadFormDraft, []);
  const returnPath = getReturnPath(location.state, "/start");

  const [formData, setFormData] = useState<FormData>(initialDraft.formData);
  const [history, setHistory] = useState<FormData[]>(initialDraft.history);
  const [historyIndex, setHistoryIndex] = useState(initialDraft.historyIndex);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const additionalSections = useMemo(
    () =>
      ADDITIONAL_FORM_SECTIONS.filter((sectionType) =>
        Boolean(formData.sections[sectionType]),
      ),
    [formData.sections],
  );

  const hasPeriod = Boolean(
    formData.period.startDate && formData.period.endDate,
  );

  const hasBudgetInput = useMemo(
    () =>
      (formData.sections.income?.inputs.items ?? []).some(
        (item) => item.amount > 0,
      ),
    [formData.sections.income?.inputs.items],
  );

  const hasRequiredExpenses = useMemo(
    () =>
      (formData.sections.required?.inputs.items ?? []).some(
        (item) => item.text.trim() && item.amount > 0,
      ),
    [formData.sections.required?.inputs.items],
  );

  const isCreateBudgetReady =
    hasPeriod && hasBudgetInput && hasRequiredExpenses;
  const canCreateBudget = isCreateBudgetReady && !isSubmitting;
  const createButtonText = isSubmitting
    ? "ИИ создает план..."
    : !hasBudgetInput || !hasRequiredExpenses
      ? "введи доход и траты"
      : !hasPeriod
        ? "выбери период"
        : "Создать план бюджета";

  const addToHistory = useCallback(
    (newFormData: FormData, action: string) => {
      const newHistory = [...history.slice(0, historyIndex + 1), newFormData];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  const applyFormChange = useCallback(
    (action: string, nextFormData: FormData) => {
      setFormData(nextFormData);
      addToHistory(nextFormData, action);
    },
    [addToHistory],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFormData(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFormData(history[newIndex]);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    saveFormDraft({
      formData,
      history,
      historyIndex,
    });
  }, [formData, history, historyIndex]);

  const handlePeriodChange = useCallback(
    (start: string, end: string) => {
      applyFormChange("Изменение периода", {
        ...formData,
        period: { startDate: start, endDate: end },
      });
    },
    [formData, applyFormChange],
  );

  const handleSectionChange = useCallback(
    (sectionId: SectionType, items: FormInputItem[]) => {
      const currentSection = formData.sections[sectionId];
      if (!currentSection) {
        return;
      }

      applyFormChange(`Изменение секции ${sectionId}`, {
        ...formData,
        sections: {
          ...formData.sections,
          [sectionId]: {
            ...currentSection,
            inputs: {
              ...currentSection.inputs,
              items,
            },
          },
        },
      });
    },
    [formData, applyFormChange],
  );

  const handleAICommentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applyFormChange("Изменение комментария для ИИ", {
        ...formData,
        aiComment: e.target.value,
      });
    },
    [formData, applyFormChange],
  );

  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applyFormChange("Изменение города", {
        ...formData,
        city: e.target.value,
      });
    },
    [formData, applyFormChange],
  );

  const handleDailySpendingChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applyFormChange("Изменение дневных трат", {
        ...formData,
        dailySpending: e.target.value,
      });
    },
    [formData, applyFormChange],
  );

  const handleBack = useCallback(() => {
    navigate(returnPath);
  }, [navigate, returnPath]);

  const handleAddSection = useCallback(
    (sectionType: SectionType) => {
      if (formData.sections[sectionType]) {
        return;
      }

      applyFormChange(`Добавление секции ${sectionType}`, {
        ...formData,
        sections: {
          ...formData.sections,
          [sectionType]: {
            ...DEFAULT_FORM_SECTIONS[sectionType],
            inputs: {
              ...DEFAULT_FORM_SECTIONS[sectionType].inputs,
              items: [],
            },
          },
        },
      });
    },
    [formData, applyFormChange],
  );

  const handleRemoveSection = useCallback(
    (sectionType: SectionType) => {
      if (!formData.sections[sectionType]) {
        return;
      }

      const { [sectionType]: _removedSection, ...newSections } =
        formData.sections;
      applyFormChange(`Удаление секции ${sectionType}`, {
        ...formData,
        sections: newSections,
      });
    },
    [formData, applyFormChange],
  );

  const handleCreateBudget = useCallback(async () => {
    if (!canCreateBudget) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestPayload = formDataToAIBudgetPlanRequest(formData);
      const aiPlan = await generateAIBudgetPlan(requestPayload);
      const budget = aiBudgetPlanToBudget(formData, aiPlan);

      loadBudget(budget);
      clearFormDraft();
      navigate("/main", { state: createReturnState(returnPath) });
    } catch (error) {
      console.error("Не удалось сгенерировать ИИ-план бюджета:", error);

      const fallbackBudget = formDataToBudget(formData);

      loadBudget({
        ...fallbackBudget,
        notes: [
          NoteModel.createAINote(
            "Пока не получилось собрать ИИ-план, поэтому здесь базовый черновик. Можешь подправить его вручную и попробовать еще раз позже.",
          ),
          ...fallbackBudget.notes,
        ],
        updatedAt: new Date(),
      });

      clearFormDraft();
      navigate("/main", { state: createReturnState(returnPath) });
    } finally {
      setIsSubmitting(false);
    }
  }, [canCreateBudget, formData, loadBudget, navigate, returnPath]);

  return (
    <Box
      className={styles.page}
      sx={{
        paddingTop: { xs: pxToRem(32), md: pxToRem(40) },
        paddingBottom: { xs: pxToRem(112), md: pxToRem(104) },
        paddingX: { xs: pxToRem(12), sm: pxToRem(20) },
      }}
    >
      <Container
        className={styles.container}
        maxWidth={false}
        sx={{
          maxWidth: `${pxToRem(750)} !important`,
          paddingX: { xs: 0, sm: 0 },
        }}
      >
        {MAIN_FORM_SECTIONS.map((sectionId) => {
          const section = formData.sections[sectionId];

          if (!section) {
            return null;
          }

          const displaySection = {
            ...section,
            color: DEFAULT_FORM_SECTIONS[sectionId].color,
          };

          return (
            <React.Fragment key={sectionId}>
              <BudgetFormSection
                section={displaySection}
                onChange={(items) => handleSectionChange(sectionId, items)}
                onPeriodChange={
                  sectionId === "period" ? handlePeriodChange : undefined
                }
                periodValue={
                  sectionId === "period" ? formData.period : undefined
                }
              />

              {sectionId === "required" && (
                <Box className={styles.contextFields}>
                  <TextField
                    autoComplete="off"
                    multiline
                    minRows={1}
                    placeholder="Сколько комфортно тратить в день на еду и базовые потребности?"
                    value={formData.dailySpending}
                    onChange={handleDailySpendingChange}
                    className={styles.contextField}
                    name="budget-daily-spending"
                    inputProps={{
                      autoComplete: "off",
                      autoCapitalize: "off",
                      spellCheck: false,
                    }}
                    sx={dailySpendingFieldSx}
                  />

                  <TextField
                    autoComplete="off"
                    placeholder="В каком городе живешь?"
                    value={formData.city}
                    onChange={handleCityChange}
                    className={styles.contextField}
                    name="budget-city"
                    inputProps={{
                      autoComplete: "off",
                      autoCapitalize: "off",
                      spellCheck: false,
                    }}
                    sx={contextFieldSx}
                  />
                </Box>
              )}
            </React.Fragment>
          );
        })}

        <Box className={styles.sectionBlock} sx={{ marginBottom: pxToRem(10) }}>
          <Box className={styles.additionalActions}>
            {ADDITIONAL_FORM_SECTIONS.map((sectionType) => {
              const isAdded = additionalSections.includes(sectionType);
              const sectionColor = DEFAULT_FORM_SECTIONS[sectionType].color;

              return (
                <Button
                  key={sectionType}
                  disableRipple
                  startIcon={isAdded ? <RemoveIcon /> : <AddIcon />}
                  onClick={() =>
                    isAdded
                      ? handleRemoveSection(sectionType)
                      : handleAddSection(sectionType)
                  }
                  className={styles.additionalButton}
                  sx={getAdditionalButtonSx(sectionColor)}
                >
                  {isAdded ? "Удалить" : "Добавить"}{" "}
                  {DEFAULT_FORM_SECTIONS[sectionType].title}
                </Button>
              );
            })}
          </Box>

          {additionalSections.map((sectionType) => {
            const section = formData.sections[sectionType];

            if (!section) {
              return null;
            }

            const displaySection = {
              ...section,
              color: DEFAULT_FORM_SECTIONS[sectionType].color,
            };

            return (
              <AdditionalSection
                key={sectionType}
                section={displaySection}
                onChange={(items) => handleSectionChange(sectionType, items)}
              />
            );
          })}
        </Box>

        <Box className={styles.aiSection} sx={{ marginBottom: pxToRem(10) }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            autoComplete="off"
            name="budget-ai-comment"
            placeholder="Расскажи, что для тебя важно: цели, ограничения, крупные покупки или любые детали, которые помогут точнее собрать план..."
            value={formData.aiComment}
            onChange={handleAICommentChange}
            inputProps={{
              autoComplete: "off",
              autoCapitalize: "off",
              spellCheck: false,
            }}
            sx={aiCommentSx}
          />
        </Box>

        <Box className={styles.createRow}>
          <Button
            disableRipple
            onClick={handleCreateBudget}
            disabled={!canCreateBudget}
            className={styles.createButton}
            sx={{
              width: "100%",
              maxWidth: pxToRem(342),
              minHeight: pxToRem(63),
              backgroundColor: "#FFFFFF",
              border: `${pxToRem(3)} solid ${
                isCreateBudgetReady ? "#D87B7B" : "var(--border-neutral)"
              }`,
              borderRadius: pxToRem(10),
              boxShadow: isCreateBudgetReady
                ? "var(--shadow-accent-red)"
                : "var(--shadow-neutral-edit)",
              color: isCreateBudgetReady ? "#0D0D0D" : "#5B5B5B",
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: isCreateBudgetReady
                ? { xs: pxToRem(20), sm: pxToRem(24) }
                : pxToRem(16),
              fontWeight: 400,
              lineHeight: pxToRem(28),
              textTransform: "uppercase",
              letterSpacing: "0",
              padding: remSpace(12, 20),
              transition:
                "transform var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast)",
              "&:hover": {
                backgroundColor: "#FFFFFF",
                transform: `translate(${pxToRem(3)}, ${pxToRem(2)})`,
                boxShadow: "none",
              },
              "&:active": {
                backgroundColor: "#FFFFFF",
                transform: `translate(${pxToRem(3)}, ${pxToRem(2)})`,
                boxShadow: "none",
              },
              "&.Mui-disabled": {
                backgroundColor: "#FFFFFF",
                color: isCreateBudgetReady ? "#0D0D0D" : "#5B5B5B",
                opacity: 1,
                borderColor: isCreateBudgetReady
                  ? "#D87B7B"
                  : "var(--border-neutral)",
                boxShadow: isCreateBudgetReady
                  ? "var(--shadow-accent-red)"
                  : "var(--shadow-neutral-edit)",
              },
            }}
          >
            {createButtonText}
          </Button>
        </Box>
      </Container>

      <div className={styles.pageFooter}>
        <div className={styles.bottomNav}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBack}
          >
            Вернуться
          </button>
        </div>

        <InfoHint
          ariaLabel="Подсказки по заполнению формы"
          variant="red"
          iconFileName="tooltip_form.png"
          floating={false}
          messages={[
            "㋡ Заполняй подробно: суммы, сроки, долги, цели и важные ограничения.",
            "㋡ Чтобы сохранить пункт, нажми Enter.",
            "㋡ Последнее действие можно отменить через Ctrl+Z.",
            "㋡ После создания бюджета все пункты и заметки можно редактировать.",
          ]}
        />
      </div>
    </Box>
  );
};

export default FormPage;
