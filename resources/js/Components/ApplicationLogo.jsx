export default function ApplicationLogo({ className, style }) {
    return (
        <img
            src="/images/Logo_RA.png"
            alt="RamahAnak.id"
            className={className}
            style={style}
            onError={e => { e.target.style.display = 'none'; }}
        />
    );
}