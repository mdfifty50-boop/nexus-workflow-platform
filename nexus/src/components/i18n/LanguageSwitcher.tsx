/**
 * LanguageSwitcher Component
 *
 * A comprehensive language selector component with RTL support.
 *
 * Features:
 * - Dropdown with language options
 * - Flag/name display in native script
 * - Current locale indicator
 * - Persistent selection (localStorage)
 * - RTL direction auto-switch on language change
 *
 * Usage:
 * ```tsx
 * import { LanguageSwitcher } from '@/components/i18n';
 *
 * // Basic usage
 * <LanguageSwitcher />
 *
 * // With callback
 * <LanguageSwitcher onLocaleChange={(locale) => console.log(locale)} />
 *
 * // Compact mode (icon only)
 * <LanguageSwitcher compact />
 *
 * // Custom styling
 * <LanguageSwitcher className="my-custom-class" />
 * ```
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  getCurrentLocale,
  setLocale,
  getAvailableLocales,
  onLocaleChange,
  isRTL,
} from '@/lib/i18n';
import type { SupportedLocale, LocaleConfig, LanguageChangeEvent } from '@/lib/i18n';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the LanguageSwitcher component
 */
export interface LanguageSwitcherProps {
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Callback when locale changes */
  onLocaleChange?: (locale: SupportedLocale) => void;
  /** Show compact mode (icon/flag only) */
  compact?: boolean;
  /** Show native language names (default: true) */
  showNativeName?: boolean;
  /** Show flags (default: true) */
  showFlag?: boolean;
  /** Custom trigger element */
  trigger?: ReactNode;
  /** Dropdown alignment */
  align?: 'start' | 'end' | 'center';
  /** Disable the switcher */
  disabled?: boolean;
  /** Accessible label */
  ariaLabel?: string;
}

/**
 * Props for the LanguageOption component
 */
interface LanguageOptionProps {
  locale: LocaleConfig;
  isSelected: boolean;
  showNativeName: boolean;
  showFlag: boolean;
  onClick: () => void;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    position: 'relative' as const,
    display: 'inline-block',
    fontFamily: 'inherit',
  },

  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-color, #374151)',
    transition: 'all 0.2s ease',
    minWidth: '2.5rem',
  },

  triggerHover: {
    backgroundColor: 'var(--hover-bg, #f9fafb)',
    borderColor: 'var(--border-hover-color, #d1d5db)',
  },

  triggerDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  triggerCompact: {
    padding: '0.5rem',
  },

  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    marginTop: '0.25rem',
    minWidth: '12rem',
    backgroundColor: 'var(--dropdown-bg, #ffffff)',
    border: '1px solid var(--border-color, #e5e7eb)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 50,
    overflow: 'hidden',
  },

  dropdownStart: {
    left: 0,
  },

  dropdownEnd: {
    right: 0,
  },

  dropdownCenter: {
    left: '50%',
    transform: 'translateX(-50%)',
  },

  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.625rem 0.875rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: 'var(--text-color, #374151)',
    textAlign: 'start' as const,
    transition: 'background-color 0.15s ease',
  },

  optionHover: {
    backgroundColor: 'var(--option-hover-bg, #f3f4f6)',
  },

  optionSelected: {
    backgroundColor: 'var(--option-selected-bg, #eff6ff)',
    color: 'var(--option-selected-color, #2563eb)',
    fontWeight: 600,
  },

  flag: {
    fontSize: '1.25rem',
    lineHeight: 1,
  },

  languageInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.125rem',
    flex: 1,
  },

  nativeName: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },

  englishName: {
    fontSize: '0.75rem',
    color: 'var(--text-muted, #6b7280)',
  },

  checkmark: {
    marginInlineStart: 'auto',
    color: 'var(--checkmark-color, #2563eb)',
    fontSize: '1rem',
  },

  chevron: {
    transition: 'transform 0.2s ease',
    fontSize: '0.75rem',
    color: 'var(--chevron-color, #6b7280)',
  },

  chevronOpen: {
    transform: 'rotate(180deg)',
  },

  srOnly: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    borderWidth: 0,
  },
};

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Checkmark icon for selected option
 */
const CheckIcon = (): React.ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    width="1em"
    height="1em"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Chevron icon for dropdown trigger
 */
const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }): React.ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    width="1em"
    height="1em"
    aria-hidden="true"
    style={{
      ...styles.chevron,
      ...(isOpen ? styles.chevronOpen : {}),
    }}
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Globe icon for compact mode
 */
const GlobeIcon = (): React.ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    width="1.25em"
    height="1.25em"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Individual language option in the dropdown
 */
