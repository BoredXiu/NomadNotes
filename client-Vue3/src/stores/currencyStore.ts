import { defineStore } from "pinia";
import { ref } from "vue";

const DEFAULT_CURRENCY = "CNY";

function loadInitialCurrency(): string {
  try {
    const saved = localStorage.getItem("preferredCurrency");
    if (saved) return saved;
  } catch {
    // ignore
  }
  return DEFAULT_CURRENCY;
}

function loadCachedRates(): Record<string, number> | null {
  try {
    const saved = localStorage.getItem("currencyRates");
    const timestamp = localStorage.getItem("currencyRatesTimestamp");
    if (saved && timestamp) {
      const age = Date.now() - Number(timestamp);
      if (age < 60 * 60 * 1000) {
        return JSON.parse(saved);
      }
    }
  } catch {
    // ignore
  }
  return null;
}

const SYMBOL_MAP: Record<string, string> = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
};

export const useCurrencyStore = defineStore("currency", () => {
  const currency = ref<string>(loadInitialCurrency());
  const rates = ref<Record<string, number>>(
    loadCachedRates() || { CNY: 1 },
  );
  const loading = ref(false);

  function setCurrency(code: string) {
    localStorage.setItem("preferredCurrency", code);
    currency.value = code;
  }

  function setRates(newRates: Record<string, number>) {
    localStorage.setItem("currencyRates", JSON.stringify(newRates));
    localStorage.setItem("currencyRatesTimestamp", String(Date.now()));
    rates.value = newRates;
  }

  function setLoading(val: boolean) {
    loading.value = val;
  }

  function getCurrencySymbol(code?: string): string {
    const c = code || currency.value;
    return SYMBOL_MAP[c] || c;
  }

  function convertAmount(
    amount: number,
    fromCurrency = "CNY",
  ): number {
    const to = currency.value;
    if (to === fromCurrency) return amount;
    if (!rates.value[fromCurrency] || !rates.value[to]) return amount;

    const amountInCNY = amount / rates.value[fromCurrency];
    const converted = amountInCNY * rates.value[to];

    if (to === "JPY") return Math.round(converted);
    return Math.round(converted * 100) / 100;
  }

  return {
    currency,
    rates,
    loading,
    setCurrency,
    setRates,
    setLoading,
    getCurrencySymbol,
    convertAmount,
  };
});