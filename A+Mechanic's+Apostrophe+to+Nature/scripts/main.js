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


// generate the poet bio
const biohtml = document.createElement("p")
biohtml.class = "bio"

// create the bolded name
const authname = document.createElement("strong")
authname.appendChild(document.createTextNode(poemauth))
biohtml.appendChild(authname)

// get and add the rest of the bio
import { getAuthorInfo } from "../../authors.js";
const biostr = getAuthorInfo(poemauth)[0]
biohtml.appendChild(document.createTextNode(biostr))

document.getElementById("rightpane").appendChild(biohtml)