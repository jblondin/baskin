# baskin

31 flavors (well, almost) of Mandelbrot fractal generation.

## Subprojects

* `baskin-rs` - Multithreaded Rust fractal generation library
* `baskin-rs-ffi` - Tiny FFI-friendly wrapper around `baskin-rs` for creating a sample fractal
* `basin-js` - Vanilla javascript client using `baskin-rs-ffi`
* `baskin-neon-js` - [Neon](https://neon-bindings.com/)-based wrapper around `baskin-rs` (in `baskin-neon-js/native`) and javascript client (in `baskin-neon-js/lib`)
* `baskin-ts` - Typescript fractal generation code
* `baskin-rml` - ReasonML fractal generation code