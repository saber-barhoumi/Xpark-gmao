'use client'
import Link from "next/link";
import { useState } from "react";

const MobileMenu = ({ isSidebar, handleMobileMenu, handleSidebar }) => {
  const [isActive, setIsActive] = useState({
    status: false,
    key: "",
    subMenuKey: "",
  });

  const handleToggle = (key, subMenuKey = "") => {
    if (isActive.key === key && isActive.subMenuKey === subMenuKey) {
      setIsActive({
        status: false,
        key: "",
        subMenuKey: "",
      });
    } else {
      setIsActive({
        status: true,
        key,
        subMenuKey,
      });
    }
  };
    return (
        <>
            
            {/*End Mobile Menu */}
            <div className="mobile-nav__wrapper">
                <div className="mobile-nav__overlay mobile-nav__toggler"  onClick={handleMobileMenu}/>
                {/* /.mobile-nav__overlay */}
                <div className="mobile-nav__content">
                    <span className="mobile-nav__close mobile-nav__toggler" onClick={handleMobileMenu}>
                    <i className="fa fa-times" />
                    </span>
                    <div className="logo-box">
                    <Link href="/" aria-label="logo image">
                        <img src="assets/images/resources/logo-2.png" width={150} alt="" />
                    </Link>
                    </div>
                    {/* /.logo-box */}
                    <div className="mobile-nav__container">
                        <ul className="main-menu__list">
                        <li><Link href="/" onClick={handleMobileMenu}>Accueil</Link></li>
                        <li><Link href="/about" onClick={handleMobileMenu}>À propos</Link></li>
                        <li className={isActive.key == 4 ? "dropdown current" : "dropdown"}>
                            <Link href="#" onClick={handleMobileMenu}>Services</Link>
                            <ul style={{ display: `${isActive.key == 4 ? "block" : "none"}` }}>
                                <li><Link href="/services" onClick={handleMobileMenu}>Tous nos services</Link></li>
                                <li><Link href="/express-freight-solutions" onClick={handleMobileMenu}>Transport de marchandises</Link></li>
                                <li><Link href="/quick-move-logistics" onClick={handleMobileMenu}>Gestion de flotte</Link></li>
                                <li><Link href="/speedy-dispatch" onClick={handleMobileMenu}>Livraison et distribution</Link></li>
                                <li><Link href="/swift-supply-chain" onClick={handleMobileMenu}>Transport personnalisé</Link></li>
                                <li><Link href="/on-point-distribution" onClick={handleMobileMenu}>Transport local et régional</Link></li>
                            </ul>
                            <div className={isActive.key == 4 ? "dropdown-btn open" : "dropdown-btn"} onClick={() => handleToggle(4)}>
                                <span className="fa fa-angle-right" />
                            </div>
                        </li>
                            <li><Link href="/contact" onClick={handleMobileMenu}>Contact</Link></li>
                            <li className={isActive.key == 7 ? "dropdown current" : "dropdown"}>
                                <Link href="/account" onClick={handleMobileMenu}>Espace Client</Link>
                                <ul style={{ display: `${isActive.key == 7 ? "block" : "none"}` }}>
                                    <li><Link href="/auth/login" onClick={handleMobileMenu}>Connexion</Link></li>
                                    <li><Link href="/auth/register" onClick={handleMobileMenu}>Inscription</Link></li>
                                    <li><Link href="/account" onClick={handleMobileMenu}>Mon Compte</Link></li>
                                    <li><Link href="/account/reserver" onClick={handleMobileMenu}>Réserver un véhicule</Link></li>
                                    <li><Link href="/account/missions" onClick={handleMobileMenu}>Mes Missions</Link></li>
                                </ul>
                                <div className={isActive.key == 7 ? "dropdown-btn open" : "dropdown-btn"} onClick={() => handleToggle(7)}>
                                    <span className="fa fa-angle-right" />
                                </div>
                            </li>
                            <li className={isActive.key == 8 ? "dropdown current" : "dropdown"}>
                                <Link href="#">Langue : FR</Link>
                                <ul style={{ display: `${isActive.key == 8 ? "block" : "none"}` }}>
                                    <li><Link href="#">Français</Link></li>
                                    <li><Link href="#" title="Bientôt disponible">English (bientôt)</Link></li>
                                </ul>
                                <div className={isActive.key == 8 ? "dropdown-btn open" : "dropdown-btn"} onClick={() => handleToggle(8)}>
                                    <span className="fa fa-angle-right" />
                                </div>
                            </li>
                        </ul>
                    </div>
                    <ul className="mobile-nav__contact list-unstyled">
                    <li>
                        <i className="fa fa-envelope" />
                        <a href="mailto:contact@xpark.tn">contact@xpark.tn</a>
                    </li>
                    <li>
                        <i className="fa fa-phone-alt" />
                        <a href="tel:+21670000000">+216 70 000 000</a>
                    </li>
                    </ul>
                    {/* /.mobile-nav__contact */}
                    <div className="mobile-nav__top">
                    <div className="mobile-nav__social">
                        <a href="#" className="fab fa-twitter" />
                        <a href="#" className="fab fa-facebook-square" />
                        <a href="#" className="fab fa-pinterest-p" />
                        <a href="#" className="fab fa-instagram" />
                    </div>
                    {/* /.mobile-nav__social */}
                    </div>
                    {/* /.mobile-nav__top */}
                </div>
                {/* /.mobile-nav__content */}
                </div>

            
            
            <div className="nav-overlay" style={{ display: `${isSidebar ? "block" : "none"}` }} onClick={handleSidebar} />

          

        </>
    )
}
export default MobileMenu;
