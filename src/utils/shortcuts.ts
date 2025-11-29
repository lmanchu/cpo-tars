import { useHotkeys } from 'react-hotkeys-hook';

export const useShortcut = (key: string, callback: () => void) => {
    useHotkeys(key, callback);
};
