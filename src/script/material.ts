export class Material {
	texture: GPUTexture;
	view: GPUTextureView;
	sampler: GPUSampler;
	constructor() {}

	async Initialize(device: GPUDevice, img_path: string) {
		// getting image bitmap from image
		const res = await fetch(img_path);
		const blob = await res.blob();
		const imgMap: ImageBitmap = await createImageBitmap(blob);
		await this.load_image_bitmap(device, imgMap);
		const viewDescriptor: GPUTextureViewDescriptor = {
			format: "rgba8unorm",
			dimension: "2d",
			aspect: "all",
			baseMipLevel: 0,
			mipLevelCount: 1,
			arrayLayerCount: 1,
		};
		this.view = this.texture.createView(viewDescriptor);
		const samplerDescriptor: GPUSamplerDescriptor = {
			addressModeU: "repeat",
			addressModeV: "repeat",
			minFilter: "linear",
			magFilter: "linear",
			mipmapFilter: "linear",
			maxAnisotropy: 1,
		};
		this.sampler = device.createSampler(samplerDescriptor);
	}
	async load_image_bitmap(device: GPUDevice, img_map: ImageBitmap) {
		const textureDescriptor: GPUTextureDescriptor = {
			size: {
				width: img_map.width,
				height: img_map.height,
			},
			format: "rgba8unorm",
			usage:
				GPUTextureUsage.TEXTURE_BINDING |
				GPUTextureUsage.COPY_DST |
				GPUTextureUsage.RENDER_ATTACHMENT,
		};
		// creating empty texture of given description
		this.texture = device.createTexture(textureDescriptor);
		// queing into device that copy img data
		device.queue.copyExternalImageToTexture(
			{ source: img_map },
			{ texture: this.texture },
			textureDescriptor.size
		);
		console.log(this.texture);
	}
}
