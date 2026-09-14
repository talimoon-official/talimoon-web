import Navbar from "@/components/layout/Navbar";
import { HomeIntroExperience } from "@/components/intro/HomeIntroExperience";
import { HeroSlider } from "@/components/hero/Hero";
import { BrandValues } from "@/components/values/BrandValues";
import { FourDoorsSection } from "@/components/our-products/FourDoorsSection";
import { StoryLibraryPreview } from "@/components/story-library-preview/StoryLibraryPreview";
import { HayotGateway } from "@/components/home/HayotGateway";
import { RealTalimoonMoments } from "@/components/real-talimoon-moments/RealTalimoonMoments";
import { ParentFeedbackSection } from "@/components/parent-feedback/ParentFeedbackSection";
import { PartnersPreview } from "@/components/partners/PartnersPreview";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <HomeIntroExperience />
      <Navbar />

      <main>
        <HeroSlider />
        <BrandValues />
        <FourDoorsSection />
        <HayotGateway />
        <StoryLibraryPreview />
        <RealTalimoonMoments />
        <ParentFeedbackSection />
        <PartnersPreview />
      </main>

      <Footer showHowItWorksLink={false} />
    </>
  );
}