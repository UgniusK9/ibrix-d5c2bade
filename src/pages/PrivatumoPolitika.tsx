import { PageLayout } from "@/components/layout/PageLayout";

export default function PrivatumoPolitika() {
  return (
    <PageLayout>
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Privatumo politika</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p>Ši privatumo politika aprašo, kaip ibrix.lt renka, naudoja ir saugo jūsų asmeninę informaciją.</p>

            <h3>Kokią informaciją renkame?</h3>
            <ul>
              <li>Vardas ir pavardė</li>
              <li>El. pašto adresas</li>
              <li>Pristatymo adresas</li>
              <li>Mokėjimo informacija (apdorojama saugiai per mokėjimo partnerius)</li>
            </ul>

            <h3>Kaip naudojame jūsų informaciją?</h3>
            <ul>
              <li>Užsakymų apdorojimui ir pristatymui</li>
              <li>Komunikacijai apie užsakymo būseną</li>
              <li>Klientų aptarnavimui</li>
            </ul>

            <h3>Kontaktai</h3>
            <p>Jei turite klausimų apie privatumo politiką, susisiekite: support@ibrix.lt</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
