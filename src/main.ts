import { check } from "./script/debug";

import "./css/main.css";
import { Renderer } from "./script/renderer";

check();

const cnv = document.querySelector("#cnv") as HTMLCanvasElement;
const render = new Renderer(cnv);
render.Initialize();
