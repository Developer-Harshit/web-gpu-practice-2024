import { check, msg } from "./view/debug";

import "./css/main.css";

import { App } from "./control/app";

check();
const cnv = document.querySelector("#cnv") as HTMLCanvasElement;
cnv.width = 700;
cnv.height = 700;

const app = new App(cnv);
app.init().then(() => {
	msg("Running");
	app.run();
});
