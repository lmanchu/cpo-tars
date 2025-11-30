import React, { useState } from 'react';
import { runBrowserAgent, type AgentStep } from '~utils/browser-agent';

interface BrowserAgentPanelProps {
    onClose?: () => void;
}

export const BrowserAgentPanel: React.FC<BrowserAgentPanelProps> = ({ onClose }) => {
    const [task, setTask] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [steps, setSteps] = useState<AgentStep[]>([]);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRunAgent = async () => {
        if (!task.trim()) {
            setError('Please enter a task');
            return;
        }

        setIsRunning(true);
        setSteps([]);
        setResult(null);
        setError(null);

        try {
            const finalResult = await runBrowserAgent(
                task,
                20,
                (step: AgentStep) => {
                    setSteps(prev => [...prev, step]);
                }
            );

            setResult(finalResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            console.error('[BrowserAgentPanel] Error:', err);
        } finally {
            setIsRunning(false);
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        setError('Task stopped by user');
    };

    const exampleTasks = [
        {
            title: '填寫表單',
            task: '找到頁面上的姓名輸入框,填入 "John Doe"',
            icon: '📝'
        },
        {
            title: '搜尋內容',
            task: '在搜尋框輸入 "Gemini API" 並搜尋',
            icon: '🔍'
        },
        {
            title: '提取資料',
            task: '提取這個頁面上所有的連結文字',
            icon: '📊'
        },
        {
            title: '導航測試',
            task: '找到並點擊 "下一頁" 按鈕',
            icon: '🔗'
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <h2 className="text-lg font-bold text-gray-900">Browser Agent</h2>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-600">
                    讓 AI 自動操作網頁:觀察、思考、行動
                </p>
            </div>

            {/* Task Input */}
            <div className="p-4 border-b bg-gray-50">
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            任務描述
                        </label>
                        <textarea
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            placeholder="例如: 在 Google 搜尋 'Gemini 2.0 API' 並打開第一個結果..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            disabled={isRunning}
                        />
                    </div>

                    {/* Example Tasks */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            快速範例
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {exampleTasks.map((example, i) => (
                                <button
                                    key={i}
                                    onClick={() => setTask(example.task)}
                                    disabled={isRunning}
                                    className="flex items-center gap-2 px-3 py-2 text-left text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>{example.icon}</span>
                                    <span className="flex-1 truncate">{example.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleRunAgent}
                            disabled={isRunning || !task.trim()}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isRunning ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    執行中...
                                </>
                            ) : (
                                <>
                                    <span>▶️</span>
                                    執行 Agent
                                </>
                            )}
                        </button>
                        {isRunning && (
                            <button
                                onClick={handleStop}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600"
                            >
                                ⏹ 停止
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">❌</span>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-red-800">錯誤</div>
                                <div className="text-sm text-red-600">{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Final Result */}
                {result && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <span className="text-green-500">✅</span>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-green-800">任務完成</div>
                                <div className="text-sm text-green-600">{result}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Steps */}
                {steps.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                            執行步驟 ({steps.length})
                        </div>
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                className="p-3 bg-white border border-gray-200 rounded-lg"
                            >
                                {/* Step Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                                            {step.stepNumber}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {step.action.type}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(step.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                {/* Thought */}
                                {step.action.thought && (
                                    <div className="mb-2">
                                        <div className="text-xs text-gray-500 mb-1">💭 思考</div>
                                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                            {step.action.thought}
                                        </div>
                                    </div>
                                )}

                                {/* Action Details */}
                                <div className="mb-2">
                                    <div className="text-xs text-gray-500 mb-1">🎯 操作</div>
                                    <div className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                                        {step.action.type}({JSON.stringify(step.action.params)})
                                    </div>
                                </div>

                                {/* Reason */}
                                {step.action.reason && (
                                    <div className="text-xs text-gray-500">
                                        原因: {step.action.reason}
                                    </div>
                                )}

                                {/* Screenshot Preview (optional) */}
                                {step.observation.screenshot && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                                            查看截圖
                                        </summary>
                                        <img
                                            src={`data:image/png;base64,${step.observation.screenshot}`}
                                            alt="Page screenshot"
                                            className="mt-2 w-full border rounded"
                                        />
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isRunning && steps.length === 0 && !error && !result && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="text-6xl mb-4">🤖</div>
                        <div className="text-lg font-medium text-gray-900 mb-2">
                            準備好執行任務
                        </div>
                        <div className="text-sm text-gray-500 max-w-sm">
                            輸入任務描述,AI Agent 將會自動:
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span>👁️</span>
                                <span>觀察網頁 (截圖 + DOM)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>🧠</span>
                                <span>思考下一步行動</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>🎯</span>
                                <span>執行操作 (點擊、輸入等)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>🔄</span>
                                <span>循環直到任務完成</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-3 border-t bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>ℹ️</span>
                    <span>
                        Agent 會自動分析頁面並執行操作,最多執行 20 步
                    </span>
                </div>
            </div>
        </div>
    );
};
