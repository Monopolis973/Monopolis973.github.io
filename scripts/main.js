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
// let charitybutton = document.querySelector("#charitybutton");
// charitybutton.addEventListener("click", () => window.location.href = "https://preserve.nature.org/page/80429/donate/1");

// if (!localStorage.getItem("name")) {
//     setUsername();
//   } else {
//     const storedName = localStorage.getItem("name");
//     s.textContent = `Welcome to Candlelit Poetry, ${storedName}!`;
// };

// button.addEventListener("click", setUsername);

// button.textContent = "does this work?";

let poemcharity = "The Nature Conservancy"

let charitybutton = document.createElement("button");
charitybutton.class = "invisible";  // do this manually
// charitybutton.border = "0";
// charitybutton.backgroundColor = "rgba(0, 0, 0, 0)";
charitybutton.style.border = "0"
charitybutton.style.background = "rgba(0, 0, 0, 0)";
charitybutton.id = "charitybutton";

charitybutton.addEventListener("click", () => window.location.href = "https://google.com");

let charityimage = document.createElement("img");
charityimage.src = "charities/" + poemcharity + ".svg";
charityimage.style.width = "100%"; //String(document.documentElement.clientWidth / 5);

let charitytitle = document.createElement("h2");
charitytitle.appendChild(document.createTextNode(poemcharity));

charitybutton.appendChild(charityimage);
charitybutton.appendChild(charitytitle);  // uncomment this if u want the title back
document.getElementById("leftpane").appendChild(charitybutton);

// document.getElementById("leftpane").appendChild(charityimage);


document.getElementById("leftpane").appendChild(document.createElement("br"));
document.getElementById("leftpane").appendChild(document.createElement("br"));

// write the abt charity

let aboutchar = document.createElement("p");

// import { getDescription } from "../../charities/charityinfo.js";
aboutchar.appendChild(document.createTextNode("description will go here"));

document.getElementById("leftpane").appendChild(aboutchar);