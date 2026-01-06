import { useState, useEffect, useRef } from "react";
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

const PREFERRED_COUNTRIES: Country[] = [
  { code: "LT", name: "Lietuva", dialCode: "+370", flag: "🇱🇹" },
  { code: "LV", name: "Latvija", dialCode: "+371", flag: "🇱🇻" },
  { code: "PL", name: "Lenkija", dialCode: "+48", flag: "🇵🇱" },
  { code: "EE", name: "Estija", dialCode: "+372", flag: "🇪🇪" },
];

const ALL_COUNTRIES: Country[] = [
  { code: "LT", name: "Lietuva", dialCode: "+370", flag: "🇱🇹" },
  { code: "LV", name: "Latvija", dialCode: "+371", flag: "🇱🇻" },
  { code: "PL", name: "Lenkija", dialCode: "+48", flag: "🇵🇱" },
  { code: "EE", name: "Estija", dialCode: "+372", flag: "🇪🇪" },
  { code: "DE", name: "Vokietija", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "Prancūzija", dialCode: "+33", flag: "🇫🇷" },
  { code: "GB", name: "Jungtinė Karalystė", dialCode: "+44", flag: "🇬🇧" },
  { code: "IT", name: "Italija", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Ispanija", dialCode: "+34", flag: "🇪🇸" },
  { code: "NL", name: "Nyderlandai", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgija", dialCode: "+32", flag: "🇧🇪" },
  { code: "AT", name: "Austrija", dialCode: "+43", flag: "🇦🇹" },
  { code: "CH", name: "Šveicarija", dialCode: "+41", flag: "🇨🇭" },
  { code: "CZ", name: "Čekija", dialCode: "+420", flag: "🇨🇿" },
  { code: "SK", name: "Slovakija", dialCode: "+421", flag: "🇸🇰" },
  { code: "HU", name: "Vengrija", dialCode: "+36", flag: "🇭🇺" },
  { code: "RO", name: "Rumunija", dialCode: "+40", flag: "🇷🇴" },
  { code: "BG", name: "Bulgarija", dialCode: "+359", flag: "🇧🇬" },
  { code: "HR", name: "Kroatija", dialCode: "+385", flag: "🇭🇷" },
  { code: "SI", name: "Slovėnija", dialCode: "+386", flag: "🇸🇮" },
  { code: "FI", name: "Suomija", dialCode: "+358", flag: "🇫🇮" },
  { code: "SE", name: "Švedija", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norvegija", dialCode: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Danija", dialCode: "+45", flag: "🇩🇰" },
  { code: "IE", name: "Airija", dialCode: "+353", flag: "🇮🇪" },
  { code: "PT", name: "Portugalija", dialCode: "+351", flag: "🇵🇹" },
  { code: "GR", name: "Graikija", dialCode: "+30", flag: "🇬🇷" },
  { code: "UA", name: "Ukraina", dialCode: "+380", flag: "🇺🇦" },
  { code: "BY", name: "Baltarusija", dialCode: "+375", flag: "🇧🇾" },
  { code: "RU", name: "Rusija", dialCode: "+7", flag: "🇷🇺" },
  { code: "US", name: "JAV", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Kanada", dialCode: "+1", flag: "🇨🇦" },
];

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
  placeholder = "Telefono numeris",
  disabled = false,
  className,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(PREFERRED_COUNTRIES[0]);
  const [nationalNumber, setNationalNumber] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && value.startsWith("+")) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed) {
        const country = ALL_COUNTRIES.find(c => c.code === parsed.country);
        if (country) {
          setSelectedCountry(country);
          setNationalNumber(parsed.nationalNumber);
          return;
        }
      }
    }
  }, []);

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
    ? ALL_COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_COUNTRIES;

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
                  placeholder="Ieškoti šalies..."
                  className="pl-8 h-9"
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {!search && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                    Populiariausios
                  </div>
                  {PREFERRED_COUNTRIES.map((country) => (
                    <CountryRow
                      key={`preferred-${country.code}`}
                      country={country}
                      isSelected={selectedCountry.code === country.code}
                      onSelect={handleCountrySelect}
                    />
                  ))}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-t">
                    Visos šalys
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
                  Šalis nerasta
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
          placeholder={placeholder}
          disabled={disabled}
          className={cn("rounded-l-none flex-1", hasError && "border-destructive")}
        />
      </div>
      
      {hasError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Neteisingas telefono numeris
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
