import { vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Triangle } from "./triangle";

export class Scene {
	triangles: Triangle[];
	player: Camera;

	constructor() {
		this.triangles = [];
		this.triangles.push(new Triangle([2, 0, 0], 0));

		this.player = new Camera([-2, 0, 0.5], 0, 0);
	}
	update() {
		this.triangles.forEach((triangle) => triangle.update());
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
}
