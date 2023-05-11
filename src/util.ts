export const rotMod = (a: number, b: number) => {
    let mod = a % b;
    return mod == 0 ? b : mod;
};

export const snap = (a: number, b: number) => Math.floor(a / b) * b;
