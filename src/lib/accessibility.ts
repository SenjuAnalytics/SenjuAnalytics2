/**
 * Accessibility utilities and helpers
 * WCAG 2.1 compliance helpers
 */

/**
 * Generate accessible label for screen readers
 */
export function getAriaLabel(context: string, value?: string | number): string {
  if (value === undefined || value === null) {
    return context;
  }
  return `${context}: ${value}`;
}

/**
 * Get ARIA attributes for loading state
 */
export function getLoadingAriaAttrs(isLoading: boolean) {
  return {
    "aria-busy": isLoading,
    "aria-live": "polite" as const,
  };
}

/**
 * Get ARIA attributes for error state
 */
export function getErrorAriaAttrs(error?: string) {
  if (!error) return {};
  return {
    "aria-invalid": true,
    "aria-describedby": "error-message",
    role: "alert" as const,
  };
}

/**
 * Generate accessible button label
 */
export function getButtonAriaLabel(
  action: string,
  target?: string,
  disabled?: boolean
): string {
  let label = action;
  if (target) label += ` ${target}`;
  if (disabled) label += " (disabled)";
  return label;
}

/**
 * Get ARIA attributes for interactive elements
 */
export function getInteractiveAriaAttrs(props: {
  label: string;
  expanded?: boolean;
  controls?: string;
  disabled?: boolean;
}) {
  const attrs: Record<string, string | boolean> = {
    "aria-label": props.label,
  };

  if (props.expanded !== undefined) {
    attrs["aria-expanded"] = props.expanded;
  }

  if (props.controls) {
    attrs["aria-controls"] = props.controls;
  }

  if (props.disabled) {
    attrs["aria-disabled"] = true;
  }

  return attrs;
}

/**
 * Generate accessible table attributes
 */
export function getTableAriaAttrs(caption: string) {
  return {
    role: "table" as const,
    "aria-label": caption,
  };
}

/**
 * Get ARIA attributes for status updates
 */
export function getStatusAriaAttrs(message: string, type: "success" | "error" | "info" = "info") {
  return {
    role: "status" as const,
    "aria-live": type === "error" ? ("assertive" as const) : ("polite" as const),
    "aria-label": message,
  };
}

/**
 * Announce message to screen readers
 * Creates a temporary element that screen readers will announce
 */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite"): void {
  if (typeof document === "undefined") return;

  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only"; // Visually hidden but accessible
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if element is keyboard accessible
 */
export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabIndex = element.tabIndex;
  const role = element.getAttribute("role");
  const interactiveRoles = ["button", "link", "tab", "menuitem", "option"];

  return (
    tabIndex >= 0 ||
    element.tagName === "BUTTON" ||
    element.tagName === "A" ||
    element.tagName === "INPUT" ||
    element.tagName === "SELECT" ||
    element.tagName === "TEXTAREA" ||
    (role !== null && interactiveRoles.includes(role))
  );
}

/**
 * Handle keyboard navigation for lists
 */
export function handleListKeyboard(
  event: React.KeyboardEvent,
  items: Array<unknown>,
  currentIndex: number,
  onSelect: (index: number) => void
): void {
  const { key } = event;

  switch (key) {
    case "ArrowDown":
      event.preventDefault();
      onSelect(Math.min(currentIndex + 1, items.length - 1));
      break;
    case "ArrowUp":
      event.preventDefault();
      onSelect(Math.max(currentIndex - 1, 0));
      break;
    case "Home":
      event.preventDefault();
      onSelect(0);
      break;
    case "End":
      event.preventDefault();
      onSelect(items.length - 1);
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      // Trigger selection action
      break;
  }
}
