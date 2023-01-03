import prototype from "./prototype.html";
import "./index.css";
import md5 from "js-md5";
import O3O from "./O3O";

const o3oNodes = document.getElementsByTagName("o3o");
const pageId = md5(document.title);
Array.prototype.forEach.call(o3oNodes, o3oNode => {
  o3oNode.innerHTML = prototype;
  let key = o3oNode.getAttribute("key");
  let api = o3oNode.getAttribute("api");
  let options = { key, api, pageId, o3oNode };
  let o3o = new O3O(options);
});