const LanguageOption = ({
  locale,
  isSelected,
  showNativeName,
  showFlag,
  onClick,
}: LanguageOptionProps): React.ReactElement => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.option,
        ...(isHovered ? styles.optionHover : {}),
        ...(isSelected ? styles.optionSelected : {}),
      }}
      role="menuitem"
      aria-current={isSelected ? 'true' : undefined}
      dir={locale.direction}
    >
      {showFlag && <span style={styles.flag}>{locale.flag}</span>}

      <span style={styles.languageInfo}>
        {showNativeName ? (
          <>
            <span style={styles.nativeName}>{locale.nativeName}</span>
            {locale.name !== locale.nativeName && (
              <span style={styles.englishName}>{locale.name}</span>
            )}
          </>
        ) : (
          <span style={styles.nativeName}>{locale.name}</span>
        )}
      </span>

      {isSelected && (
        <span style={styles.checkmark}>
          <CheckIcon />
        </span>
      )}
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * LanguageSwitcher - A comprehensive language selector component
 *
 * Provides a dropdown interface for switching between supported locales
 * with automatic RTL direction handling and persistent selection.
 */
export const LanguageSwitcher = ({
  className,
  style,
  onLocaleChange: onLocaleChangeProp,
  compact = false,
  showNativeName = true,
  showFlag = true,
  trigger,
  align = 'start',
  disabled = false,
  ariaLabel,
}: LanguageSwitcherProps): React.ReactElement => {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(getCurrentLocale);
  const [isHovered, setIsHovered] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Get available locales
  const locales = getAvailableLocales();
  const currentConfig = locales.find((l) => l.code === currentLocale) ?? locales[0];

  // Calculate RTL-aware alignment
  const rtl = isRTL();
  const getAlignmentStyle = useCallback(() => {
    if (align === 'center') return styles.dropdownCenter;

    // In RTL, start becomes right and end becomes left
    if (rtl) {
      return align === 'start' ? styles.dropdownEnd : styles.dropdownStart;
    }
    return align === 'start' ? styles.dropdownStart : styles.dropdownEnd;
  }, [align, rtl]);

  // Handle locale change
  const handleLocaleChange = useCallback(
    (locale: SupportedLocale) => {
      setLocale(locale);
      setCurrentLocale(locale);
      setIsOpen(false);
      onLocaleChangeProp?.(locale);
    },
    [onLocaleChangeProp]
  );

  // Subscribe to external locale changes
  useEffect(() => {
    const unsubscribe = onLocaleChange((event: LanguageChangeEvent) => {
      setCurrentLocale(event.newLocale);
    });
    return unsubscribe;
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Toggle dropdown
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Render trigger content
  const renderTriggerContent = () => {
    if (trigger) return trigger;

    if (compact) {
      return (
        <>
          {showFlag ? (
            <span style={styles.flag}>{currentConfig.flag}</span>
          ) : (
            <GlobeIcon />
          )}
        </>
      );
    }

    return (
      <>
        {showFlag && <span style={styles.flag}>{currentConfig.flag}</span>}
        <span>
          {showNativeName ? currentConfig.nativeName : currentConfig.name}
        </span>
        <ChevronDownIcon isOpen={isOpen} />
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...styles.container, ...style }}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...styles.trigger,
          ...(compact ? styles.triggerCompact : {}),
          ...(isHovered && !disabled ? styles.triggerHover : {}),
          ...(disabled ? styles.triggerDisabled : {}),
        }}
        disabled={disabled}
        aria-label={ariaLabel ?? `Select language. Current: ${currentConfig.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {renderTriggerContent()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            ...styles.dropdown,
            ...getAlignmentStyle(),
          }}
          role="menu"
          aria-label="Language options"
        >
          {locales.map((locale) => (
            <LanguageOption
              key={locale.code}
              locale={locale}
              isSelected={locale.code === currentLocale}
              showNativeName={showNativeName}
              showFlag={showFlag}
              onClick={() => handleLocaleChange(locale.code)}
            />
          ))}
        </div>
      )}

      {/* Screen reader announcement */}
      <span style={styles.srOnly} aria-live="polite" role="status">
        {isOpen ? 'Language menu expanded' : ''}
      </span>
    </div>
  );
};

// ============================================================================
// Variants
// ============================================================================

/**
 * Compact language switcher showing only the flag
 */
export const CompactLanguageSwitcher = (
  props: Omit<LanguageSwitcherProps, 'compact'>
): React.ReactElement => <LanguageSwitcher {...props} compact />;

/**
 * Language switcher without flags (text only)
 */
export const TextOnlyLanguageSwitcher = (
  props: Omit<LanguageSwitcherProps, 'showFlag'>
): React.ReactElement => <LanguageSwitcher {...props} showFlag={false} />;

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access current locale and change function
 */
export const useLanguageSwitcher = () => {
  const [locale, setLocaleState] = useState<SupportedLocale>(getCurrentLocale);

  useEffect(() => {
    const unsubscribe = onLocaleChange((event: LanguageChangeEvent) => {
      setLocaleState(event.newLocale);
    });
    return unsubscribe;
  }, []);

  const changeLocale = useCallback((newLocale: SupportedLocale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return {
    locale,
    setLocale: changeLocale,
    isRTL: isRTL(),
    locales: getAvailableLocales(),
  };
};

// Default export
export default LanguageSwitcher;
