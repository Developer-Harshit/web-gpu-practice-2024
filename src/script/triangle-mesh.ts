export class TriangleMesh {
	buffer: GPUBuffer;
	bufferLayout: GPUVertexBufferLayout;
	constructor(device: GPUDevice) {
		// x y z r g b of three vertices
		const vertices = new Float32Array([
			// vet1
			1.0, 0.0, 0.0, 1.0, 0.0, 0.6,
			// vert 2
			-1.0, -1.0, 0.0, 0.0, 1.0, 0.6,
			// vert 3
			-1.0, 1.0, 0.0, 0.3, 0.3, 1.0,
		]);
		//
		// defining how this buffer will be used
		// VERTEX flag means its visible to vertex shader
		// COPY_DST means to copy data after buffer is created
		const usage: GPUBufferUsageFlags =
			GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
		//
		// info used by buffer to create things
		// mappedAtCreation is used to do advanced stuff
		const descriptor: GPUBufferDescriptor = {
			size: vertices.byteLength,
			usage,
			mappedAtCreation: true,
		};
		//
		// actually creating buffer
		this.buffer = device.createBuffer(descriptor);
		new Float32Array(this.buffer.getMappedRange()).set(vertices);
		this.buffer.unmap();
		//
		// making layout for some reason
		// arrayStride is no. of byte to b/w one vertex to other,
		// here its 6 * 32 /8 = 24
		// offset is the starting coords of the attribute ,
		// here we define positon then color attribute
		this.bufferLayout = {
			arrayStride: 24,
			attributes: [
				{ shaderLocation: 0, format: "float32x3", offset: 0 },
				{ shaderLocation: 1, format: "float32x3", offset: 12 },
			],
		};
	}
}
