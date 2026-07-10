import Link from "next/link"

export default function Sidebar({ isSidebar, handleSidebar }) {
    return (
        
        <>
            {/* Start sidebar widget content */}
            <div className={`xs-sidebar-group info-group info-sidebar ${isSidebar ? "isActive" : "close-sidebar"}`}>
                <div className="xs-overlay xs-bg-black" onClick={handleSidebar}/>
                <div className="xs-sidebar-widget">
                <div className="sidebar-widget-container">
                    <div className="widget-heading">
                    <span href="#" className="close-side-widget" onClick={handleSidebar}>
                        X
                    </span>
                    </div>
                    <div className="sidebar-textwidget">
                    <div className="sidebar-info-contents">
                        <div className="content-inner">
                        <div className="logo">
                            <Link href="/">
                            <img src="assets/images/resources/logo-2.png" alt="" />
                            </Link>
                        </div>
                        <div className="content-box">
                            <h4>À propos de XPARK</h4>
                            <p>
                            XPARK est une entreprise spécialisée dans le transport de
                            marchandises grâce à une flotte de véhicules adaptée aux
                            besoins des professionnels.
                            </p>
                        </div>
                        <div className="form-inner">
                            <h4>Demandez un devis gratuit</h4>
                            <form
                            action="assets/inc/sendemail.php"
                            className="contact-form-validated"
                            noValidate="novalidate"
                            >
                            <div className="form-group">
                                <input
                                type="text"
                                name="name"
                                placeholder="Nom"
                                required=""
                                />
                            </div>
                            <div className="form-group">
                                <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                required=""
                                />
                            </div>
                            <div className="form-group">
                                <textarea
                                name="message"
                                placeholder="Votre demande de transport..."
                                defaultValue={""}
                                />
                            </div>
                            <div className="form-group message-btn">
                                <button type="submit" className="thm-btn form-inner__btn">
                                Envoyer
                                </button>
                            </div>
                            </form>
                            <div className="result" />
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            {/* End sidebar widget content */}
        </>
    )
}
