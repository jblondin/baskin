use baskin_rs::*;

fn main() -> Result<(), std::io::Error> {
    let mut args = std::env::args();
    args.next(); // skip executable name
    let n_iters = args.next().and_then(|str_niters| str_niters.parse::<usize>().ok());
    let mandelbrot = match n_iters {
        Some(n_iters) => Mandelbrot { n_iters, .. Mandelbrot::default() },
        None => Mandelbrot::default()
    };
    mandelbrot
        .generate()
        .filter_pass(GrayExponentialFilter { multiplier: 1.0, power: 0.1 })
        .filter_pass(Quantization8)
        .render()
        .save("basic.png")
}