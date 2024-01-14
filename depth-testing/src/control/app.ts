import { Scene } from "../model/scene";
import { Renderer } from "../view/renderer";

let debug = true;
export class App {
	cnv: HTMLCanvasElement;
	renderer: Renderer;
	scene: Scene;
	isrunning: boolean;

	// debug
	keyLabel: HTMLElement;
	mouseXLabel: HTMLElement;
	mouseYLabel: HTMLElement;

	velocity: number[];

	constructor(cnv: HTMLCanvasElement) {
		this.cnv = cnv;
		this.renderer = new Renderer(cnv);
		this.scene = new Scene();

		this.velocity = [0, 0];

		if (debug) this.debug();
	}
	debug() {
		let amount = 0.1;
		let speed = 0.05;
		let mouseLock = false;
		this.keyLabel = document.getElementById("key-label") as HTMLElement;
		this.mouseXLabel = document.getElementById("mx-label") as HTMLElement;
		this.mouseYLabel = document.getElementById("my-label") as HTMLElement;
		this.cnv.addEventListener("pointermove", (e) => {
			const cnvRect = this.cnv.getBoundingClientRect();
			this.mouseXLabel.innerHTML = (e.clientX - cnvRect.left).toString();
			this.mouseYLabel.innerHTML = (e.clientY - cnvRect.top).toString();
			if (!mouseLock) {
				this.scene.spin_player(e.movementX * amount, -e.movementY * amount);
			}
		});

		document.addEventListener("keyup", (e) => {
			switch (e.key) {
				case "w":
					this.velocity[0] = 0;
					break;
				case "s":
					this.velocity[0] = 0;
					break;
				case "a":
					this.velocity[1] = 0;
					break;
				case "d":
					this.velocity[1] = 0;
					break;
				case "g":
					mouseLock = false;
					break;
			}
		});
		document.addEventListener("keydown", (e) => {
			switch (e.key) {
				case "w":
					this.velocity[0] = speed;
					break;
				case "s":
					this.velocity[0] = -speed;
					break;
				case "a":
					this.velocity[1] = -speed;
					break;
				case "d":
					this.velocity[1] = speed;
					break;
				case "g":
					mouseLock = true;
					break;
			}
			this.keyLabel.innerText = e.key;
		});
	}

	async init() {
		await this.renderer.init();
		this.isrunning = true;
	}
	run() {
		this.scene.update();
		this.scene.move_player(this.velocity);
		this.renderer.render(
			this.scene.get_player(),
			this.scene.get_triangles(),
			this.scene.objectCount
		);
		if (this.isrunning) requestAnimationFrame(this.run.bind(this));
	}
}
