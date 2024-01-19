import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Triangle } from "./triangle";
import { Quad } from "./quad";
import { ObjectTypes, RenderData } from "./definations";

export class Scene {
	triangles: Triangle[];
	quads: Quad[];
	player: Camera;
	objects: Float32Array;

	constructor() {
		this.player = new Camera([-2, 0, 0.5], 0, 0);
		this.objects = new Float32Array(16 * 1024);

		this.triangles = [];
		this.quads = [];
		this.create_triangles();
		this.create_quads();
	}

	create_quads() {
		var i = this.triangles.length;
		for (var x: number = -10; x <= 10; x++) {
			for (var y: number = -10; y <= 10; y++) {
				this.quads.push(new Quad([x, y, 0]));
				var blank_matrix = mat4.create();

				for (var j = 0; j < 16; j++) {
					this.objects[16 * i + j] = <number>blank_matrix[j];

					this.triangles.length;
				}
				i++;
				this.quads.length++;
			}
		}
	}
	create_triangles() {
		var i = 0;
		for (let y = -5; y <= 5; y++) {
			this.triangles.push(new Triangle([2, y, 0], 0));
			var blank_matrix = mat4.create();

			for (var j = 0; j < 16; j++) {
				this.objects[16 * i + j] = <number>blank_matrix[j];
			}
			i++;
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
		this.quads.forEach((quad) => {
			quad.update();
			var model = quad.get_model();
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
	get_render_data(): RenderData {
		return {
			view: this.player.get_view(),
			model: this.objects,
			counts: {
				[ObjectTypes.TRIANGLE]: this.triangles.length,
				[ObjectTypes.QUAD]: this.quads.length,
			},
		};
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
