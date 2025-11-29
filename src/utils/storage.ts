import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export const getStorage = async <T>(key: string): Promise<T | undefined> => {
    return await storage.get<T>(key)
}

export const setStorage = async (key: string, value: any) => {
    await storage.set(key, value)
}

export const watchStorage = (key: string, callback: (c: any) => void) => {
    storage.watch({
        [key]: (c) => {
            callback(c.newValue)
        }
    })
}
