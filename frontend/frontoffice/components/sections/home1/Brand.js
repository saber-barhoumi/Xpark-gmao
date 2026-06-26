import BrandSlider1 from '@/components/slider/BrandSlider1'
import CounterUp from "@/components/elements/CounterUp"
export default function Brand() {
    return (
        <>
  {/*Brand One Start*/}
  <section className="brand-one">
    <div className="container">
      <p className="brand-one__text count-box">
        Join the{" "}
        <CounterUp end={150} />
        <span>+</span> companies trusting maxline company
      </p>
      <BrandSlider1/>
    </div>
  </section>
  {/*Brand One End*/}
</>

    )
}
