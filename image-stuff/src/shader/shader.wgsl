
@binding(0) @group(0) var myTexture: texture_2d<f32>;
@binding(1) @group(0) var mySampler: sampler;

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>
};

@vertex
fn vs_main(@location(0) vertexPostion: vec3<f32>, @location(1) vertexTexCoord: vec2<f32>) -> Fragment {

    var output : Fragment;
    output.Position =  vec4<f32>(vertexPostion, 1.0);
    output.TexCoord = vertexTexCoord;

    return output;
}

@fragment
fn fs_main(@location(0) TexCoord : vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(myTexture, mySampler, TexCoord);
}