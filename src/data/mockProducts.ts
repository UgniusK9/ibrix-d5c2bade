// Demo produktai, kol Shopify parduotuvėje nėra realių produktų
export interface MockProduct {
  id: string;
  handle: string;
  title: string;
  title_en?: string | null;
  description: string;
  description_en?: string | null;
  price: number;
  currency: string;
  status: 'pre-order' | 'in-stock';
  detailsCount: number;
  eta: string;
  image: string;
  sku: string;
}

export const mockProducts: MockProduct[] = [
  {
    id: "1",
    handle: "v8-twin-turbo",
    title: "V8 Twin-Turbo variklis",
    title_en: "V8 Twin-Turbo engine",
    description: "Galingas V8 twin-turbo variklio modelis su realiai judančiais stūmokliais, alkūniniu velenu ir turbo sistema. Idealus kolekcijai ar demonstruojamas ant stalo.",
    description_en: "Powerful V8 twin-turbo engine model with truly moving pistons, crankshaft and turbo system. Ideal for a collection or desk display.",
    price: 189.99,
    currency: "EUR",
    status: "pre-order",
    detailsCount: 2899,
    eta: "8–10 sav.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
    sku: "ORB-V8TT-10168",
  },
  {
    id: "2",
    handle: "flat-6-boxer",
    title: "Flat-6 Boxer variklis",
    title_en: "Flat-6 Boxer engine",
    description: "Klasikinis horizontaliai priešpriešinis bokserio variklis su 6 cilindrais. Mechanizmas atspindi legendinį Porsche variklio dizainą.",
    description_en: "Classic horizontally-opposed 6-cylinder boxer engine. The mechanism reflects the legendary Porsche engine design.",
    price: 164.99,
    currency: "EUR",
    status: "pre-order",
    detailsCount: 2156,
    eta: "8–10 sav.",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop",
    sku: "ORB-F6BX-10169",
  },
  {
    id: "3",
    handle: "inline-4-turbo",
    title: "Inline-4 Turbo variklis",
    title_en: "Inline-4 Turbo engine",
    description: "Kompaktiškas 4 cilindrų eilinis variklis su turbo pakrovėju. Puikus pasirinkimas pradedantiesiems kolekcininkams.",
    description_en: "Compact 4-cylinder inline engine with turbocharger. A great choice for beginning collectors.",
    price: 119.99,
    currency: "EUR",
    status: "in-stock",
    detailsCount: 1456,
    eta: "1–2 d.d.",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=600&fit=crop",
    sku: "ORB-I4TB-10170",
  },
  {
    id: "4",
    handle: "w16-hypercar",
    title: "W16 Hypercar variklis",
    title_en: "W16 Hypercar engine",
    description: "Unikalus W16 konfigūracijos variklis, įkvėptas Bugatti hiperautomobilių. Premium kolekcinė versija su detaliausia mechanika.",
    description_en: "Unique W16-configuration engine inspired by Bugatti hypercars. Premium collector's edition with the most detailed mechanics.",
    price: 289.99,
    currency: "EUR",
    status: "pre-order",
    detailsCount: 4200,
    eta: "10–12 sav.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop",
    sku: "ORB-W16H-10171",
  },
  {
    id: "5",
    handle: "v12-supercar",
    title: "V12 Supercar variklis",
    title_en: "V12 Supercar engine",
    description: "Didingasis V12 variklio modelis su 12 judančių stūmoklių ir išsamia išmetimo sistema. Sukurtas Ferrari ir Lamborghini gerbėjams.",
    description_en: "The magnificent V12 engine model with 12 moving pistons and a detailed exhaust system. Built for Ferrari and Lamborghini fans.",
    price: 229.99,
    currency: "EUR",
    status: "pre-order",
    detailsCount: 3456,
    eta: "8–10 sav.",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=600&fit=crop",
    sku: "ORB-V12S-10172",
  },
];

export function getMockProduct(handle: string): MockProduct | undefined {
  return mockProducts.find(p => p.handle === handle);
}

export function formatMockPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: currency,
  }).format(price);
}
