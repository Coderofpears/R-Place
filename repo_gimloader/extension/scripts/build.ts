import fs from 'fs';

// firefox or chrome
let isFirefox = process.argv[2] === "firefox";

// clear the build directory
if(fs.existsSync("./build")) fs.rmSync("./build", { recursive: true });
fs.mkdirSync("./build");

if(!fs.existsSync("./build/images")) {
    fs.cpSync('./images', './build/images', { recursive: true });
}
fs.copyFileSync('./edit_csp.json', './build/edit_csp.json');
fs.copyFileSync('./block_scripts.json', './build/block_scripts.json');
fs.copyFileSync('./pages/popup.html', './build/popup.html');

if(isFirefox) {
    fs.copyFileSync('./pages/editor_firefox.html', './build/editor.html');
} else {
    fs.copyFileSync('./pages/editor_chrome.html', './build/editor.html');
}

let manifest: any;
if(isFirefox) {
    manifest = JSON.parse(fs.readFileSync('./manifest.firefox.json').toString());
} else {
    manifest = JSON.parse(fs.readFileSync('./manifest.chrome.json').toString());
}

let pkg = JSON.parse(fs.readFileSync('../package.json').toString());
manifest.version = pkg.version;

fs.writeFileSync('./build/manifest.json', JSON.stringify(manifest, null, 4));