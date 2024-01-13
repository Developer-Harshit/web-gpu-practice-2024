import { check } from "./view/debug";

import "./css/main.css";

import { App } from "./control/app";

check();
const cnv = document.querySelector("#cnv") as HTMLCanvasElement;
cnv.width = 300;
cnv.height = 300;

const app = new App(cnv);
app.init().then(() => {
	app.run();
});
