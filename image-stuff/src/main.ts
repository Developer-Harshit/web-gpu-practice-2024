import { check, msg } from "./script/debug";
import { Renderer } from "./script/renderer";
import "./css/main.css";

async function start() {
	let cnv: HTMLCanvasElement = document.createElement("canvas");
	let renderer: Renderer = new Renderer(cnv);
	let imageResult = document.createElement("img");
	imageResult.onload = () => {
		let imageDiv = document.querySelector("#img-box");
		imageDiv.appendChild(imageResult);
		msg("Image loaded");
	};
	await renderer.init();
	renderer.resize_to_picture(5000);
	renderer.render();
	renderer.isrunning = false;
	cnv.toBlob(
		(blob) => {
			let downloadAnchor = document.querySelector(
				"#link-div a"
			) as HTMLAnchorElement;

			if (!blob) return msg("Failed to convert into blob");
			const url = URL.createObjectURL(blob);

			renderer = null;
			cnv = null;
			imageResult.src = url;
			downloadAnchor.href = url;
		},
		"image/png",
		1.0
	);
}
check();
let startBtn = <HTMLButtonElement>document.querySelector("button");
startBtn.addEventListener("click", () => {
	startBtn.disabled = true;
	start();
	msg("triggering start");
});
