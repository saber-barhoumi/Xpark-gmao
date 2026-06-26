
export default function BackToTop({ scroll }) {

    return (
        <>
            {scroll && (
                <a href="#" className="scroll-to-target scroll-to-top">
                    <i className="fas fa-arrow-up" />
                </a>
            )}
        </>
    )
}