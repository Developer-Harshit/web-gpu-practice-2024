import { vec3, mat4 } from "gl-matrix";

export class Quad {
	position: vec3;
	model: mat4;
	constructor(position: vec3) {
		this.position = position; // bad practice
		this.model = mat4.create();
	}
	update() {
		this.model = mat4.create();
		// translate first then rotate
		mat4.translate(this.model, this.model, this.position);
	}
	get_model(): mat4 {
		return this.model;
	}
}
