"use client"

/**
 * Saisie de code à 6 chiffres (TOTP / OTP email) — style thème onpoint.
 * Auto-validation quand les 6 chiffres sont saisis.
 */
export default function CodeInput({ value, onChange, onComplete, disabled = false }) {
    const handleChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 6)
        onChange(digits)
        if (digits.length === 6 && onComplete) onComplete(digits)
    }

    return (
        <div className="contact-two__input-box">
            <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={value}
                onChange={handleChange}
                placeholder="000000"
                disabled={disabled}
                autoFocus
                style={{
                    textAlign: "center",
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "0.5em",
                }}
            />
        </div>
    )
}
