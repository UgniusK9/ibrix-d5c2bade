import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { getArticle } from "./Patarimai";

export default function Straipsnis() {
  const { slug } = useParams<{ slug: string }>();
  const article = getArticle(slug);

  if (!article) return <Navigate to="/patarimai" replace />;

  return (
    <PageLayout>
      <SEOHead
        title={article.title}
        description={article.description}
        canonical={`/patarimai/${article.slug}`}
        type="article"
        breadcrumbs={[
          { name: "Pradžia", url: "/" },
          { name: "Patarimai", url: "/patarimai" },
          { name: article.title, url: `/patarimai/${article.slug}` },
        ]}
      />
      <article className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <Link
            to="/patarimai"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Visi patarimai
          </Link>

          <h1 className="font-heading text-4xl font-bold mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.readMinutes} min. skaitymo
            </span>
            <time dateTime={article.published}>
              {new Date(article.published).toLocaleDateString("lt-LT")}
            </time>
          </div>

          <p className="text-lg text-muted-foreground mb-10">{article.intro}</p>

          <div className="space-y-8">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-heading text-xl font-semibold mb-3">
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {article.cta && (
            <Link
              to={article.cta.href}
              className="mt-12 bg-card border border-primary/30 rounded-xl p-6 flex items-center justify-between gap-4 hover:border-primary transition-colors group"
            >
              <div>
                <div className="font-heading font-semibold group-hover:text-primary transition-colors">
                  {article.cta.title}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {article.cta.note}
                </div>
              </div>
              <span className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap">
                {article.cta.label}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          )}

          {article.disclaimer && (
            <p className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
              {article.disclaimer}
            </p>
          )}
        </div>
      </article>
    </PageLayout>
  );
}
