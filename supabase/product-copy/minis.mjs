// Generates batch-minis.json for the small, near-identical series from minis-data*.json.
// kind: "car" (1:24 mini cars, default), "bot" (mini botanical), "street" (mini street scenes).
// Each item has its own hand-written hook where the fact is certain; the other sentences
// rotate through variants so the pages do not read identically.
// Run: node supabase/product-copy/minis.mjs   (then build.mjs)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const data = readdirSync(dir).filter((n) => /^minis-data.*\.json$/.test(n)).sort()
  .flatMap((n) => JSON.parse(readFileSync(join(dir, n), 'utf8')));

const POOLS = {
  car: {
    lt1: (c) => `${c.name} 1:24 mastelio mini modelis iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a 1:24 scale mini model in ${c.p} pieces.`,
    shortLt: (c) => `${c.name} mini automobilis 1:24 mastelio iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en} mini car in 1:24 scale, ${c.p} pieces.`,
    lt: [
      ['Kompaktiškas, bet detalus rinkinys automobilių kolekcijai.', 'Gerai atrodo ant lentynos ar darbo stalo.', 'Tinka tiems, kurie renka mini automobilius.', 'Nedidelis dydis tinka ir ankštesnei lentynai.'],
      ['Detalės iš ABS plastiko ir tinka kartu su kitų gamintojų kaladėlėmis.', 'Pagamintas iš ABS plastiko, o detales galima derinti su kitų gamintojų kaladėlėmis.', 'ABS plastiko detalės suderinamos su kitų gamintojų kaladėlėmis.'],
      ['Gera dovana automobilių mėgėjui.', 'Tinka kolekcininkui ir kaip dovana.', 'Gera dovana sportinių automobilių gerbėjui.'],
    ],
    en: [
      ['A compact but detailed set for a car collection.', 'It looks good on a shelf or desk.', 'For anyone who collects mini cars.', 'The small size suits a tighter shelf too.'],
      ['Parts are made of ABS plastic and work with other makers\' bricks.', 'Made of ABS plastic, and the parts can be combined with other makers\' bricks.', 'ABS plastic parts are compatible with other makers\' bricks.'],
      ['A good gift for a car fan.', 'Suits a collector and works as a gift.', 'A good gift for a sports car fan.'],
    ],
  },
  bot: {
    lt1: (c) => `${c.name}, mini botanikos rinkinys iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini botanical set in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini botanikos rinkinys iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini botanical set, ${c.p} pieces.`,
    lt: [
      ['Žiedlapiai ir lapai atkurti tikroviškai, o priežiūros nereikia.', 'Surinktas žiedas atrodo kaip tikras, bet nevysta ir nereikalauja priežiūros.', 'Mažas modelis, kuris nevysta ir nereikalauja priežiūros.'],
      ['Gerai tinka ant stalo ar palangės.', 'Puošia namus ar biurą.', 'Gražiai atrodo ant lentynos.'],
      ['Gera dovana gėlių mėgėjui.', 'Tinka kaip nedidelė dovana.', 'Gera dovana tiems, kuriems nesiseka su gyvomis gėlėmis.'],
    ],
    en: [
      ['Petals and leaves are recreated true to life, and it needs no care.', 'The finished bloom looks real, but it never wilts and needs no upkeep.', 'A small model that never wilts and needs no upkeep.'],
      ['It suits a desk or windowsill.', 'It decorates a home or office.', 'It looks good on a shelf.'],
      ['A good gift for a flower lover.', 'Works as a small gift.', 'A good gift for anyone who struggles with living flowers.'],
    ],
  },
  scene: {
    lt1: (c) => `${c.name}, mini scenos rinkinys iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini scene in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini scena iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini scene, ${c.p} pieces.`,
    lt: [
      ['Detali mini scena su smulkiais elementais.', 'Nedidelė scena, kurią galima eksponuoti ant lentynos.', 'Mažas, bet detalus rinkinys kolekcijai.'],
      ['Gerai atrodo ant stalo ar lentynos.', 'Puiki mini kolekcijos dalis.', 'Tinka tiems, kurie mėgsta mažas, detalias scenas.'],
      ['Detalės suderinamos su kitų gamintojų kaladėlėmis.', 'Tinka derinti su kitų gamintojų kaladėlėmis.', 'Suderinama su kitų gamintojų kaladėlėmis.'],
    ],
    en: [
      ['A detailed mini scene with small elements.', 'A small scene you can display on a shelf.', 'A small but detailed set for a collection.'],
      ['It looks good on a desk or shelf.', 'A fine part of a mini collection.', 'For anyone who likes small, detailed scenes.'],
      ['Parts are compatible with other makers\' bricks.', 'Works well with other makers\' bricks.', 'Compatible with other makers\' bricks.'],
    ],
  },
  air: {
    lt1: (c) => `${c.name}, mini aviacijos modelis iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini aviation model in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini aviacijos modelis iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini aviation model, ${c.p} pieces.`,
    lt: [
      ['Kompaktiškas modelis aviacijos technikos kolekcijai.', 'Nedidelis, bet detalus orlaivio modelis.', 'Mažas modelis, kuris gerai atrodo ant lentynos.'],
      ['Detalės iš ABS plastiko.', 'Pagamintas iš aukštos kokybės ABS plastiko.', 'ABS plastiko detalės.'],
      ['Tinka aviacijos mėgėjams ir kolekcininkams.', 'Gera dovana aviacijos gerbėjui.', 'Tinka kaip dovana lėktuvų ir sraigtasparnių mėgėjui.'],
    ],
    en: [
      ['A compact model for an aviation collection.', 'A small but detailed aircraft model.', 'A small model that looks good on a shelf.'],
      ['Parts are made of ABS plastic.', 'Made of high-quality ABS plastic.', 'ABS plastic parts.'],
      ['For aviation fans and collectors.', 'A good gift for an aviation fan.', 'Works as a gift for a fan of planes and helicopters.'],
    ],
  },
  build: {
    lt1: (c) => `${c.name}, mini statybinės technikos modelis iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini construction machine in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini statybinės technikos modelis iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini construction machine, ${c.p} pieces.`,
    lt: [
      ['Kompaktiškas modelis statybinių mašinų kolekcijai.', 'Nedidelis, bet detalus statybinės technikos modelis.', 'Mažas modelis, kuris gerai atrodo ant lentynos.'],
      ['Detalės iš ABS plastiko.', 'Pagamintas iš aukštos kokybės ABS plastiko.', 'ABS plastiko detalės.'],
      ['Tinka statybos technikos mėgėjams ir kolekcininkams.', 'Gera dovana statybos technikos gerbėjui.', 'Tinka kaip dovana mašinų mėgėjui.'],
    ],
    en: [
      ['A compact model for a construction machinery collection.', 'A small but detailed construction machine model.', 'A small model that looks good on a shelf.'],
      ['Parts are made of ABS plastic.', 'Made of high-quality ABS plastic.', 'ABS plastic parts.'],
      ['For construction machinery fans and collectors.', 'A good gift for a construction machinery fan.', 'Works as a gift for a machinery fan.'],
    ],
  },
  truck: {
    lt1: (c) => `${c.name}, mini sunkvežimio modelis iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini truck model in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini sunkvežimio modelis iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini truck model, ${c.p} pieces.`,
    lt: [
      ['Kompaktiškas modelis sunkvežimių kolekcijai.', 'Nedidelis, bet detalus sunkvežimio modelis.', 'Mažas modelis, kuris gerai atrodo ant lentynos.'],
      ['Detalės iš ABS plastiko.', 'Pagamintas iš aukštos kokybės ABS plastiko.', 'Detalės suderinamos su kitų gamintojų kaladėlėmis.'],
      ['Tinka sunkvežimių ir transporto technikos mėgėjams.', 'Gera dovana sunkvežimių gerbėjui.', 'Tinka kolekcininkams ir kaip dovana.'],
    ],
    en: [
      ['A compact model for a truck collection.', 'A small but detailed truck model.', 'A small model that looks good on a shelf.'],
      ['Parts are made of ABS plastic.', 'Made of high-quality ABS plastic.', 'Parts are compatible with other makers\' bricks.'],
      ['For truck and transport machinery fans.', 'A good gift for a truck fan.', 'Suits collectors and works as a gift.'],
    ],
  },
  suv: {
    lt1: (c) => `${c.name}, mini visureigio modelis iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini off-road model in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini visureigio modelis iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini off-road model, ${c.p} pieces.`,
    lt: [
      ['Kompaktiškas modelis visureigių kolekcijai.', 'Nedidelis, bet detalus visureigio modelis.', 'Mažas modelis, kuris gerai atrodo ant lentynos.'],
      ['Detalės iš ABS plastiko.', 'Pagamintas iš aukštos kokybės ABS plastiko.', 'Detalės suderinamos su kitų gamintojų kaladėlėmis.'],
      ['Tinka bekelės automobilių mėgėjams.', 'Gera dovana visureigių gerbėjui.', 'Tinka kolekcininkams ir kaip dovana.'],
    ],
    en: [
      ['A compact model for an off-road collection.', 'A small but detailed off-road model.', 'A small model that looks good on a shelf.'],
      ['Parts are made of ABS plastic.', 'Made of high-quality ABS plastic.', 'Parts are compatible with other makers\' bricks.'],
      ['For off-road vehicle fans.', 'A good gift for an off-road fan.', 'Suits collectors and works as a gift.'],
    ],
  },
  agri: {
    lt1: (c) => `${c.name}, mini žemės ūkio technikos modelis iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini farm machine in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini žemės ūkio technikos modelis iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini farm machine, ${c.p} pieces.`,
    lt: [
      ['Kompaktiškas modelis žemės ūkio technikos kolekcijai.', 'Nedidelis, bet detalus ūkio mašinos modelis.', 'Mažas modelis, kuris gerai atrodo ant lentynos.'],
      ['Detalės iš ABS plastiko.', 'Pagamintas iš aukštos kokybės ABS plastiko.', 'ABS plastiko detalės.'],
      ['Tinka žemės ūkio technikos mėgėjams.', 'Gera dovana traktorių ir kombainų gerbėjui.', 'Tinka kolekcininkams ir kaip dovana.'],
    ],
    en: [
      ['A compact model for a farm machinery collection.', 'A small but detailed farm machine model.', 'A small model that looks good on a shelf.'],
      ['Parts are made of ABS plastic.', 'Made of high-quality ABS plastic.', 'ABS plastic parts.'],
      ['For farm machinery fans.', 'A good gift for a tractor and combine fan.', 'Suits collectors and works as a gift.'],
    ],
  },
  engine: {
    lt1: (c) => `${c.name} iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, in ${c.p} pieces.`,
    shortLt: (c) => `${c.name} iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, ${c.p} pieces.`,
    lt: [
      ['Modelis atkuria variklio vidinę sandarą su stūmokliais, vožtuvais ir skirstomuoju velenu.', 'Surinkdami pamatysite, kaip variklis sudėtas iš vidaus.', 'Puikus būdas pažinti variklio mechaniką rankomis.'],
      ['Detalės iš aukštos kokybės ABS plastiko.', 'Pagamintas iš aukštos kokybės ABS plastiko.'],
      ['Skirta mechanikos mėgėjams.', 'Tinka automobilių ir variklių mėgėjams.', 'Gera dovana mechanikos gerbėjui.'],
    ],
    en: [
      ["The model recreates the engine's internal structure with pistons, valves and a camshaft.", 'As you build it, you see how the engine is put together inside.', 'A hands-on way to understand how an engine works.'],
      ['Parts are made of high-quality ABS plastic.', 'Made of high-quality ABS plastic.'],
      ['For mechanics enthusiasts.', 'For fans of cars and engines.', 'A good gift for a mechanics fan.'],
    ],
  },
  sc: {
    lt1: (c) => `${c.name} iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, in ${c.p} pieces.`,
    shortLt: (c) => `${c.name} iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, ${c.p} pieces.`,
    lt: [
      ['Rinkinys atkuria automobilio siluetą ir detales, kurias galima apžiūrėti iš visų pusių.', 'Detalus modelis automobilių kolekcijai.', 'Didelis, detalus modelis, tinkantis eksponuoti.'],
      ['Detalės iš aukštos kokybės ABS plastiko.', 'Pagamintas iš aukštos kokybės ABS plastiko.'],
      ['Tinka superautomobilių mėgėjams ir kolekcininkams.', 'Gera dovana automobilių gerbėjui.', 'Tinka kolekcininkams ir kaip dovana.'],
    ],
    en: [
      ["The set recreates the car's silhouette and details you can inspect from every side.", 'A detailed model for a car collection.', 'A large, detailed model made for display.'],
      ['Parts are made of high-quality ABS plastic.', 'Made of high-quality ABS plastic.'],
      ['For supercar fans and collectors.', 'A good gift for a car fan.', 'Suits collectors and works as a gift.'],
    ],
  },
  street: {
    lt1: (c) => `${c.name}, mini gatvės scenos rinkinys iš ${c.p} detalių.`,
    en1: (c, en) => `${en}, a mini street scene in ${c.p} pieces.`,
    shortLt: (c) => `${c.name}, mini gatvės scena iš ${c.p} detalių.`,
    shortEn: (c, en) => `${en}, mini street scene, ${c.p} pieces.`,
    lt: [
      ['Detalūs fasadai, iškabos ir miesto aplinkos elementai.', 'Rinkinys atkuria gatvės kampelį su fasadais, iškabomis ir smulkiais priedais.', 'Mažas gatvės kampelis su detaliais fasadais ir iškabomis.'],
      ['Puikus būdas pradėti kurti savo mini miestą.', 'Galite jungti su kitais rinkiniais ir kurti savo mini miestą.', 'Dar vienas kvartalas jūsų mini miestui.'],
      ['Detalės suderinamos su kitų gamintojų kaladėlėmis.', 'Tinka derinti su kitų gamintojų kaladėlėmis.', 'Suderinama su kitų gamintojų kaladėlėmis.'],
    ],
    en: [
      ['Detailed facades, signs and city elements.', 'The set recreates a street corner with facades, signs and small accessories.', 'A small street corner with detailed facades and signs.'],
      ['A great way to start building your own mini city.', 'You can combine it with other sets and build your own mini city.', 'Another block for your mini city.'],
      ['Parts are compatible with other makers\' bricks.', 'Works well with other makers\' bricks.', 'Compatible with other makers\' bricks.'],
    ],
  },
};

