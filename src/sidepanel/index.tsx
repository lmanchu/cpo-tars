import React from "react"
import { App } from "./App"
import { LanguageProvider } from "~i18n/LanguageProvider"
import { ThemeProvider } from "~theme/ThemeProvider"
import "~base.scss"

export default function SidePanel() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <App />
            </LanguageProvider>
        </ThemeProvider>
    )
}
