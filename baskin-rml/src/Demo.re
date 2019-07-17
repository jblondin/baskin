type xy('a) = { x: 'a, y: 'a };
type dims = xy(int);
type complex = xy(float);

type complex_camera = { image_dims: dims, zoom: float, center: complex };
let default_complex_camera = () => {
    image_dims: { x: 1024, y: 1024 },
    zoom: 0.3,
    center: { x: -0.5, y: 0.0 },
};

let scene_to_image = (camera, scene_coord) => {
    x: ((scene_coord.x -. camera.center.x) *. camera.zoom +. 0.5)
        *. float_of_int(camera.image_dims.x),
    y: ((scene_coord.y -. camera.center.y) *. camera.zoom +. 0.5)
        *. float_of_int(camera.image_dims.y),
};
let image_to_scene = (camera, image_coord) => {
    x: (float_of_int(image_coord.x) /. float_of_int(camera.image_dims.x) -. 0.5)
        /. camera.zoom +. camera.center.x,
    y: (float_of_int(image_coord.y) /. float_of_int(camera.image_dims.y) -. 0.5)
        /. camera.zoom +. camera.center.y,
};

let conj = (c: complex): complex => { x: c.x, y: -1.0 *. c.y };
let mul = (l: complex, r: complex): complex => {
    x: l.x *. r.x -. l.y *. r.y,
    y: l.x *. r.y +. l.y *. r.x
};
let plus = (l: complex, r: complex): complex => { x: l.x +. r.x, y: l.y +. r.y };
let ln2 = () => log(2.0);
let log2 = (x: float) => log(x) /. ln2();

type mandelbrot = { camera: complex_camera, n_iters: int, escape_threshold: float };
let default_mandelbrot = () => {
    camera: default_complex_camera(),
    n_iters: 1000,
    escape_threshold: 100.0,
};
let generate = (generator) => {
    let idims = generator.camera.image_dims;
    let arr = Array.make(idims.x * idims.y, 0.0);

    for (x in 0 to idims.x - 1) {
        for (y in 0 to idims.y - 1) {
            let c = image_to_scene(generator.camera, { x, y });
            let z = ref({ x: 0.0, y: 0.0 });
            let idx = y * idims.x + x;
            let break = ref(false);
            let i = ref(0);
            while (! break^) {
                z := plus(mul(z^, z^), c);
                let conj_z = conj(z^);
                let escape_value = z^.x *. conj_z.x -. z^.y *. conj_z.y;
                if (escape_value > generator.escape_threshold) {
                    arr[idx] = float_of_int(i^) +. (1.0 -. log2(log2(escape_value) /. 2.0));
                    break := true;
                } else {
                    i := i^ + 1;
                    if (i^ >= generator.n_iters) {
                        break := true;
                    }
                }
            }
        }
    }
    arr
};

type gray_filter = { multiplier: float, power: float }
let default_gray_filter = () => { multiplier: 2.0, power: 0.5 };
let filter = (arr, filter) => {
    let (min, max) = Array.fold_left((acc, value) => {
        let (min, max) = acc;
        (value < min ? value : min, value > max ? value : max)
    }, (infinity, neg_infinity), arr);
    let range = max -. min;
    Array.map((value) => (filter.multiplier *. value /. range) ** filter.power, arr)
};

let quantize = (arr) => {
    Array.map(
        (value) => int_of_float(value > 1.0 ? 255.0 : (value < 0.0 ? 0.0 : value *. 255.0)),
        arr
    )
};

let img = generate({ ...default_mandelbrot(), n_iters: 100 })
    ->filter({ multiplier: 1.0, power: 0.1 })
    ->quantize;

// let img_data = Node.Buffer.from(img);

// Sharp.sharp(img);
// [@bs.module] external sharp: Node.buffer => Js.Object => Sharp = "sharp";