const fmtLt = (n) => (n >= 1000 ? String(n).replace(/(\d)(?=\d{3}$)/, '$1 ') : n);
const fmtEn = (n) => (n >= 1000 ? String(n).replace(/(\d)(?=\d{3}$)/, '$1,') : n);
const out = data.map((c, i) => {
  const L = { ...c, p: fmtLt(c.p) }, E = { ...c, p: fmtEn(c.p) };
  const P = POOLS[c.kind || 'car'];
  const en = c.en || c.name;
  const pick = (pools, shift) => pools.map((p, k) => p[(i >> (shift * k)) % p.length]);
  const ltPick = pick(P.lt, 1), enPick = pick(P.en, 1);
  if (c.core) { ltPick[0] = c.core; enPick[0] = c.core_en; }
  const lt = [P.lt1(L), c.hook, c.rc ? 'Modelį valdote nuotoliniu pultu.' : '', ...ltPick].filter(Boolean);
  const e = [P.en1(E, en), c.hook_en, c.rc ? 'You drive the model with a remote control.' : '', ...enPick].filter(Boolean);
  return {
    sku: c.sku,
    short: P.shortLt(L),
    desc: lt.join(' '),
    title_en: `MOULD KING ${c.sku} ${en} | ${E.p} pcs`,
    short_en: P.shortEn(E, en),
    desc_en: e.join(' '),
  };
});
writeFileSync(join(dir, 'batch-minis.json'), JSON.stringify(out, null, 1));
console.log(`ok: ${out.length} generated`);
