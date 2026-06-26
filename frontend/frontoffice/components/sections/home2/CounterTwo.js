import Link from "next/link"
import CounterUp from "@/components/elements/CounterUp"


export default function CounterTwo() {
    return (
        <>
            {/*Counter Two Start*/}
            <section className="counter-two">
            <div className="container">
                <div className="row">
                <div className="col-xl-7">
                    <div
                    className="counter-two__left wow slideInLeft"
                    data-wow-delay="100ms"
                    data-wow-duration="2500ms"
                    >
                    <div className="counter-two__img">
                        <img src="assets/images/resources/counter-two-img-1.jpg" alt="" />
                    </div>
                    </div>
                </div>
                <div className="col-xl-5">
                    <div className="counter-two__right">
                    <div className="counter-two__big-text">
                        <h3>Since 1920</h3>
                    </div>
                    <div className="counter-two__count-box">
                        <ul className="counter-two__count-list list-unstyled">
                        <li>
                            <div className="counter-two__count-list-single">
                            <div className="counter-two__icon-and-count">
                                <div className="counter-two__count count-box">
                                <h3 className="count-text">
                                    <CounterUp end={100} />
                                </h3>
                                <span>+</span>
                                </div>
                                <div className="counter-two__icon">
                                <span className="icon-schedule" />
                                </div>
                            </div>
                            <p className="counter-two__count-text">
                                Our Happy Customer
                            </p>
                            </div>
                        </li>
                        <li>
                            <div className="counter-two__count-list-single">
                            <div className="counter-two__icon-and-count">
                                <div className="counter-two__count count-box">
                                <h3 className="count-text">
                                    <CounterUp end={100} />
                                </h3>
                                <span>+</span>
                                </div>
                                <div className="counter-two__icon">
                                <span className="icon-fragile" />
                                </div>
                            </div>
                            <p className="counter-two__count-text">
                                Our Happy Customer
                            </p>
                            </div>
                        </li>
                        <li>
                            <div className="counter-two__count-list-single">
                            <div className="counter-two__icon-and-count">
                                <div className="counter-two__count count-box">
                                <h3 className="count-text">
                                    <CounterUp end={20} />
                                </h3>
                                <span>k</span>
                                <span>+</span>
                                </div>
                                <div className="counter-two__icon">
                                <span className="icon-conveyor-1" />
                                </div>
                            </div>
                            <p className="counter-two__count-text">
                                Our Happy Customer
                            </p>
                            </div>
                        </li>
                        <li>
                            <div className="counter-two__count-list-single">
                            <div className="counter-two__icon-and-count">
                                <div className="counter-two__count count-box">
                                <h3 className="count-text">
                                    <CounterUp end={200} />
                                </h3>
                                <span>+</span>
                                </div>
                                <div className="counter-two__icon">
                                <span className="icon-clock" />
                                </div>
                            </div>
                            <p className="counter-two__count-text">
                                Our Happy Customer
                            </p>
                            </div>
                        </li>
                        </ul>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </section>
            {/*Counter Two End*/}
        </>
      

    )
}
