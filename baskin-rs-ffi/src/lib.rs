use baskin_rs::*;

#[repr(u8)]
pub enum GenerationResult {
    Ok = 0,
    FileSaveError = 1,
}

#[no_mangle]
pub fn generate_mandelbrot(n_iters: u32) -> GenerationResult {
    let image = Mandelbrot { n_iters: n_iters as usize, .. Mandelbrot::default() }
        .generate()
        .filter_pass(GrayExponentialFilter { multiplier: 1.0, power: 0.1 })
        .filter_pass(Quantization8)
        .render();

    // attempt to save the image and convert the result to an exit code
    match image.save(format!("basic_{}.png", n_iters)) {
        Ok(_) => GenerationResult::Ok,
        Err(_) => GenerationResult::FileSaveError,
    }
}
