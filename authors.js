var authors = {
    "Spencer Hill": ["is a student and young poet from California with a heavy interest in creative writing, philosophy, and mathematics. His work has appeared in the Creative Youth Awards, and is currently working on a creative writing anthology with other youth writers in the SF Bay Area.",
    [
        "A Mechanic's Apostrophe to Nature",
        "[Dis]abled"
    ]]
}


export function getAuthorInfo(name) {
    return authors[name]
}


export function convertSpaces (strToConvert) {
    let toReturn = ""
    for (let i = 0; i < strToConvert.length; i++) {
        if (strToConvert.charAt(i) == " ") {
            toReturn = toReturn + "+"
        }
        else {
            toReturn = toReturn + strToConvert.charAt(i)
        }
    }
    return toReturn
}


// import { convertSpaces } from "./scripts/main"
export function generatehref(poemname) {
    // let ppath = ""
    // for (c of poemname) {
    //     if (c == " ") {
    //         ppath = ppath + "+"
    //     }
    //     else {
    //         ppath = ppath + c
    //     }
    // }
    // return "../" + ppath + "index.html"

    return "../" + convertSpaces(poemname) + "/index.html"
}