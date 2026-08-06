import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";

export default function Taisykles() {
  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-8">Taisyklės ir sąlygos</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p>Naudodamiesi ibrix.lt paslaugomis, sutinkate su šiomis taisyklėmis ir sąlygomis.</p>

            <h3>Užsakymai</h3>
            <p>Pateikdami užsakymą, patvirtinate, kad pateikta informacija yra teisinga. Pre-order užsakymai yra galutiniai, tačiau gali būti atšaukti bet kada iki išsiuntimo.</p>

            <h3>Kainos</h3>
            <p>Visos kainos nurodytos eurais ir apima PVM. Kainos gali keistis be išankstinio įspėjimo, tačiau jau pateiktiems užsakymams taikoma užsakymo metu nurodyta kaina.</p>

            <h3>Pristatymas</h3>
            <p>Pristatymo terminai yra orientaciniai. Ibrix neatsako už vėlavimus, kurie atsiranda dėl trečiųjų šalių (kurjerių) kaltės.</p>

            <h3>Kontaktai</h3>
            <p>Klausimai: support@ibrix.lt</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
