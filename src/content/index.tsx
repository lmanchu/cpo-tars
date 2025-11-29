import type { PlasmoCSConfig } from "plasmo"
import React from "react"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

const Overlay = () => {
    return (
        <div id="cpo-tars-overlay" style={{ position: "fixed", zIndex: 9999, pointerEvents: "none" }}>
            {/* Overlay logic will go here */}
        </div>
    )
}

export default Overlay
