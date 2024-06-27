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

// read the poem lin by line into html
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

alert("poem built")


// generate the poet bio
const biohtml = document.createElement("p")
biohtml.class = "bio"

// create the bolded name
const authname = document.createElement("strong")
authname.appendChild(document.createTextNode(poemauth))
biohtml.appendChild(authname)

// alert("author: " + poemauth)
// get and add the rest of the bio
import { getAuthorInfo } from "../../authors.js";
let biostr = getAuthorInfo(poemauth)[0]
biohtml.appendChild(document.createTextNode(" " + biostr))

document.getElementById("rightpane").appendChild(biohtml)

// alert("bio built")


document.getElementById("rightpane").appendChild(document.createElement("br"))

// generate the "other works" section

// generate the heading
const otherworksstr = document.createElement("p")
otherworksstr.appendChild(document.createTextNode("Other works by " + poemauth))
document.getElementById("rightpane").appendChild(otherworksstr)

// generate the list of other works (tho its currently just "works" -- ill implement other once i have another poem set up)
const otherworkslist = document.createElement("ul")
let poemlist = getAuthorInfo(poemauth)[1]
let listitems = []
let linkrefs = []

// alert(poemlist)

import { generatehref } from "../../authors.js";

// alert("import worked")

for (let i = 0; i < poemlist.length; i++) {
    // alert("for loop is working 1")
    listitems[i] = document.createElement("li")
    linkrefs[i] = document.createElement("a")
    linkrefs[i].href = generatehref(poemname)
    linkrefs[i].appendChild(document.createTextNode(poemlist[i]))
    listitems[i].appendChild(linkrefs[i])
    document.getElementById("rightpane").appendChild(listitems[i])
    // alert("for loop is working 2")
}

alert("otherworks built")


alert("building charity")

// import image
import { convertSpaces } from "../../authors.js";

let charitybutton = document.createElement("button")
charitybutton.class = "invisible"
charitybutton.id = "charitybutton"

import { link } from ("../../charities/" + convertSpaces(poemcharity) + "/about.js");
charitybutton.addEventListener("click", () => window.location.href = link());

let charityimage = document.createElement("img")
charityimage.src = "../charities/" + convertSpaces(poemcharity) + "/logo.svg"
charityimage.width = "100%"

let charitytitle = document.createElement("h2")
charitytitle.appendChild(document.createTextNode(poemcharity))

charitybutton.appendChild(charityimage)
charitybutton.appendChild(charitytitle)
document.getElementById("leftpane").appendChild(charitybutton)

document.getElementById("leftpane").appendChild(document.createElement("br"))
document.getElementById("leftpane").appendChild(document.createElement("br"))

// write the abt me


