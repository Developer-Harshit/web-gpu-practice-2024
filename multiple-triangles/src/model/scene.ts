import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Triangle } from "./triangle";

export class Scene {
	triangles: Triangle[];
	player: Camera;
	objects: Float32Array;
	objectCount: number;

	constructor() {
		this.triangles = [];
		this.player = new Camera([-2, 0, 0.5], 0, 0);

		this.objects = new Float32Array(16 * 1024);
		this.objectCount = 0;
		// creating triangles
		var i = 0;
		for (let y = -5; y < 5; y += 2) {
			for (let z = -5; z < 5; z += 2) {
				for (let x = 2; x < 12; x += 2) {
					this.triangles.push(new Triangle([x, y, z], 0));
					var blank_matrix = mat4.create();
					console.log(blank_matrix);
					for (var j = 0; j < 16; j++) {
						this.objects[16 * i + j] = <number>blank_matrix[j];
					}
					i++;
					this.objectCount++;
				}
			}
		}
	}

	update() {
		var i = 0;
		this.triangles.forEach((triangle) => {
			triangle.update();
			var model = triangle.get_model();
			for (var j = 0; j < 16; j++) {
				this.objects[16 * i + j] = <number>model[j];
			}
			i++;
		});
		this.player.update();
	}
	move_player(velocity: number[]) {
		vec3.scaleAndAdd(
			this.player.position,
			this.player.position,
			this.player.forward,
			velocity[0]
		);

		vec3.scaleAndAdd(
			this.player.position,
			this.player.position,
			this.player.right,
			velocity[1]
		);
	}
	spin_player(dx: number, dy: number) {
		this.player.eulers[2] -= dx;
		this.player.eulers[2] %= 360;

		this.player.eulers[1] = Math.min(
			89,
			Math.max(-89, this.player.eulers[1] + dy)
		);
	}
	get_player(): Camera {
		return this.player;
	}
	get_triangles(): Float32Array {
		return this.objects;
	}
}
