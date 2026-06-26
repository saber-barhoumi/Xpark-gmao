import Layout from "@/components/layout/Layout"
import Banner from "@/components/sections/home1/Banner"
import About from "@/components/sections/home1/About"
import ServicesOne from "@/components/sections/home1/ServicesOne"
import WhyChoose from "@/components/sections/home1/WhyChoose"
import Project from "@/components/sections/home1/Project"
import Brand from "@/components/sections/home1/Brand"
import Counter from "@/components/sections/home1/Counter"
import Team from "@/components/sections/home1/Team"
import Start from "@/components/sections/home1/Start"
import Faq from "@/components/sections/home1/Faq"
import Testimonial from "@/components/sections/home1/Testimonial"
import Blog from "@/components/sections/home1/Blog"
import Cta from "@/components/sections/home1/Cta"
export default function Home() {

    return (
        <>
            <Layout headerStyle={1} footerStyle={1}>
                <Banner />
                <ServicesOne />
                <WhyChoose />
                <Project />
                <Brand />
                <About />
                <Counter />
                <Team />
                <Start />
                <Faq />
                <Testimonial />
                <Blog />
                <Cta/>
            </Layout>
        </>
    )
}