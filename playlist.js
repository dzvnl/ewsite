// --- This is the FINAL test ---
// I've put your Netlify URL in, just like before.

const baseURL = "https://6918d613edf05dd80c139242--ewsmusic.netlify.app/";

// --- THE FIX IS HERE ---
// I am now adding "music/" before every filename.
//
// !!! If your folder is NOT named "music",
// just change "music/" to "YOUR_FOLDER_NAME/" in the 4 songs below.

const playlist = [
    {
        title: "Digital Bath",
        artist: "Deftones",
        src: baseURL + "music/digitalbath.mp3",
        cover: baseURL + "music/deftones.jpg"
    },
    {
        title: "Xtal",
        artist: "Aphex Twin",
        src: baseURL + "music/xtal.mp3",
        cover: baseURL + "music/aphex.jpg"
    },
    {
        title: "I Don't Wanna Be Me",
        artist: "Type O Negative",
        src: baseURL + "music/idontwannabeme.mp3",
        cover: baseURL + "music/ton.jpg"
    },
    {
        title: "Bite My Lip",
        artist: "fakemink",
        src: baseURL + "music/bitemylip.mp3",
        cover: baseURL + "music/fakemink.jpg"
    }
];


