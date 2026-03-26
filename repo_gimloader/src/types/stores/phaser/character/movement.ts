import type Character from "../character";

interface Point {
    endTime: number;
    endX: number;
    endY: number;
    startTime: number;
    startX: number;
    startY: number;
    teleported: boolean;
    usedTeleported: boolean;
}

interface EndInfo {
    end: number;
    start: number;
    x: number;
    y: number;
}

export default interface Movement {
    character: Character;
    currentPoint: Point;
    currentTime: number;
    nonMainCharacterGrounded: boolean;
    pointMap: Point[];
    targetIsDirty: boolean;
    targetNonMainCharacterGrounded: boolean;
    targetX: number;
    targetY: number;
    teleportCount: number;
    teleported: boolean;
    getCurrentEndInfo(): EndInfo;
    moveToTargetPosition(): void;
    onMainCharacterTeleport(): void;
    postPhysicsUpdate(dt: number): void;
    setNonMainCharacterTargetGrounded(grounded: boolean): void;
    setTargetX(x: number): void;
    setTargetY(y: number): void;
    setTeleportCount(teleportCount: number): void;
    update(dt: number): void;
}
