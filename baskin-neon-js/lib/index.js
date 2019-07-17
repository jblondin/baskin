const fs = require('fs');
const baskin_lib = require('../native');
const sharp = require('sharp');

setTimeout(() => {
    let img = baskin_lib.generate(1000);
    sharp(img, { raw: { width: 1024, height: 1024, channels: 1 }})
        .toFile('test.png', (err, info) => {
            if (err) throw err;
            console.log("Write info:");
            console.log(info);
        })
}, 0)
