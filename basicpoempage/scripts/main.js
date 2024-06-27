// Change to be accurate
let poemname = "A Mechanic's Apostrophe to Nature"

// set heading
const poemtitle = document.createElement('h2');
const title = document.createTextNode(poemname);
poemtitle.appendChild(title);



import { getPoem } from "../../poems.js";
let poeminfo = getPoem(poemname)
let poemstr = poeminfo[0]
let poemauth = poeminfo[1]
let poemcharity = poeminfo[2]

// read the poem linebyline into html
const poemhtml = document.createElement("p")
poemhtml.class = "poem"
for (const c of poemstr) {
    if (c != "\n") {
        poemhtml.appendChild(document.createTextNode(c))
    }
    else {
        poemhtml.appendChild(document.createElement("br"))
    }
}

document.getElementById("middlepane").appendChild(poemtitle);
document.getElementById("middlepane").appendChild(poemhtml)