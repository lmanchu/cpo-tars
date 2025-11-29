import React from "react"
import "~base.scss"

export default function Greeting() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <h1 className="text-4xl font-bold text-primary-500 mb-4">Welcome to CPO TARS</h1>
            <p className="text-xl text-gray-600">Your Chief Personal Officer is ready.</p>
        </div>
    )
}
