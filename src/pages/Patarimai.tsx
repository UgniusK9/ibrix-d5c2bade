import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/layout/PageLayout";
import { RouteSEO } from "@/components/seo/RouteSEO";
import articlesData from "@/content/articles.json";
import { isEnglishLocale } from "@/hooks/useProducts";

export interface Article {
  slug: string;
  title: string;
  description: string;
  published: string;
  readMinutes: number;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
  cta?: { title: string; note: string; label: string; href: string };
  disclaimer?: string;
  en?: Partial<Omit<Article, 'slug' | 'published' | 'readMinutes' | 'cta' | 'en'>> & {
    cta?: { title: string; note: string; label: string };
  };
}

const articles = articlesData.articles as Article[];

// English readers get each article's "en" block laid over the Lithuanian
// original. Slug, date and link stay shared; a field the block leaves out
// stays Lithuanian rather than going blank.
export function getArticles(lang?: string): Article[] {
  if (!isEnglishLocale(lang)) return articles;
  return articles.map(({ en, ...article }) =>
    en ? { ...article, ...en, cta: article.cta && { ...article.cta, ...en.cta } } : article,
  );
}

export function getArticle(slug: string | undefined, lang?: string) {
  return getArticles(lang).find((a) => a.slug === slug);
}

export default function Patarimai() {
  const { t, i18n } = useTranslation();
  const articles = getArticles(i18n.language);

  return (
    <PageLayout>
      <RouteSEO />
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-sm text-muted-foreground">{t("pgGuides.eyebrow")}</span>
          </div>
          <h1 className="font-heading text-4xl font-bold mb-4">
            {t("pgGuides.title")}
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            {t("pgGuides.subtitle")}
          </p>

          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.slug}
                to={`/patarimai/${article.slug}`}
                className="block bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
              >
                <h2 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {article.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {t("pgGuides.readTime", { minutes: article.readMinutes })}
                  </span>
                  <span className="flex items-center gap-1.5 text-primary">
                    {t("pgGuides.readMore")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
