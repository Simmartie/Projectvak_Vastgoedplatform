// Uses the real Optimmo SVG logo file from /public/optimmo-logo.svg
export function OptimmoLogo({ width = 130, className = '' }: { width?: number; className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/optimmo-logo.svg"
            alt="Optimmo"
            width={width}
            className={className}
            style={{ objectFit: 'contain' }}
        />
    )
}
