let poemname = "[Dis]abled" // update for each page

// set heading
const poemtitle = document.createElement('h2');
const title = document.createTextNode(poemname);
poemtitle.appendChild(title);



import { getPoem } from "../../poems.js";
let poeminfo = getPoem(poemname);
let poemstr = poeminfo[0];
let poemauth = poeminfo[1];
let poemcharity = poeminfo[2];

// read the poem lin by line into html
const poemhtml = document.createElement("p");
poemhtml.class = "poem";
for (const c of poemstr) {
    if (c != "\n") {
        poemhtml.appendChild(document.createTextNode(c));
    }
    else {
        poemhtml.appendChild(document.createElement("br"))
    };
};

document.getElementById("middlepane").appendChild(poemtitle);
document.getElementById("middlepane").appendChild(poemhtml);

// alert("poem built");







// right panel


// generate the poet bio
const biohtml = document.createElement("p");
biohtml.class = "bio";

// create the bolded name
const authname = document.createElement("strong");
authname.appendChild(document.createTextNode(poemauth));
biohtml.appendChild(authname);

// get and add the rest of the bio
import { getAuthorInfo } from "../../authors.js";
let biostr = getAuthorInfo(poemauth)[0];
biohtml.appendChild(document.createTextNode(" " + biostr));

document.getElementById("rightpane").appendChild(biohtml);


document.getElementById("rightpane").appendChild(document.createElement("br"));

// generate the "other works" section

// generate the heading
const otherworksstr = document.createElement("p");
otherworksstr.appendChild(document.createTextNode("Other works by " + poemauth));
document.getElementById("rightpane").appendChild(otherworksstr);

// generate the list of other works (tho its currently just "works" -- ill implement other once i have another poem set up)
const otherworkslist = document.createElement("ul");
let poemlist = getAuthorInfo(poemauth)[1];
let listitems = [];
let linkrefs = [];


import { generatehref } from "../../authors.js";

for (let i = 0; i < poemlist.length; i++) {
    listitems[i] = document.createElement("li");
    linkrefs[i] = document.createElement("a");
    linkrefs[i].href = generatehref(poemlist[i]);
    linkrefs[i].appendChild(document.createTextNode(poemlist[i]));
    listitems[i].appendChild(linkrefs[i]);
    otherworkslist.appendChild(listitems[i]);
};

document.getElementById("rightpane").appendChild(otherworkslist);







// left panel

let charitybutton = document.createElement("button");
charitybutton.style.border = "0";
charitybutton.style.background = "rgba(0, 0, 0, 0)";
charitybutton.id = "charitybutton";

import { getLink } from "../../charities/charityinfo.js";
charitybutton.addEventListener("click", () => window.location.href = getLink(poemcharity));

import { getLogo } from "../../charities/charityinfo.js";

let charityimage = document.createElement("img");
charityimage.src = "../charities/" + getLogo(poemcharity);
charityimage.style.width = "100%";

let charitytitle = document.createElement("h2");
charitytitle.appendChild(document.createTextNode(poemcharity));

charitybutton.appendChild(charityimage);
// charitybutton.appendChild(charitytitle);  // uncomment this if u want the title back
document.getElementById("leftpane").appendChild(charitybutton);

document.getElementById("leftpane").appendChild(document.createElement("br"));
document.getElementById("leftpane").appendChild(document.createElement("br"));


let aboutchar = document.createElement("p");

import { getDescription } from "../../charities/charityinfo.js";
aboutchar.appendChild(document.createTextNode(getDescription(poemcharity)));

document.getElementById("leftpane").appendChild(aboutchar);
