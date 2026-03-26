export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RotatedRect extends Rect {
    angle: number;
}

export interface Circle {
    x: number;
    y: number;
    radius: number;
}

export interface RotatedCircle extends Circle {
    angle: number;
}

export interface Ellipse {
    x: number;
    y: number;
    r1: number;
    r2: number;
}

export interface RotatedEllipse extends Ellipse {
    angle: number;
}

export interface RectShort {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface RotatedRectShort extends RectShort {
    angle: number;
}

export interface CircleShort {
    x: number;
    y: number;
    r: number;
}
