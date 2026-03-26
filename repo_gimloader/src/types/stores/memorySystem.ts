interface Costs {
    codeGrid: number;
    collidingTile: number;
    customAssetDefault: number;
    deviceInitialDefault: number;
    deviceSubsequentDefault: number;
    nonCollidingTile: number;
    wire: number;
}

interface Counters {
    codeGrids: number;
    collidingTiles: number;
    customAssets: Map<string, number>;
    devices: Map<string, number>;
    nonCollidingTiles: number;
    wires: number;
}

interface Limits {
    blocksPerCodeGrid: number;
    codeGrids: number;
    codeGridsPerDevice: number;
    collidingTiles: number;
    customAssetOnMapDefault: number;
    deviceMaxOnMapDefault: number;
    nonCollidingTiles: number;
    wires: number;
}

export default interface MemorySystem {
    costs: Costs;
    counters: Counters;
    limits: Limits;
    maxUsedMemory: number;
    usedMemoryCost: number;
}
