var charities = {
    "The Nature Conservancy": [
        'We are dedicated staff, scientists and members advancing effective, lasting conservation in more than 70 countries and territories. To make the highest possible impact on the climate and biodiversity crises between now and 2030, we’re developing breakthrough ideas, amplifying local leaders and influencing policy. There are so many ways to make positive change for our planet. Volunteer with us. Learn how to reduce your carbon footprint. Donate to conservation work.',
        "https://preserve.nature.org/page/80429/donate/1",
        "The Nature Conservancy.svg"
    ],
    "Hydrocephalus Association": [
        `Hydrocephalus is a chronic, neurological condition caused by an abnormal accumulation of cerebrospinal fluid (CSF) within the cavities (ventricles) of the brain. The mission of the Hydrocephalus Association is to find a cure for hydrocephalus and improve the lives of those impacted by the condition. But we can’t do it alone. Help us change the future of hydrocephalus by supporting the Hydrocephalus Association!`,
        "https://www.hydroassoc.org/",
        "Hydrocephalus Association.webp"
    ]
};


export function getDescription (name) {
    return charities[name][0]
};

export function getLink (name) {
    return charities[name][1]
}

export function getLogo (name) {
    return charities[name][2]
}

// export function about() {
//     return 'We are dedicated staff, scientists and members advancing effective, lasting conservation in more than 70 countries and territories. To make the highest possible impact on the climate and biodiversity crises between now and 2030, we’re developing breakthrough ideas, amplifying local leaders and influencing policy. There are so many ways to make positive change for our planet. Volunteer with us. Learn how to reduce your carbon footprint. Donate to conservation work.'
// }

// export function link() {
//     return "https://preserve.nature.org/page/80429/donate/1"
// }