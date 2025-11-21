import { useState, useEffect } from "react";

export interface UserSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
}

const defaultSettings: UserSettings = {
  timezone: "UTC-5",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
};

// Fixed exchange rates (as of Nov 18, 2025, 19:18 UTC)
// Base rates from USD, all others calculated to ensure consistency
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1.0, EUR: 0.86313, GBP: 0.76028, CAD: 1.398, PKR: 281.909 },
  EUR: { USD: 1.15861, EUR: 1.0, GBP: 0.88084, CAD: 1.61981, PKR: 326.577 },
  GBP: { USD: 1.31518, EUR: 1.13533, GBP: 1.0, CAD: 1.83861, PKR: 370.705 },
  CAD: { USD: 0.71531, EUR: 0.61739, GBP: 0.54396, CAD: 1.0, PKR: 201.651 },
  PKR: { USD: 0.00355, EUR: 0.00306, GBP: 0.0027, CAD: 0.00496, PKR: 1.0 },
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem("userSettings");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent<UserSettings>) => {
      setSettings(event.detail);
    };

    window.addEventListener(
      "userSettingsChanged",
      handleSettingsChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "userSettingsChanged",
        handleSettingsChange as EventListener
      );
    };
  }, []);

  const formatCurrency = (
    amount: number,
    originalCurrency: string = "USD"
  ): string => {
    const currencySymbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "$",
      PKR: "Rs",
    };

    // Direct conversion using cross-currency rates
    const conversionRate =
      EXCHANGE_RATES[originalCurrency]?.[settings.currency] || 1;
    const convertedAmount = amount * conversionRate;

    const symbol = currencySymbols[settings.currency] || "$";
    return `${symbol}${convertedAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();

    if (settings.dateFormat === "DD/MM/YYYY") {
      return `${day}/${month}/${year}`;
    }
    return `${month}/${day}/${year}`; // MM/DD/YYYY
  };

  const getTimezoneOffset = (): number => {
    // Extract offset from timezone string (e.g., "UTC-5" -> -5)
    const match = settings.timezone.match(/UTC([+-]\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    return 0;
  };

  const formatDateWithTimezone = (date: string | Date): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const offset = getTimezoneOffset();
    const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 60 * 1000);

    return formatDate(adjustedDate);
  };

  const getCurrencySymbol = (): string => {
    const currencySymbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "$",
      PKR: "Rs",
    };
    return currencySymbols[settings.currency] || "$";
  };

  // Convert amount from one currency to another (returns number, not formatted string)
  const convertAmount = (
    amount: number,
    fromCurrency: string = "USD",
    toCurrency?: string
  ): number => {
    const targetCurrency = toCurrency || settings.currency;
    const conversionRate = EXCHANGE_RATES[fromCurrency]?.[targetCurrency] || 1;
    return amount * conversionRate;
  };

  // Format amount in current user currency (for already-converted amounts)
  const formatAmount = (amount: number): string => {
    const symbol = getCurrencySymbol();
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return {
    settings,
    formatCurrency,
    convertAmount,
    formatAmount,
    formatDate,
    formatDateWithTimezone,
    getTimezoneOffset,
    getCurrencySymbol,
  };
};
