import type { TextSettings } from "./editor";

export const rotMod = (a: number, b: number) => {
    let mod = a % b;
    return mod == 0 ? b : mod;
};

export const snap = (a: number, b: number) => Math.floor(a / b) * b;

export interface Vec {
    x: number;
    y: number;
}
export const vec = (x: number, y: number) => ({ x, y });

const MEASURE_PRE = document.createElement("pre");
MEASURE_PRE.style.pointerEvents = "none";

MEASURE_PRE.style.position = "absolute";
MEASURE_PRE.style.visibility = "hidden";

document.body.appendChild(MEASURE_PRE);

export const textSize = (s: string, settings: TextSettings): Vec => {
    MEASURE_PRE.textContent = s;

    MEASURE_PRE.style.fontFamily = `"${settings.font}", monospace`;
    MEASURE_PRE.style.fontSize = `${settings.size}px`;

    let rect = MEASURE_PRE.getBoundingClientRect();
    let size = vec(rect.width, rect.height);

    return size;
};

export const EMPTY_CHAR = "​";

export const fixedNewlineEnd = (s: string) => {
    if (s.length == 0 || s[s.length - 1] == "\n") {
        return s + EMPTY_CHAR;
    }
    return s;
};
