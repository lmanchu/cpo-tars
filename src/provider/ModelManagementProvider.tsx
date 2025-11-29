import React, {createContext, useEffect, useRef, useState} from "react";
import {getLatestState} from "~utils";
import {Storage} from "@plasmohq/storage";
import {Logger} from "~utils/logger";
import GeminiBot from "~libs/chatbot/gemini/GeminiBot";

export type M = typeof GeminiBot

export type Ms = M[]

export interface CMsItem {
    label: string;
    models: M[];
}
export type CMs = CMsItem[]

interface IModelManagementProvider {
    currentBots: Ms;
    setCurrentBots: React.Dispatch<React.SetStateAction<Ms>>;
    allModels: React.MutableRefObject<Ms>;
    categoryModels: React.MutableRefObject<CMs>;
    saveCurrentBotsKeyLocal: () => void;
}

export const ModelManagementContext = createContext({} as IModelManagementProvider);

export default function ModelManagementProvider({children}) {
    const defaultModels: Ms = [GeminiBot];
    const [currentBots, setCurrentBots] = useState<IModelManagementProvider['currentBots']>(defaultModels);
    const allModels = useRef<Ms>([GeminiBot]);
    const storage = new Storage();
    const [isLoaded, setIsLoaded] = useState(false);
    const categoryModels = useRef<CMs>([
        {
            label: "Google",
            models: [GeminiBot]
        }]
    );

    const handleModelStorge = async () => {
        try {
            const value = await storage.get<string[]>("currentModelsKey");

            const arr: Ms = [];

            if (value && value.length) {
                Logger.log('local currentModels:',value);
                value.forEach((ele) => {
                    allModels.current.forEach((item) => {
                        if (item.botName === ele) {
                            arr.push(item);
                        }
                    });
                });

                if (arr.length) {
                    setCurrentBots(arr);
                }else {
                    setCurrentBots(defaultModels);
                }
            }
        }catch (e) {
            // ignore
        }
        finally {
            setIsLoaded(true);
        }
    };

    useEffect(()=>{
        void handleModelStorge();
    },[]);

    const getCurrentModelKey = async () => {
        const cbots: Ms = await getLatestState(setCurrentBots);
        return cbots.map(model => model.botName);
    };

    const saveCurrentBotsKeyLocal = async () => {
        void storage.set("currentModelsKey", await getCurrentModelKey());
        Logger.log('s-get', storage.get("currentModelsKey"));
    };

    return (
        <ModelManagementContext.Provider value={{currentBots, allModels, categoryModels, setCurrentBots: setCurrentBots, saveCurrentBotsKeyLocal}}>
            {isLoaded && children}
        </ModelManagementContext.Provider>
    );
}
