import React from "react"
import "~base.scss"

function IndexPopup() {
    return (
        <div className="w-64 p-4 bg-white">
            <h1 className="text-lg font-bold text-primary-500">CPO TARS</h1>
            <p className="text-sm text-gray-600">Open the side panel to use.</p>
            <button
                className="mt-4 w-full bg-primary-500 text-white py-2 rounded hover:bg-primary-700 transition-colors"
                onClick={() => chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })}
            >
                Open Side Panel
            </button>
        </div>
    )
}

export default IndexPopup
