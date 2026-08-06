import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "../../hooks/useTheme.jsx";
import Dropdown, { DropdownItem, DropdownLabel } from "../ui/Dropdown.jsx";
import Button from "../ui/Button.jsx";

const OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

/**
 * Theme switcher. Offers an explicit "System" option rather than a binary
 * toggle so a user who wants to follow their OS is not forced to pick a side.
 */
export default function ThemeToggle({ align = "end" }) {
  const { theme, preference, setPreference } = useTheme();
  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <Dropdown
      align={align}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          leadingIcon={Icon}
          aria-label={`Theme: ${preference}. Change theme`}
        />
      }
    >
      <DropdownLabel>Appearance</DropdownLabel>
      {OPTIONS.map((option) => (
        <DropdownItem
          key={option.id}
          icon={option.icon}
          onClick={() => setPreference(option.id)}
          aria-current={preference === option.id}
          style={
            preference === option.id
              ? { background: "var(--brand-soft)", color: "var(--brand-soft-text)" }
              : undefined
          }
        >
          {option.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
