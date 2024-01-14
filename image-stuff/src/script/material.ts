export class Material {
	texture: GPUTexture;
	view: GPUTextureView;
	sampler: GPUSampler;

	async init(device: GPUDevice, image_data: ImageBitmap) {
		await this.loadImageBitmap(device, image_data);

		const viewDescriptor: GPUTextureViewDescriptor = {
			format: "rgba8unorm",
			dimension: "2d",
			aspect: "all",
			baseMipLevel: 0,
			mipLevelCount: 1,
			baseArrayLayer: 0,
			arrayLayerCount: 1,
		};
		this.view = this.texture.createView(viewDescriptor);

		const samplerDescriptor: GPUSamplerDescriptor = {
			addressModeU: "repeat",
			addressModeV: "repeat",
			magFilter: "linear",
			minFilter: "nearest",
			mipmapFilter: "nearest",
			maxAnisotropy: 1,
		};
		this.sampler = device.createSampler(samplerDescriptor);
	}

	async loadImageBitmap(device: GPUDevice, img_data: ImageBitmap) {
		const textureDescriptor: GPUTextureDescriptor = {
			size: {
				width: img_data.width,
				height: img_data.height,
			},
			format: "rgba8unorm",
			usage:
				GPUTextureUsage.TEXTURE_BINDING |
				GPUTextureUsage.COPY_DST |
				GPUTextureUsage.RENDER_ATTACHMENT,
		};

		this.texture = device.createTexture(textureDescriptor);

		device.queue.copyExternalImageToTexture(
			{ source: img_data },
			{ texture: this.texture },
			textureDescriptor.size
		);
	}
}
