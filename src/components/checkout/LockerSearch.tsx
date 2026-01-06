import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface LockerTerminal {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  carrier: 'omniva' | 'lp_express' | 'dpd';
  lat?: number;
  lng?: number;
}

interface LockerSearchProps {
  shippingMethod: string;
  selectedLocker: LockerTerminal | null;
  onSelect: (locker: LockerTerminal) => void;
}

// Get carrier from shipping method
function getCarrierFromMethod(shippingMethod: string): 'omniva' | 'lp_express' | 'dpd' | null {
  if (shippingMethod === 'omniva_locker') return 'omniva';
  if (shippingMethod === 'lp_express_locker') return 'lp_express';
  if (shippingMethod === 'dpd_locker') return 'dpd';
  return null;
}

export function LockerSearch({ shippingMethod, selectedLocker, onSelect }: LockerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LockerTerminal[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const carrier = getCarrierFromMethod(shippingMethod);

  // Fetch terminals from API
  useEffect(() => {
    if (!carrier) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Debounce the API call
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parcel-terminals?carrier=${carrier}&q=${encodeURIComponent(query)}`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          setResults(result.terminals || []);
          setIsOpen((result.terminals || []).length > 0);
        }
      } catch (err) {
        console.error('Failed to fetch terminals:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, carrier]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (terminal: LockerTerminal) => {
    onSelect(terminal);
    setQuery('');
    setIsOpen(false);
  };

  const getCarrierLabel = () => {
    switch (carrier) {
      case 'omniva': return 'Omniva';
      case 'lp_express': return 'LP EXPRESS';
      case 'dpd': return 'DPD';
      default: return '';
    }
  };

  if (!carrier) return null;

  return (
    <div ref={containerRef} className="relative space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        Pasirinkite {getCarrierLabel()} paštomatą *
      </Label>

      {/* Selected locker display */}
      {selectedLocker && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{selectedLocker.name}</p>
              <p className="text-sm text-muted-foreground">{selectedLocker.address}, {selectedLocker.city}</p>
              <p className="text-xs text-muted-foreground">{selectedLocker.postalCode}</p>
            </div>
            <Badge variant="outline" className="flex-shrink-0 text-xs border-primary/30 text-primary">
              <Check className="w-3 h-3 mr-1" />
              Pasirinkta
            </Badge>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Įveskite miestą arba adresą..."
          className="pl-10 pr-10"
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : query.length > 0 && (
          <ChevronDown 
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} 
          />
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((terminal) => (
            <button
              key={terminal.id}
              type="button"
              onClick={() => handleSelect(terminal)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0",
                selectedLocker?.id === terminal.id && "bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{terminal.name}</p>
                  <p className="text-sm text-muted-foreground">{terminal.address}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{terminal.city}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {query.length >= 2 && !isLoading && results.length === 0 && (
        <p className="text-sm text-muted-foreground px-1">
          Nerasta paštomatų pagal „{query}"
        </p>
      )}

      {/* Hint when no query */}
      {!selectedLocker && query.length < 2 && (
        <p className="text-xs text-muted-foreground px-1">
          Pradėkite rašyti miestą, pvz. „Vilnius", „Kaunas", „Klaipėda"
        </p>
      )}
    </div>
  );
}
