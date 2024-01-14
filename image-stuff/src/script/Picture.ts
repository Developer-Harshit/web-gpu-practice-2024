import { Material } from "./material";
import { Mesh } from "./mesh";

export class Picture {
	material: Material;
	aspect: number;
	mesh: Mesh;
	dim: { aspect: number; width: number; height: number };

	async init(device: GPUDevice, src: string) {
		const response: Response = await fetch(src);
		const blob: Blob = await response.blob();
		const imageData: ImageBitmap = await createImageBitmap(blob);

		this.dim = {
			width: imageData.width,
			height: imageData.height,
			aspect: Math.round(imageData.width) / Math.round(imageData.height),
		};

		this.material = new Material();
		this.mesh = new Mesh(device);
		await this.material.init(device, imageData);
	}
	get_aspect(): number {
		return this.dim.aspect;
	}
	get_view(): GPUTextureView {
		return this.material.view;
	}
	get_sampler(): GPUSampler {
		return this.material.sampler;
	}
	get_layout() {
		return this.mesh.bufferLayout;
	}
	get_buffer() {
		return this.mesh.buffer;
	}
}
