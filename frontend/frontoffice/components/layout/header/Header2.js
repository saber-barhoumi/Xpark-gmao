import Link from "next/link"
import Menu from "../Menu"
import MobileMenu from "../MobileMenu"
export default function Header2({ scroll, isMobileMenu, handleMobileMenu, isSidebar, handlePopup, handleSidebar }) {
    return (

        <header className={`main-header-two ${scroll ? "fixed-header" : ""}`}>
            <nav className="main-menu main-menu-two">
            <div className="main-menu-two__wrapper">
                <div className="container">
                <div className="main-menu-two__wrapper-inner">
                    <div className="main-menu-two__left">
                    <div className="main-menu-two__logo">
                        <Link href="/">
                        <img src="assets/images/resources/logo-2.png" alt="" />
                        </Link>
                    </div>
                    <div className="main-menu-two__main-menu-box">
                        <Link href="#" className="mobile-nav__toggler" onClick={handleMobileMenu}>
                        <i className="fa fa-bars" />
                        </Link>
                        <Menu />
                    </div>
                    </div>
                    <div className="main-menu-two__right">
                    <div className="main-menu-two__call-and-btn-box">
                        <div className="main-menu-two__call">
                        <div className="main-menu-two__call-icon">
                            <img
                            src="assets/images/icon/main-menu-two-chat-icon.png"
                            alt=""
                            />
                        </div>
                        <div className="main-menu-two__call-number">
                            <p>Need help?</p>
                            <h5>
                            <Link href="tel:307555-0133">(307) 555-0133</Link>
                            </h5>
                        </div>
                        </div>
                        <div className="main-menu-two__btn-box">
                        <Link href="/about" className="thm-btn main-menu-two__btn">
                            Read more
                            <span />
                        </Link>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </nav>
            <div className={`stricky-header stricked-menu main-menu main-menu-two ${scroll ? "stricky-fixed" : ""}`}>
                <div className="sticky-header__content" />
                <nav className="main-menu main-menu-two">
                    <div className="main-menu-two__wrapper">
                    <div className="container">
                        <div className="main-menu-two__wrapper-inner">
                        <div className="main-menu-two__left">
                            <div className="main-menu-two__logo">
                            <Link href="/">
                                <img src="assets/images/resources/logo-2.png" alt="" />
                            </Link>
                            </div>
                            <div className="main-menu-two__main-menu-box">
                            <Link href="#" className="mobile-nav__toggler" onClick={handleMobileMenu}>
                                <i className="fa fa-bars" />
                            </Link>
                            <Menu />
                            </div>
                        </div>
                        <div className="main-menu-two__right">
                            <div className="main-menu-two__call-and-btn-box">
                            <div className="main-menu-two__call">
                                <div className="main-menu-two__call-icon">
                                <img
                                    src="assets/images/icon/main-menu-two-chat-icon.png"
                                    alt=""
                                />
                                </div>
                                <div className="main-menu-two__call-number">
                                <p>Need help?</p>
                                <h5>
                                    <Link href="tel:307555-0133">(307) 555-0133</Link>
                                </h5>
                                </div>
                            </div>
                            <div className="main-menu-two__btn-box">
                                <Link href="/about" className="thm-btn main-menu-two__btn">
                                Read more
                                <span />
                                </Link>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </nav>
            </div>
            <MobileMenu handleMobileMenu={handleMobileMenu} handleSidebar={handleSidebar} isSidebar={isSidebar} />
        </header>
    
    )
}