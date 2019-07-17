const ffi = require('ffi');
const baskin_lib_path = '../baskin-rs-ffi/target/release/libbaskin_rs_ffi';
const baskin_lib = ffi.Library(baskin_lib_path, {
    'generate_mandelbrot': [ 'uint8', [ 'uint32' ] ],
});

let handler = (name, err, res) => {
    if (err) throw err;
    console.log("Return value from " + name + ": " + res);
};
baskin_lib.generate_mandelbrot.async(10000, handler.bind(null, 'generate'));
console.log("Script ended!");
