"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Layout from "@/components/layout/Layout"
import authService from "@/lib/authService"

/** Inscription client (rôle CLIENT — activé automatiquement après confirmation email). */
export default function RegisterPage() {
    const router = useRouter()
    const [form, setForm] = useState({
        nom: "", prenom: "", email: "", telephone: "",
        password: "", confirmPassword: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        if (form.password !== form.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.")
            return
        }
        if (form.password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.")
            return
        }
        setLoading(true)
        try {
            await authService.register(form)
            router.push(`/auth/confirm-email?email=${encodeURIComponent(form.email.trim())}&sent=1`)
        } catch (err) {
            setError(err.message || "Erreur lors de l'inscription.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="INSCRIPTION">
            <section className="contact-two">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-7 col-lg-9">
                            <div className="section-title text-center">
                                <div className="section-title__tagline-box">
                                    <span className="section-title__tagline">Espace Client XPARK</span>
                                </div>
                                <h2 className="section-title__title">Créer votre compte</h2>
                            </div>

                            {error && (
                                <div className="text-center" style={{ padding: 12, marginBottom: 20, background: "#fde8e8", color: "#b02a37", borderRadius: 8 }}>
                                    {error}
                                </div>
                            )}

                            <form className="contact-two__form" onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-xl-6 col-lg-6">
                                        <div className="contact-two__input-box">
                                            <input type="text" placeholder="Nom" value={form.nom} onChange={set("nom")} required />
                                        </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                        <div className="contact-two__input-box">
                                            <input type="text" placeholder="Prénom" value={form.prenom} onChange={set("prenom")} required />
                                        </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                        <div className="contact-two__input-box">
                                            <input type="email" placeholder="Adresse email" value={form.email} onChange={set("email")} required autoComplete="email" />
                                        </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                        <div className="contact-two__input-box">
                                            <input type="tel" placeholder="Téléphone" value={form.telephone} onChange={set("telephone")} required />
                                        </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                        <div className="contact-two__input-box">
                                            <input type="password" placeholder="Mot de passe (8 caractères min)" value={form.password} onChange={set("password")} required autoComplete="new-password" />
                                        </div>
                                    </div>
                                    <div className="col-xl-6 col-lg-6">
                                        <div className="contact-two__input-box">
                                            <input type="password" placeholder="Confirmer le mot de passe" value={form.confirmPassword} onChange={set("confirmPassword")} required autoComplete="new-password" />
                                        </div>
                                    </div>
                                    <div className="col-xl-12">
                                        <div className="contact-two__btn-box">
                                            <button type="submit" className="thm-btn contact-two__btn" disabled={loading}>
                                                {loading ? "Création…" : "S'inscrire"}<span />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center" style={{ marginTop: 20 }}>
                                    Déjà un compte ? <Link href="/auth/login">Se connecter</Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    )
}
