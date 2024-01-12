const msgDiv = document.getElementById("msg");
export function msg(text: any) {
  if (!msgDiv) return console.log("Message div not defined");
  msgDiv.innerText = text;
}
export function msg2(text: any) {
  if (!msgDiv) return console.log("Message div not defined");
  msgDiv.innerText += text;
}
export function check() {
  if (navigator.gpu) msg("supported");
  else msg2("not supported");
}
