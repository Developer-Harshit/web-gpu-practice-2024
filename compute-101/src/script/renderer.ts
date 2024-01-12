import raytracerKernel from "../shader/kernel.wgsl?raw";
import screenShader from "../shader/screen.wgsl?raw";

import { msg } from "./debug";

export class Renderer {
	cnv: HTMLCanvasElement;
	t: number;

	// Device/Ctx objects
	adapter: GPUAdapter;
	device: GPUDevice;
	ctx: GPUCanvasContext;
	format: GPUTextureFormat;

	// Pipeline objects
	screenBindGroup: GPUBindGroup;
	screenPipeline: GPURenderPipeline;

	kernelBindGroup: GPUBindGroup;
	kernelPipeline: GPUComputePipeline;

	// assets
	colorBuffer: GPUTexture;
	colorBufferView: GPUTextureView;
	sampler: GPUSampler;

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
		this.colorBuffer = this.device.createTexture({
			size: {
				width: this.cnv.width,
				height: this.cnv.height,
			},
			format: "rgba8unorm",
			usage:
				GPUTextureUsage.COPY_DST |
				GPUTextureUsage.STORAGE_BINDING |
				GPUTextureUsage.TEXTURE_BINDING,
		});
		this.colorBufferView = this.colorBuffer.createView();
		this.sampler = this.device.createSampler({
			addressModeU: "repeat",
			addressModeV: "repeat",
			magFilter: "linear",
			minFilter: "nearest",
			mipmapFilter: "nearest",
			maxAnisotropy: 1,
		});
	}
	async make_pipeline() {
		// compute pipeline
		const kernelBindGroupLayout = this.device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.COMPUTE,
					storageTexture: {
						access: "write-only",
						format: "rgba8unorm",
						viewDimension: "2d",
					},
				},
			],
		});
		this.kernelBindGroup = this.device.createBindGroup({
			layout: kernelBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: this.colorBufferView,
				},
			],
		});
		const kernelPipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [kernelBindGroupLayout],
		});
		this.kernelPipeline = this.device.createComputePipeline({
			layout: kernelPipelineLayout,
			compute: {
				module: this.device.createShaderModule({
					code: raytracerKernel,
				}),
				entryPoint: "main",
			},
		});

		// render pipeline
		const screenBindGroupLayout = this.device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.FRAGMENT,
					sampler: {},
				},
				{
					binding: 1,
					visibility: GPUShaderStage.FRAGMENT,
					texture: {},
				},
			],
		});
		this.screenBindGroup = this.device.createBindGroup({
			layout: screenBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: this.sampler,
				},
				{
					binding: 1,
					resource: this.colorBufferView,
				},
			],
		});
		const screenPipelineLayout = this.device.createPipelineLayout({
			bindGroupLayouts: [screenBindGroupLayout],
		});
		this.screenPipeline = this.device.createRenderPipeline({
			layout: screenPipelineLayout,
			vertex: {
				module: this.device.createShaderModule({
					code: screenShader,
				}),
				entryPoint: "vert_main",
			},
			fragment: {
				module: this.device.createShaderModule({
					code: screenShader,
				}),
				entryPoint: "frag_main",
				targets: [{ format: "bgra8unorm" }],
			},
			primitive: {
				topology: "triangle-list",
			},
		});
	}

	render() {
		requestAnimationFrame(this.render.bind(this));

		const commandEncoder = this.device.createCommandEncoder();

		const computePass = commandEncoder.beginComputePass();

		computePass.setPipeline(this.kernelPipeline);
		computePass.setBindGroup(0, this.kernelBindGroup);
		computePass.dispatchWorkgroups(this.cnv.width, this.cnv.height, 1);
		computePass.end();

		const textureView = this.ctx.getCurrentTexture().createView();

		const renderPass = commandEncoder.beginRenderPass({
			colorAttachments: [
				{
					view: textureView,
					clearValue: { r: 0.11, g: 0.05, b: 0.16, a: 1.0 },
					loadOp: "clear",
					storeOp: "store",
				},
			],
		});

		renderPass.setPipeline(this.screenPipeline);
		renderPass.setBindGroup(0, this.screenBindGroup);
		renderPass.draw(6, 1, 0, 0);
		renderPass.end();
		this.device.queue.submit([commandEncoder.finish()]);
	}
	async Initialize() {
		msg("loading");
		await this.setup_device();
		msg("setted device");
		await this.create_assets();
		msg("got assets");
		await this.make_pipeline();
		this.render();
		msg("running");
	}
}
