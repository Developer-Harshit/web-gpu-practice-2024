import { mat4 } from "gl-matrix";

// common definations that scene and renderer needs to understand
export enum ObjectTypes {
	TRIANGLE,
	QUAD,
}
export interface RenderData {
	// view transform matrix
	view: mat4;
	// model transform
	model: Float32Array;
	// object count for each object types
	counts: { [obj in ObjectTypes]: number };
}
