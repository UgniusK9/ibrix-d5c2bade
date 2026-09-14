import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Search, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parsePhoneNumberFromString, isValidPhoneNumber, CountryCode } from "libphonenumber-js";

interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

// Country names are resolved at render via Intl.DisplayNames so they follow
// the active UI language — no per-country translation keys needed.
const COUNTRY_META: Array<{ code: CountryCode; dialCode: string; flag: string }> = [
  { code: "LT", dialCode: "+370", flag: "🇱🇹" },
  { code: "LV", dialCode: "+371", flag: "🇱🇻" },
  { code: "PL", dialCode: "+48", flag: "🇵🇱" },
  { code: "EE", dialCode: "+372", flag: "🇪🇪" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", dialCode: "+32", flag: "🇧🇪" },
  { code: "AT", dialCode: "+43", flag: "🇦🇹" },
  { code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { code: "CZ", dialCode: "+420", flag: "🇨🇿" },
  { code: "SK", dialCode: "+421", flag: "🇸🇰" },
  { code: "HU", dialCode: "+36", flag: "🇭🇺" },
  { code: "RO", dialCode: "+40", flag: "🇷🇴" },
  { code: "BG", dialCode: "+359", flag: "🇧🇬" },
  { code: "HR", dialCode: "+385", flag: "🇭🇷" },
  { code: "SI", dialCode: "+386", flag: "🇸🇮" },
  { code: "FI", dialCode: "+358", flag: "🇫🇮" },
  { code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", dialCode: "+47", flag: "🇳🇴" },
  { code: "DK", dialCode: "+45", flag: "🇩🇰" },
  { code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { code: "GR", dialCode: "+30", flag: "🇬🇷" },
  { code: "UA", dialCode: "+380", flag: "🇺🇦" },
  { code: "BY", dialCode: "+375", flag: "🇧🇾" },
  { code: "RU", dialCode: "+7", flag: "🇷🇺" },
  { code: "US", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦" },
];

const PREFERRED_CODES: CountryCode[] = ["LT", "LV", "PL", "EE"];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  onValidationChange,
  placeholder,
  disabled = false,
  className,
}: PhoneInputProps) {
  const { t, i18n } = useTranslation();
  const displayLocale = i18n.language?.toLowerCase().startsWith("lt") ? "lt-LT" : "en-US";
  const regionNames = useMemo(
    () => new Intl.DisplayNames([displayLocale], { type: "region" }),
    [displayLocale]
  );
  const allCountries: Country[] = useMemo(
    () =>
      COUNTRY_META.map((m) => ({
        ...m,
        name: regionNames.of(m.code) ?? m.code,
      })),
    [regionNames]
  );
  const preferredCountries: Country[] = useMemo(
    () =>
      PREFERRED_CODES.map((code) => allCountries.find((c) => c.code === code)).filter(
        (c): c is Country => Boolean(c)
      ),
    [allCountries]
  );
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => ({
    ...COUNTRY_META[0],
    name: regionNames.of(COUNTRY_META[0].code) ?? COUNTRY_META[0].code,
  }));
  const [nationalNumber, setNationalNumber] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputPlaceholder = placeholder ?? t("coPhone.numberPh");

  useEffect(() => {
    if (value && value.startsWith("+")) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed) {
        const meta = COUNTRY_META.find(c => c.code === parsed.country);
        if (meta) {
          setSelectedCountry({
            ...meta,
            name: new Intl.DisplayNames([displayLocale], { type: "region" }).of(meta.code) ?? meta.code,
          });
          setNationalNumber(parsed.nationalNumber);
          return;
        }
      }
    }
    // Re-run when UI language changes so the country name is re-localized.
  }, [displayLocale]);

  useEffect(() => {
    const e164 = nationalNumber 
      ? `${selectedCountry.dialCode}${nationalNumber.replace(/\s/g, '')}`
      : "";
    
    if (e164 !== value) {
      onChange(e164);
    }
    
    if (nationalNumber) {
      const valid = nationalNumber.length >= 6 && isValidPhoneNumber(e164, selectedCountry.code);
      setIsValid(valid);
      onValidationChange?.(valid);
    } else {
      setIsValid(true);
      onValidationChange?.(true);
    }
  }, [selectedCountry, nationalNumber]);

  const handleNationalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setNationalNumber(digits);
    setTouched(true);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
  };

  const filteredCountries = search 
    ? allCountries.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : allCountries;

  const hasError = touched && !isValid && nationalNumber.length > 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "flex items-center gap-1 px-3 border border-r-0 rounded-l-md bg-muted/50 hover:bg-muted transition-colors",
                "border-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                hasError && "border-destructive",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm text-muted-foreground">{selectedCountry.dialCode}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("coPhone.searchPh")}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {!search && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                    {t("coPhone.popular")}
                  </div>
                  {preferredCountries.map((country) => (
                    <CountryRow
                      key={`preferred-${country.code}`}
                      country={country}
                      isSelected={selectedCountry.code === country.code}
                      onSelect={handleCountrySelect}
                    />
                  ))}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-t">
                    {t("coPhone.all")}
                  </div>
                </>
              )}
              
              {filteredCountries.map((country) => (
                <CountryRow
                  key={country.code}
                  country={country}
                  isSelected={selectedCountry.code === country.code}
                  onSelect={handleCountrySelect}
                />
              ))}
              
              {filteredCountries.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  {t("coPhone.empty")}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        <Input
          type="tel"
          inputMode="numeric"
          value={nationalNumber}
          onChange={handleNationalNumberChange}
          placeholder={inputPlaceholder}
          disabled={disabled}
          className={cn("rounded-l-none flex-1", hasError && "border-destructive")}
        />
      </div>
      
      {hasError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {t("checkout.invalidPhone")}
        </p>
      )}
    </div>
  );
}

interface CountryRowProps {
  country: Country;
  isSelected: boolean;
  onSelect: (country: Country) => void;
}

function CountryRow({ country, isSelected, onSelect }: CountryRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(country)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/10"
      )}
    >
      <span className="text-lg">{country.flag}</span>
      <span className="flex-1 text-sm">{country.name}</span>
      <span className="text-sm text-muted-foreground">{country.dialCode}</span>
      {isSelected && <Check className="w-4 h-4 text-primary" />}
    </button>
  );
}
