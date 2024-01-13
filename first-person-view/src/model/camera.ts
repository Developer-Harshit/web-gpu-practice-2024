import { vec3, mat4 } from "gl-matrix";
import { deg2rad } from "./helper";

export class Camera {
	position: vec3;
	eulers: vec3;
	view: mat4;
	forward: vec3;
	right: vec3;
	up: vec3;
	constructor(position: vec3, theta: number, phi: number) {
		this.position = position; // bad practice
		this.eulers = [0, phi, theta];
		this.forward = vec3.create();
		this.right = vec3.create();
		this.up = vec3.create();
	}
	update() {
		let theta = this.eulers[2];
		let phi = this.eulers[1];
		this.forward = [
			Math.cos(deg2rad(theta)) * Math.cos(deg2rad(phi)),
			Math.sin(deg2rad(theta)) * Math.cos(deg2rad(phi)),
			Math.sin(deg2rad(phi)),
		];

		vec3.cross(this.right, this.forward, [0, 0, 1]);

		vec3.cross(this.up, this.right, this.forward);

		var target: vec3 = vec3.create();
		vec3.add(target, this.position, this.forward);

		this.view = mat4.create();
		mat4.lookAt(this.view, this.position, target, this.up);
	}
	get_view(): mat4 {
		return this.view;
	}
}
