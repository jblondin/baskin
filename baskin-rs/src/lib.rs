use image::{GrayImage, ImageBuffer, Luma};
use ndarray::{Array2, ShapeBuilder};
use num_complex::Complex64;
use rayon::prelude::*;

pub struct Xy<T> {
    x: T,
    y: T,
}
impl<T> Xy<T> where T: Clone {
    pub fn to_tuple(&self) -> (T, T) {
        (self.x.clone(), self.y.clone())
    }
}

pub type Dims = Xy<usize>;

pub struct ComplexCamera {
    /// Image dimensions
    pub image_dims: Dims,
    /// image zoom level
    pub zoom: f64,
    /// complex plane coordinates of center
    pub center: Complex64
}
impl Default for ComplexCamera {
    fn default() -> ComplexCamera {
        ComplexCamera {
            image_dims: Xy { x: 1024, y: 1024 },
            zoom: 0.3,
            center: Complex64 { re: -0.5, im: 0.0 }
        }
    }
}

/// Translates scene coordinates into image coordinates and vice versa.
pub trait Camera<SceneCoord, ImageCoord> {
    fn scene_to_image(&self, scene_coords: SceneCoord) -> ImageCoord;
    fn image_to_scene(&self, image_coords: ImageCoord) -> SceneCoord;
}
impl Camera<Complex64, Xy<usize>> for ComplexCamera {
    fn scene_to_image(&self, scene_coords: Complex64) -> Xy<usize> {
        let Complex64 { re, im } = scene_coords;
        let Xy { x: height, y: width } = self.image_dims;
        let Complex64 { re: cre, im: cim } = self.center;
        Xy {
            x: ((re - cre) * self.zoom + 0.5) as usize * width,
            y: ((im - cim) * self.zoom + 0.5) as usize * height,
        }
    }
    fn image_to_scene(&self, image_coords: Xy<usize>) -> Complex64 {
        let Xy { x, y } = image_coords;
        let Xy { x: height, y: width } = self.image_dims;
        let Complex64 { re: cre, im: cim } = self.center;
        Complex64 {
            re: (x as f64 / width as f64 - 0.5) / self.zoom + cre,
            im: (y as f64 / height as f64 - 0.5) / self.zoom + cim,
        }
    }
}

pub struct Mandelbrot {
    pub camera: ComplexCamera,
    pub n_iters: usize,
    pub escape_threshold: f64,
}
impl Default for Mandelbrot {
    fn default() -> Mandelbrot {
        Mandelbrot {
            camera: ComplexCamera::default(),
            n_iters: 1000,
            escape_threshold: 100.0,
        }
    }
}

pub trait Generator<Target> {
    fn generate(&self) -> Target;
}
impl Generator<Array2<f64>> for Mandelbrot {
    fn generate(&self) -> Array2<f64> {
        let mut histogram = Array2::<f64>::zeros(self.camera.image_dims.to_tuple().f());

        histogram.indexed_iter_mut().par_bridge()
            .for_each(|(idx, value)| {
                let c = self.camera.image_to_scene(Xy { x: idx.0, y: idx.1 });
                let mut z = Complex64 { re: 0.0, im: 0.0 };
                for i in 0..self.n_iters {
                    z = z * z + c;
                    let escape_value = (z * z.conj()).re;
                    if escape_value > self.escape_threshold {
                        *value = i as f64 + (1.0 - (escape_value.log2() / 2.0).log2());
                        return;
                    }
                }
            });
        histogram
    }
}

pub trait Filter<In> {
    type Out;
    fn filter(&self, input: In) -> Self::Out;
}

pub struct GrayExponentialFilter {
    pub multiplier: f64,
    pub power: f64,
}
impl Default for GrayExponentialFilter {
    fn default() -> GrayExponentialFilter {
        GrayExponentialFilter {
            multiplier: 2.0,
            power: 0.5,
        }
    }
}
impl Filter<Array2<f64>> for GrayExponentialFilter {
    type Out = Array2<f64>;
    fn filter(&self, mut input: Array2<f64>) -> Array2<f64> {
        // check to make sure we have input data with no NANs (so unwraps are somewhat safe)
        debug_assert![input.len() > 0];
        debug_assert![input.iter().all(|&x| x != std::f64::NAN)];

        let max = input.iter().max_by(|&l, &r| l.partial_cmp(r).unwrap()).unwrap();
        let min = input.iter().min_by(|&l, &r| l.partial_cmp(r).unwrap()).unwrap();
        let range = max - min;
        for value in input.iter_mut() {
            *value = (self.multiplier * *value / range).powf(self.power);
        }
        input
    }
}

pub struct Quantization8;
impl Filter<Array2<f64>> for Quantization8 {
    type Out = Array2<u8>;
    fn filter(&self, input: Array2<f64>) -> Array2<u8> {
        input.map(|value| {
            match value {
                &x if x > 1.0 => 255u8,
                &x if x < 0.0 => 0u8,
                x => (x * 255.0) as u8
            }
        })
    }
}

pub trait FilterPass<F>: Sized  where F: Filter<Self> {
    fn filter_pass(self, filter: F) -> F::Out;
}
impl<T, F> FilterPass<F> for T where F: Filter<T> {
    fn filter_pass(self, filter: F) -> F::Out { filter.filter(self) }
}

pub trait Render<Out> {
    fn render(self) -> Out;
}
impl Render<Vec<u8>> for Array2<u8> {
    fn render(self) -> Vec<u8> {
        let n = self.len();
        self.into_shape(n).unwrap().to_vec()
    }
}
impl Render<GrayImage> for Array2<u8> {
    fn render(self) -> GrayImage {
        ImageBuffer::from_fn(
            self.dim().1 as u32,
            self.dim().0 as u32,
            |x, y| { Luma([self[(x as usize, y as usize)]]) }
        )
    }
}
