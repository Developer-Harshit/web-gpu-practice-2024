@group(0) @binding(0) var color_buffer : texture_storage_2d<rgba8unorm,write>;


struct Sphere {
    center: vec3<f32>,
    radius: f32,
}

struct Ray {
    direction: vec3<f32>,
    origin: vec3<f32>,
}


// each function will handle one pixel
@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) InvoID :vec3<u32> ){
  // invocation id is like the coords of pixel a group is working

  let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));

  let screen_pos : vec2<i32> = vec2<i32>(i32(InvoID.x),i32(InvoID.y));


  if (screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y) {
      return;
  }

  let horizontal_coefficient: f32 = (f32(screen_pos.x) - f32(screen_size.x) / 2) / f32(screen_size.x);
  let vertical_coefficient: f32 = (f32(screen_pos.y) - f32(screen_size.y) / 2) / f32(screen_size.x);
  let forwards: vec3<f32> = vec3<f32>(1.0, 0.0, 0.0);
  let right: vec3<f32> = vec3<f32>(0.0, -1.0, 0.0);
  let up: vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);

  var mySphere: Sphere;
  mySphere.center = vec3<f32>(3.0, 0.0, 0.0);
  mySphere.radius = 0.5;

  var myRay: Ray;
  myRay.direction = normalize(forwards + horizontal_coefficient * right + vertical_coefficient * up);
  myRay.origin = vec3<f32>(0.0, 0.0, 0.0);

   var pixel_color : vec3<f32> = vec3<f32>(0.13,0.03,0.16);

  if (hit(myRay, mySphere)) {
        pixel_color = vec3<f32>(1.0,0.2,0.3);
    }

  textureStore(color_buffer,screen_pos,vec4<f32>(pixel_color,1.0));
  
}

fn hit(ray: Ray, sphere: Sphere) -> bool {
    
    let a: f32 = dot(ray.direction, ray.direction);
    let b: f32 = 2.0 * dot(ray.direction, ray.origin - sphere.center);
    let c: f32 = dot(ray.origin - sphere.center, ray.origin - sphere.center) - sphere.radius * sphere.radius;
    let discriminant: f32 = b * b - 4.0 * a * c;

    return discriminant > 0;
    
}