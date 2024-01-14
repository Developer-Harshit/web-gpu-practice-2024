import { TriangleMesh } from "./triangle-mesh";

import shader from "../shaders/shader.wgsl?raw";
import { mat4 } from "gl-matrix";
import { Material } from "./material";
import { msg } from "./debug";
import { Camera } from "../model/camera";

export class Renderer {
	cnv: HTMLCanvasElement;
	t: number;

	// Device/Ctx objects
	adapter: GPUAdapter;
	device: GPUDevice;
	ctx: GPUCanvasContext;
	format: GPUTextureFormat;

	// Pipeline objects
	bindGroup: GPUBindGroup;
	uniformBuffer: GPUBuffer;
	pipeline: GPURenderPipeline;

	// depth stencil
	depthStencilState: GPUDepthStencilState;
	depthStencilTexture: GPUTexture;
	depthStencilView: GPUTextureView;
	depthStencilAttachment: GPURenderPassDepthStencilAttachment;

	// assets
	mesh: TriangleMesh;
	material: Material;
	objectBuffer: GPUBuffer;

	constructor(cnv: HTMLCanvasElement) {
		this.cnv = cnv;
		this.t = 0.0;
	}
	async setup_device() {
		this.adapter = (await navigator.gpu.requestAdapter()) as GPUAdapter;
		this.device = (await this.adapter.requestDevice()) as GPUDevice;
		this.ctx = this.cnv.getContext("webgpu") as GPUCanvasContext;
		this.format = "bgra8unorm" as GPUTextureFormat;
		this.ctx.configure({
			device: this.device,
			format: this.format,
			alphaMode: "opaque",
		});
	}
	async create_assets() {
		this.mesh = new TriangleMesh(this.device);
		this.material = new Material();

		const modelBufferDescriptor: GPUBufferDescriptor = {
			size: 64 * 1024,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		};
		this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);

		await this.material.init(this.device, "/sample.jpg");
	}
	async make_depth_stencil() {
		// Creating Depth State
		this.depthStencilState = {
			format: "depth24plus-stencil8",
			depthWriteEnabled: true,
			depthCompare: "less-equal",
		};

		// Creating Depth Texture
		const size: GPUExtent3D = {
			width: this.cnv.width,
			height: this.cnv.height,
			depthOrArrayLayers: 1,
		};
		const textureDescriptor: GPUTextureDescriptor = {
			size,
			format: "depth24plus-stencil8",
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		};
		this.depthStencilTexture = this.device.createTexture(textureDescriptor);

		// Creating Depth Texture View
		const viewDescriptor: GPUTextureViewDescriptor = {
			format: "depth24plus-stencil8",
			dimension: "2d",
			aspect: "all",
		};
		this.depthStencilView = this.depthStencilTexture.createView(viewDescriptor);

		// Creating depth Attachment
		this.depthStencilAttachment = {
			view: this.depthStencilView,
			depthClearValue: 1.0,
			depthLoadOp: "clear",
			depthStoreOp: "store",
			stencilLoadOp: "clear",
			stencilStoreOp: "discard",
		};
	}
	async make_pipeline() {
		this.uniformBuffer = this.device.createBuffer({
			// No. of byte per matrix will be  4 * 4 * 32 / 8 = 64
			// and we are passsing 3 matrix 64 * 2 ie projection and view
			size: 64 * 2,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		const bindGroupLayout = this.device.createBindGroupLayout({
			entries: [
				// transformUBO
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {},
				},
				// mytexture
				{
					binding: 1,
					visibility: GPUShaderStage.FRAGMENT,
					texture: {},
				},
				// mysampler
				{
					binding: 2,
					visibility: GPUShaderStage.FRAGMENT,
					sampler: {},
				},
				// objects buffer
				{
					binding: 3,
					visibility: GPUShaderStage.VERTEX,
					buffer: {
						type: "read-only-storage",
						hasDynamicOffset: false,
					},
				},
			],
		});

		this.bindGroup = this.device.createBindGroup({
			layout: bindGroupLayout,
			// actually passing buffer
			entries: [
				// uniform buffer
				{
					binding: 0,
					resource: {
						buffer: this.uniformBuffer,
					},
				},
				// texture
				{
					binding: 1,
					resource: this.material.view,
				},
				// sampler
				{
					binding: 2,
					resource: this.material.sampler,
				},
				// objects
				{
					binding: 3,
					resource: { buffer: this.objectBuffer },
				},
			],
		});

		const pipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [bindGroupLayout],
		});
		this.pipeline = this.device.createRenderPipeline({
			layout: pipelineLayout,
			vertex: {
				module: this.device.createShaderModule({
					code: shader,
				}),
				entryPoint: "vs_main",
				buffers: [this.mesh.bufferLayout],
			},
			fragment: {
				module: this.device.createShaderModule({
					code: shader,
				}),
				entryPoint: "fs_main",
				targets: [
					{
						format: this.format,
					},
				],
			},
			primitive: {
				topology: "triangle-list",
			},
			depthStencil: this.depthStencilState,
		});
	}
	async render(
		camera: Camera,
		triangles: Float32Array,
		triangle_count: number
	) {
		// creating projection
		const projection = mat4.create();
		mat4.perspective(projection, Math.PI / 4, 300 / 300, 0.1, 10);
		// creating view
		const view = camera.get_view();
		this.device.queue.writeBuffer(
			this.objectBuffer,
			0,
			triangles,
			0,
			triangles.length
		);
		this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
		this.device.queue.writeBuffer(
			this.uniformBuffer,
			64,
			<ArrayBuffer>projection
		);

		const commandEncoder =
			this.device.createCommandEncoder() as GPUCommandEncoder;

		const textureView = this.ctx
			.getCurrentTexture()
			.createView() as GPUTextureView;
		const renderPass = commandEncoder.beginRenderPass({
			colorAttachments: [
				{
					view: textureView,
					clearValue: { r: 0.11, g: 0.03, b: 0.16, a: 1.0 },
					loadOp: "clear",
					storeOp: "store",
				},
			],
			depthStencilAttachment: this.depthStencilAttachment,
		});
		renderPass.setPipeline(this.pipeline);
		renderPass.setVertexBuffer(0, this.mesh.buffer);
		renderPass.setBindGroup(0, this.bindGroup);
		renderPass.draw(3, triangle_count, 0, 0);
		renderPass.end();

		this.device.queue.submit([commandEncoder.finish()]);
	}
	async init() {
		msg("loading");
		await this.setup_device();
		msg("setted device");
		await this.make_depth_stencil();
		msg("created depth stencil");
		await this.create_assets();
		msg("got assets");
		await this.make_pipeline();
		msg("initialized");
	}
}
