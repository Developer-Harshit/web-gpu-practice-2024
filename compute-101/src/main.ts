import { check } from "./script/debug";

import "./css/main.css";
import { Renderer } from "./script/renderer";

check();

const cnv = document.querySelector("#cnv") as HTMLCanvasElement;
cnv.width = 300;
cnv.height = 600;
const render = new Renderer(cnv);
render.Initialize();
