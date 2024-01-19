import { TriangleMesh } from "./triangle-mesh";

import shader from "../shaders/shader.wgsl?raw";
import { mat4 } from "gl-matrix";
import { Material } from "./material";
import { msg } from "./debug";

import { QuadMesh } from "./quad-mesh";
import { ObjectTypes, RenderData } from "../model/definations";

export class Renderer {
	cnv: HTMLCanvasElement;
	t: number;

	// Device/Ctx objects
	adapter: GPUAdapter;
	device: GPUDevice;
	ctx: GPUCanvasContext;
	format: GPUTextureFormat;

	// Pipeline objects
	triangleBindGroup: GPUBindGroup;
	quadBindGroup: GPUBindGroup;

	uniformBuffer: GPUBuffer;
	pipeline: GPURenderPipeline;

	// depth stencil
	depthStencilState: GPUDepthStencilState;
	depthStencilTexture: GPUTexture;
	depthStencilView: GPUTextureView;
	depthStencilAttachment: GPURenderPassDepthStencilAttachment;

	// assets
	triangleMesh: TriangleMesh;
	triangleMaterial: Material;

	quadMesh: QuadMesh;
	quadMaterial: Material;

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
		// triangle
		this.triangleMesh = new TriangleMesh(this.device);
		this.triangleMaterial = new Material();
		// quad
		this.quadMesh = new QuadMesh(this.device);
		this.quadMaterial = new Material();

		const modelBufferDescriptor: GPUBufferDescriptor = {
			size: 64 * 1024,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		};
		this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);

		await this.quadMaterial.init(this.device, "/sample1.jpg");
		await this.triangleMaterial.init(this.device, "/sample2.jpg");
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
		// for triangles
		this.triangleBindGroup = this.device.createBindGroup({
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
					resource: this.triangleMaterial.view,
				},
				// sampler
				{
					binding: 2,
					resource: this.triangleMaterial.sampler,
				},
				// objects
				{
					binding: 3,
					resource: { buffer: this.objectBuffer },
				},
			],
		});
		// for quads
		this.quadBindGroup = this.device.createBindGroup({
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
					resource: this.quadMaterial.view,
				},
				// sampler
				{
					binding: 2,
					resource: this.quadMaterial.sampler,
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
				buffers: [this.triangleMesh.bufferLayout],
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
	async render(render_data: RenderData) {
		// creating projection
		const projection = mat4.create();
		mat4.perspective(projection, Math.PI / 4, 300 / 300, 0.1, 10);
		// creating view
		const view = render_data.view;

		// model
		this.device.queue.writeBuffer(
			this.objectBuffer,
			0,
			render_data.model,
			0,
			render_data.model.length
		);
		// view
		this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);

		// projection
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
		var obj_drawn = 0;

		// triangle
		let triangle_count = render_data.counts[ObjectTypes.TRIANGLE];
		renderPass.setVertexBuffer(0, this.triangleMesh.buffer);
		renderPass.setBindGroup(0, this.triangleBindGroup);
		renderPass.draw(3, triangle_count, 0, obj_drawn);
		obj_drawn += triangle_count;

		// quad
		let quad_count = render_data.counts[ObjectTypes.QUAD];
		renderPass.setVertexBuffer(0, this.quadMesh.buffer);
		renderPass.setBindGroup(0, this.quadBindGroup);
		renderPass.draw(6, quad_count, 0, obj_drawn);
		obj_drawn += quad_count;

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
