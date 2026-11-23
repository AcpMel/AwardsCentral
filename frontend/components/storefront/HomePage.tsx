import Hero from "./Home/Hero";
import BestSellers from "./Home/BestSellers";
import FeaturedCollections from "./Home/FeaturedCollections";
import ShopByType from "./Home/ShopByType";
import WhyChooseUs from "./Home/WhyChooseUs";
import AvailableBranches from "./Home/AvailableBranches";
import AboutSection from "./Home/AboutSection";
import FAQ from "./Home/FAQ";

export default function Homepage() {
    return (
        <main className="min-h-screen bg-white">

            <Hero />

            <BestSellers />

            <FeaturedCollections />

            <ShopByType />

            <WhyChooseUs />

            <AvailableBranches />

            <AboutSection />

            <FAQ />

        </main>
    );
}