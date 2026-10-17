import { Hero, InstructorIntro, FeaturedCourses, Categories, LearningPaths, Benefits, HowItWorks, ProgressHighlight, Resources, Testimonials, FaqPreview, SupportCta } from "@/components/home/sections";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "EducationalOrganization", name: SITE.name, url: SITE.url, description: SITE.description, parentOrganization: { "@type": "Organization", name: SITE.academy } }} />
      <Hero /><InstructorIntro /><FeaturedCourses /><Categories /><LearningPaths /><Benefits /><HowItWorks /><ProgressHighlight /><Resources /><Testimonials /><FaqPreview /><SupportCta />
    </>
  );
}
