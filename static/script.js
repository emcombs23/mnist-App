document.addEventListener('DOMContentLoaded', () => {
	const btn = document.getElementById('loadBtn');
	const canvas = document.getElementById('mnistCanvas');
	const labelEl = document.getElementById('label');
	const ctx = canvas.getContext('2d');

	btn.addEventListener('click', async () => {
		try {
			btn.disabled = true;
			btn.textContent = 'Loading...';
			const res = await fetch('/image');
			if (!res.ok) throw new Error('Network error');
			const data = await res.json();
			const img = data.image;
			const label = data.label;

			const size = 28;
			const imageData = ctx.createImageData(size, size);
			for (let y = 0; y < size; y++) {
				for (let x = 0; x < size; x++) {
					const v = Math.round((1 - img[y][x]) * 255); // invert for black-on-white
					const i = (y * size + x) * 4;
					imageData.data[i + 0] = v;
					imageData.data[i + 1] = v;
					imageData.data[i + 2] = v;
					imageData.data[i + 3] = 255;
				}
			}
			ctx.putImageData(imageData, 0, 0);
			labelEl.textContent = `Label: ${label}`;
		} catch (err) {
			console.error(err);
			labelEl.textContent = 'Label: (error)';
		} finally {
			btn.disabled = false;
			btn.textContent = 'Load Random Test Image';
		}
	});
});
