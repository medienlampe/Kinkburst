import { type JSX } from "react";
import { useTranslation } from "react-i18next";
import * as d3 from "d3";
import type { Practice } from "../../interfaces";

interface SelectPracticeControlProps {
  onChange: (uuid: string) => void;
  value: string,
  hierarchicalPractices: d3.HierarchyNode<Practice>[];
}

const SelectPracticeControl = ({ onChange, value, hierarchicalPractices } : SelectPracticeControlProps) : JSX.Element => {
  const { t } = useTranslation();

  const getLabelForPractice = (practice: d3.HierarchyNode<Practice>) : string => {
    if (!practice.parent) {
      return practice.data.key ? t(`practices.${practice.data.key}`) : (practice.data.name ?? "");
    }

    return practice
      .ancestors()
      .reverse()
      .slice(1)
      .map((ancestor) => ancestor.data.key ? t(`practices.${ancestor.data.key}`) : (ancestor.data.name ?? "")).join(" > ");
  }

  return (
    <select
      id="select-practice"
      value={value}
      onChange={(e) : void => onChange(e.target.value)}>
      <option value=''></option>
      {hierarchicalPractices
        .map((practice) => {
          return {
            key: practice.data.uuid,
            label: getLabelForPractice(practice),
            depth: practice.depth
          }
        })
        .sort((a, b) => a.depth === 0
          ? -1
          : b.depth === 0
            ? 1
            : a.label.localeCompare(b.label))
        .map((practice) => (
          <option value={practice.key} key={practice.key}>
            {practice.label}
          </option>
        ))}
    </select>
  )
}

export default SelectPracticeControl;
