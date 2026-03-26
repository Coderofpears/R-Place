import type Character from "../character";
import type { GameObjects, Tweens } from "phaser";

interface SoundEffect {
    path: string;
    volume: number;
}

interface BaseAsset {
    frameHeight: number;
    frameRate: number;
    frameWidth: number;
    imageUrl: string;
    scale: number;
}

interface ImpactAsset extends BaseAsset {
    frames: number[];
    hideIfNoHit?: boolean;
}

interface WeaponAsset extends BaseAsset {
    fireFrames: number[];
    fromCharacterCenterRadius: number;
    hideFireSlash: boolean;
    idleFrames: number;
    originX: number;
    originY: number;
}

interface ProjectileAppearance {
    imageUrl: string;
    rotateToTarget: boolean;
    scale: number;
}

interface CurrentAppearance {
    id: string;
    explosionSfx: SoundEffect[];
    fireSfx: SoundEffect[];
    impact: ImpactAsset;
    projectile: ProjectileAppearance;
    reloadSfx: SoundEffect;
    weapon: WeaponAsset;
}

export default interface AimingAndLookingAround {
    angleTween?: Tweens.Tween;
    character: Character;
    currentAngle?: number;
    currentAppearance?: CurrentAppearance;
    currentWeaponId?: string;
    isAiming: boolean;
    lastUsedAngle: number;
    sprite: GameObjects.Sprite;
    targetAngle?: number;
    characterShouldFlipX(): boolean;
    destroy(): void;
    isCurrentlyAiming(): boolean;
    onInventoryStateChange(): void;
    playFireAnimation(): void;
    setImage(appearance: CurrentAppearance): void;
    setSpriteParams(skipRecalculateAlpha: boolean): void;
    setTargetAngle(angle: number, instant?: boolean): void;
    update(): void;
    updateAnotherCharacter(): void;
    updateMainCharacterMouse(): void;
    updateMainCharacterTouch(): void;
}
