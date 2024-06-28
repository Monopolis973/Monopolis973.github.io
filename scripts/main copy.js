// let x = 431;
// const s = document.querySelector("#heading");
// s.textContent = "Hello, this is a test!";
// s.textContent = x.toString();
// alert("I dont know what this does") // gives a popup that says ""

// document.querySelector("html").addEventListener("click", () => {
//     alert("Ouch! Stop poking me!");
//   });

// let button = document.querySelector("#change_user");
// let poem = ""

// function setUsername () {
//     const name = prompt("please enter ur name:");
//     if (name) {
//         localStorage.setItem("name", name);
//         s.textContent = `Welcome to Candlelit Poetry, ${name}!`;
//     }
// };

// UNCOMMENT THIS RMEMEBTER
let homebutton = document.querySelector("#homepagebutton");
homebutton.addEventListener("click", () => window.location.href = "https://Monopolis973.github.io");

// if (!localStorage.getItem("name")) {
//     setUsername();
//   } else {
//     const storedName = localStorage.getItem("name");
//     s.textContent = `Welcome to Candlelit Poetry, ${storedName}!`;
// };

// button.addEventListener("click", setUsername);

// button.textContent = "does this work?";








// // left pane/charity stuff is here

// let featuredCharity = "The Nature Conservancy"

// let charitybutton = document.createElement("button");
// charitybutton.class = "invisible";  // do this manually
// // charitybutton.border = "0";
// // charitybutton.backgroundColor = "rgba(0, 0, 0, 0)";
// charitybutton.style.border = "0"
// charitybutton.style.background = "rgba(0, 0, 0, 0)";
// charitybutton.id = "charitybutton";

// import { getLink } from "../charities/charityinfo.js";

// charitybutton.addEventListener("click", () => window.location.href = getLink(featuredCharity));

// document.querySelector("leftpane").addEventListener("click", () => window.location.href = getLink(featuredCharity)); // this makes it so entire thing is button


// import { getLogo } from "../charities/charityinfo.js";

// let charityimage = document.createElement("img");
// charityimage.src = "charities/" + getLogo(featuredCharity);
// charityimage.style.width = "100%"; //String(document.documentElement.clientWidth / 5);

// let charitytitle = document.createElement("h2");
// charitytitle.appendChild(document.createTextNode(featuredCharity));

// charitybutton.appendChild(charityimage);
// // charitybutton.appendChild(charitytitle);  // uncomment this if u want the title back
// document.getElementById("leftpane").appendChild(charitybutton);

// // document.getElementById("leftpane").appendChild(charityimage);


// document.getElementById("leftpane").appendChild(document.createElement("br"));
// document.getElementById("leftpane").appendChild(document.createElement("br"));

// // write the abt charity

// let aboutchar = document.createElement("p");

// import { getDescription } from "../charities/charityinfo.js";
// aboutchar.appendChild(document.createTextNode(getDescription(featuredCharity)));

// document.getElementById("leftpane").appendChild(aboutchar);










// // right pane/links to featured poems go here
// import { getAllPoems } from "../poems.js";
// const featuredworkslist = document.createElement("ul");
// let poemlist = getAllPoems();
// let listitems = [];
// let linkrefs = [];

// // alert(poemlist)

// // import { generatehref } from "../../authors.js";
// import { convertSpaces } from "../authors.js";

// // alert("import worked")

// for (let i = 0; (i < poemlist.length) && (i < 10); i++) {
//     listitems[i] = document.createElement("li");
//     linkrefs[i] = document.createElement("a");
//     linkrefs[i].href = "Poems/" + convertSpaces(poemlist[i]) + "/index.html";
//     linkrefs[i].appendChild(document.createTextNode(poemlist[i]));
//     listitems[i].appendChild(linkrefs[i]);
//     featuredworkslist.appendChild(listitems[i]);
// }

// document.getElementById("rightpane").appendChild(featuredworkslist)