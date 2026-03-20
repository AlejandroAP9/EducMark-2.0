"use client"

import * as React from "react"

export interface PixelCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
    gap?: number
    speed?: number
    colors?: string[]
    variant?: "default" | "icon"
    noFocus?: boolean
}

const PixelCanvas = React.forwardRef<HTMLDivElement, PixelCanvasProps>(
    ({ gap, speed, colors, variant, noFocus, style, ...props }, ref) => {
        const [mounted, setMounted] = React.useState(false)

        React.useEffect(() => {
            setMounted(true)
            // Dynamically define the web component only in the browser
            import('./pixel-canvas-element').then(({ registerPixelCanvas }) => {
                registerPixelCanvas()
            })
        }, [])

        if (!mounted) return null

        return (
            <pixel-canvas
                ref={ref}
                data-gap={gap}
                data-speed={speed}
                data-colors={colors?.join(",")}
                data-variant={variant}
                {...(noFocus && { "data-no-focus": "" })}
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    width: '100%',
                    height: '100%',
                    ...style
                }}
                {...props}
            />
        )
    }
)
PixelCanvas.displayName = "PixelCanvas"

// Add type declaration for custom element
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            "pixel-canvas": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                "data-gap"?: number;
                "data-speed"?: number;
                "data-colors"?: string;
                "data-variant"?: string;
                "data-no-focus"?: string;
            };
        }
    }
}

export { PixelCanvas }
