import { vec3, mat4 } from "gl-matrix";
import { deg2rad } from "./helper";

export class Triangle {
	position: vec3;
	eulers: vec3;
	model: mat4;
	constructor(position: vec3, theta: number) {
		this.position = position; // bad practice
		this.eulers = vec3.create();
		this.eulers[2] = theta;
	}
	update() {
		this.eulers[2] = (this.eulers[2] + 2) % 360;

		this.model = mat4.create();

		// translate first then rotate
		mat4.translate(this.model, this.model, this.position);
		let theta = deg2rad(this.eulers[2]);

		mat4.rotateZ(this.model, this.model, theta);
	}
	get_model(): mat4 {
		return this.model;
	}
}
