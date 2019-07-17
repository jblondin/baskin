#[macro_use]
extern crate neon;
extern crate baskin_rs;

use neon::prelude::*;
use baskin_rs::*;

fn generate_mandelbrot(n_iters: u32) -> Vec<u8> {
    Mandelbrot { n_iters: n_iters as usize, .. Mandelbrot::default() }
        .generate()
        .filter_pass(GrayExponentialFilter { multiplier: 1.0, power: 0.1 })
        .filter_pass(Quantization8)
        .render()
}

trait IntoJsBuffer {
    fn into_js_buffer<'a, C: Context<'a>>(self, cx: &mut C) -> Handle<'a, JsBuffer>;
}
impl IntoJsBuffer for Vec<u8> {
    fn into_js_buffer<'a, C: Context<'a>>(mut self, cx: &mut C) -> Handle<'a, JsBuffer> {
        let js_buffer = JsBuffer::new(cx, self.len() as u32).unwrap();
        for (i, value) in self.drain(..).enumerate() {
            let js_value = cx.number(value);
            js_buffer.set(cx, i as u32, js_value).unwrap();
        }
        js_buffer
    }
}

fn generate(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    let n_iters = cx.argument::<JsNumber>(0)?.value();
    let img_data = generate_mandelbrot(n_iters as u32);
    let img_buff = img_data.into_js_buffer(&mut cx);
    Ok(img_buff)
}

register_module!(mut cx, {
    cx.export_function("generate", generate)
});
