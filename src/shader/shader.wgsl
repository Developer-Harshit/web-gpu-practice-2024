// model view projection - MVP
struct TransformData {
  model: mat4x4<f32>,
  view: mat4x4<f32>,
  projection : mat4x4<f32>
}
// defining uniform binding it in memory
@binding(0) @group(0)  var<uniform> transformUBO : TransformData;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>
}

@vertex
fn vs_main(@location(0) vertexPosition: vec3<f32> , @location(1) vertexColor: vec3<f32>) -> Fragment {
    var output : Fragment ;

    output.Position = transformUBO.projection * transformUBO.view * transformUBO.model * vec4<f32>(vertexPosition,1.0);
    output.Color = vec4<f32>(vertexColor,1.0);
    return output;
    
}
// location VarName : varType -> returnLocation returnType
@fragment
fn fs_main(@location(0) Color:  vec4<f32> ) -> @location(0) vec4<f32>{
    return Color;
}
