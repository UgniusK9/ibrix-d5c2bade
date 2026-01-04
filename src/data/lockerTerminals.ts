// Mock parcel locker terminals data for Lithuania
// This will be replaced with real API integration later

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

export const lockerTerminals: LockerTerminal[] = [
  // Omniva terminals
  { id: 'OMN-VIL-001', name: 'Vilnius Akropolis', address: 'Ozo g. 25', city: 'Vilnius', postalCode: 'LT-07150', carrier: 'omniva', lat: 54.7134, lng: 25.2641 },
  { id: 'OMN-VIL-002', name: 'Vilnius CUP', address: 'Upės g. 9', city: 'Vilnius', postalCode: 'LT-08128', carrier: 'omniva', lat: 54.6932, lng: 25.2798 },
  { id: 'OMN-VIL-003', name: 'Vilnius Panorama', address: 'Saltoniškių g. 9', city: 'Vilnius', postalCode: 'LT-08105', carrier: 'omniva', lat: 54.6997, lng: 25.2634 },
  { id: 'OMN-VIL-004', name: 'Vilnius Senukai Ukmergės', address: 'Ukmergės g. 282', city: 'Vilnius', postalCode: 'LT-06115', carrier: 'omniva', lat: 54.7287, lng: 25.2891 },
  { id: 'OMN-VIL-005', name: 'Vilnius IKI Fabijoniškės', address: 'S. Stanevičiaus g. 14', city: 'Vilnius', postalCode: 'LT-07103', carrier: 'omniva', lat: 54.7312, lng: 25.2456 },
  { id: 'OMN-KAU-001', name: 'Kaunas Akropolis', address: 'Karaliaus Mindaugo pr. 49', city: 'Kaunas', postalCode: 'LT-44333', carrier: 'omniva', lat: 54.8898, lng: 23.9198 },
  { id: 'OMN-KAU-002', name: 'Kaunas Mega', address: 'Islandijos pl. 32', city: 'Kaunas', postalCode: 'LT-47446', carrier: 'omniva', lat: 54.9102, lng: 23.9567 },
  { id: 'OMN-KAU-003', name: 'Kaunas IKI Savanorių', address: 'Savanorių pr. 346', city: 'Kaunas', postalCode: 'LT-49476', carrier: 'omniva', lat: 54.8756, lng: 23.8912 },
  { id: 'OMN-KLP-001', name: 'Klaipėda Akropolis', address: 'Taikos pr. 61', city: 'Klaipėda', postalCode: 'LT-91182', carrier: 'omniva', lat: 55.7068, lng: 21.1345 },
  { id: 'OMN-KLP-002', name: 'Klaipėda BIG', address: 'Šilutės pl. 31', city: 'Klaipėda', postalCode: 'LT-95112', carrier: 'omniva', lat: 55.6987, lng: 21.1567 },
  { id: 'OMN-SIA-001', name: 'Šiauliai Akropolis', address: 'Aido g. 8', city: 'Šiauliai', postalCode: 'LT-78313', carrier: 'omniva', lat: 55.9342, lng: 23.3145 },
  { id: 'OMN-PAN-001', name: 'Panevėžys IKI', address: 'Klaipėdos g. 143', city: 'Panevėžys', postalCode: 'LT-35209', carrier: 'omniva', lat: 55.7234, lng: 24.3678 },

  // LP Express terminals
  { id: 'LP-VIL-001', name: 'Vilnius Gedimino IKI', address: 'Gedimino pr. 28', city: 'Vilnius', postalCode: 'LT-01104', carrier: 'lp_express', lat: 54.6892, lng: 25.2698 },
  { id: 'LP-VIL-002', name: 'Vilnius Maxima Ozo', address: 'Ozo g. 18', city: 'Vilnius', postalCode: 'LT-07156', carrier: 'lp_express', lat: 54.7089, lng: 25.2601 },
  { id: 'LP-VIL-003', name: 'Vilnius Rimi Pilaitė', address: 'Pilaitės pr. 16', city: 'Vilnius', postalCode: 'LT-04352', carrier: 'lp_express', lat: 54.7156, lng: 25.1923 },
  { id: 'LP-VIL-004', name: 'Vilnius Europa', address: 'Konstitucijos pr. 7A', city: 'Vilnius', postalCode: 'LT-09308', carrier: 'lp_express', lat: 54.6956, lng: 25.2678 },
  { id: 'LP-KAU-001', name: 'Kaunas Maxima Centras', address: 'K. Donelaičio g. 62', city: 'Kaunas', postalCode: 'LT-44248', carrier: 'lp_express', lat: 54.8978, lng: 23.9234 },
  { id: 'LP-KAU-002', name: 'Kaunas Urmas', address: 'Pramonės pr. 16', city: 'Kaunas', postalCode: 'LT-51316', carrier: 'lp_express', lat: 54.9234, lng: 23.9678 },
  { id: 'LP-KLP-001', name: 'Klaipėda Maxima Baltijos', address: 'Baltijos pr. 71', city: 'Klaipėda', postalCode: 'LT-94132', carrier: 'lp_express', lat: 55.7156, lng: 21.1234 },
  { id: 'LP-KLP-002', name: 'Klaipėda IKI Debreceno', address: 'Debreceno g. 46', city: 'Klaipėda', postalCode: 'LT-94178', carrier: 'lp_express', lat: 55.7234, lng: 21.1456 },
  { id: 'LP-SIA-001', name: 'Šiauliai Maxima Arena', address: 'Aušros al. 47', city: 'Šiauliai', postalCode: 'LT-76233', carrier: 'lp_express', lat: 55.9312, lng: 23.3234 },
  { id: 'LP-PAN-001', name: 'Panevėžys Rimi', address: 'Puzino g. 1', city: 'Panevėžys', postalCode: 'LT-35173', carrier: 'lp_express', lat: 55.7312, lng: 24.3456 },

  // DPD terminals
  { id: 'DPD-VIL-001', name: 'Vilnius Norfa Antakalnis', address: 'Antakalnio g. 40', city: 'Vilnius', postalCode: 'LT-10305', carrier: 'dpd', lat: 54.6845, lng: 25.3012 },
  { id: 'DPD-VIL-002', name: 'Vilnius Rimi Žirmūnai', address: 'Žirmūnų g. 64', city: 'Vilnius', postalCode: 'LT-09210', carrier: 'dpd', lat: 54.7123, lng: 25.2856 },
  { id: 'DPD-VIL-003', name: 'Vilnius Lidl Kalvarijų', address: 'Kalvarijų g. 145', city: 'Vilnius', postalCode: 'LT-08209', carrier: 'dpd', lat: 54.7234, lng: 25.2934 },
  { id: 'DPD-KAU-001', name: 'Kaunas Norfa Aleksotas', address: 'Veiverių g. 150', city: 'Kaunas', postalCode: 'LT-46391', carrier: 'dpd', lat: 54.8645, lng: 23.8934 },
  { id: 'DPD-KAU-002', name: 'Kaunas Lidl Šilainiai', address: 'Baltų pr. 53', city: 'Kaunas', postalCode: 'LT-48236', carrier: 'dpd', lat: 54.9178, lng: 23.8756 },
  { id: 'DPD-KLP-001', name: 'Klaipėda Norfa Mažvydo', address: 'Mažvydo al. 4', city: 'Klaipėda', postalCode: 'LT-91101', carrier: 'dpd', lat: 55.7089, lng: 21.1389 },
  { id: 'DPD-SIA-001', name: 'Šiauliai Lidl Tilžės', address: 'Tilžės g. 109', city: 'Šiauliai', postalCode: 'LT-78118', carrier: 'dpd', lat: 55.9267, lng: 23.3178 },
  { id: 'DPD-PAN-001', name: 'Panevėžys Norfa Smėlynė', address: 'Smėlynės g. 40', city: 'Panevėžys', postalCode: 'LT-35143', carrier: 'dpd', lat: 55.7289, lng: 24.3589 },
];

// Get carrier from shipping method
export function getCarrierFromMethod(shippingMethod: string): 'omniva' | 'lp_express' | 'dpd' | null {
  if (shippingMethod === 'omniva_locker') return 'omniva';
  if (shippingMethod === 'lp_express_locker') return 'lp_express';
  if (shippingMethod === 'dpd_locker') return 'dpd';
  return null;
}

// Search terminals by city/name/address
export function searchTerminals(query: string, carrier: 'omniva' | 'lp_express' | 'dpd'): LockerTerminal[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return lockerTerminals
    .filter(t => t.carrier === carrier)
    .filter(t => 
      t.city.toLowerCase().includes(normalizedQuery) ||
      t.name.toLowerCase().includes(normalizedQuery) ||
      t.address.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 10); // Limit results
}

// Get all terminals for a carrier in a city
export function getTerminalsByCity(city: string, carrier: 'omniva' | 'lp_express' | 'dpd'): LockerTerminal[] {
  return lockerTerminals.filter(
    t => t.carrier === carrier && t.city.toLowerCase() === city.toLowerCase()
  );
}
