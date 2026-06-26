import Layout from "@/components/layout/Layout"
import Banner from "@/components/sections/home2/Banner"
import ServicesTwo from "@/components/sections/home2/ServicesTwo"
import WhyChooseTwo from "@/components/sections/home2/WhyChooseTwo"
import CounterTwo from "@/components/sections/home2/CounterTwo"
import ProcessOne from "@/components/sections/home2/ProcessOne"
import ProjectTwo from "@/components/sections/home2/ProjectTwo"
import Testimonial from "@/components/sections/home2/Testimonial"
import Blog from "@/components/sections/home2/Blog"
import GoogleMap from "@/components/sections/home2/GoogleMap"

export default function Home() {

    return (
        <>
            <Layout headerStyle={2} footerStyle={2}>
                <Banner />
                <ServicesTwo />
                <WhyChooseTwo />
                <CounterTwo />
                <ProcessOne />
                <ProjectTwo />
                <Testimonial />
                <Blog />
                <GoogleMap />
            </Layout>
        </>
    )
}