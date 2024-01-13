import { TriangleMesh } from "./triangle-mesh";

import shader from "../shader/shader.wgsl?raw";
import { mat4 } from "gl-matrix";
import { Material } from "./material";
import { msg } from "./debug";
import { Camera } from "../model/camera";
import { Triangle } from "../model/triangle";

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

	// assets
	mesh: TriangleMesh;
	material: Material;

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

		await this.material.init(this.device, "/sample.jpg");
	}
	async make_pipeline() {
		this.uniformBuffer = this.device.createBuffer({
			// No. of byte per matrix will be  4 * 4 * 32 / 8 = 64
			// and we are passsing 3 matrix 64 * 3
			size: 64 * 3,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		const bindGroupLayout = this.device.createBindGroupLayout({
			entries: [
				{
					// decalaring where the matrix will be binded and shown
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {},
				},
				// declaring texture
				{
					binding: 1,
					visibility: GPUShaderStage.FRAGMENT,
					texture: {},
				},
				// declaring sampler
				{
					binding: 2,
					visibility: GPUShaderStage.FRAGMENT,
					sampler: {},
				},
			],
		});

		this.bindGroup = this.device.createBindGroup({
			layout: bindGroupLayout,
			// actually passing buffer
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.uniformBuffer,
					},
				},
				{
					binding: 1,
					resource: this.material.view,
				},
				{
					binding: 2,
					resource: this.material.sampler,
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
		}) as GPURenderPipeline;
	}

	async render(camera: Camera, triangles: Triangle[]) {
		// creating projection
		const projection = mat4.create();
		mat4.perspective(projection, Math.PI / 4, 300 / 300, 0.1, 10);

		// creating view
		const view = camera.get_view();

		this.device.queue.writeBuffer(
			this.uniformBuffer,
			64 * 1,
			<ArrayBuffer>view
		);
		this.device.queue.writeBuffer(
			this.uniformBuffer,
			64 * 2,
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
					clearValue: { r: 0.11, g: 0.95, b: 0.16, a: 1.0 },
					loadOp: "clear",
					storeOp: "store",
				},
			],
		}) as GPURenderPassEncoder;
		renderPass.setPipeline(this.pipeline);
		renderPass.setVertexBuffer(0, this.mesh.buffer);

		triangles.forEach((triangle) => {
			const model = triangle.get_model();
			this.device.queue.writeBuffer(
				this.uniformBuffer,
				64 * 0,
				<ArrayBuffer>model
			);
			renderPass.setBindGroup(0, this.bindGroup);
			renderPass.draw(3, 1, 0, 0);
		});

		renderPass.end();
		this.device.queue.submit([commandEncoder.finish()]);
	}
	async init() {
		msg("loading");
		await this.setup_device();
		msg("setted device");
		await this.create_assets();
		msg("got assets");
		await this.make_pipeline();
		msg("initialized");
	}
}
