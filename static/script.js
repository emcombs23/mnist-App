document.addEventListener('DOMContentLoaded', () => {
	const btn = document.getElementById('loadBtn');
	const canvas = document.getElementById('mnistCanvas');
	const labelEl = document.getElementById('label');
	const predEl = document.getElementById('prediction');
	const ctx = canvas.getContext('2d');

	btn.addEventListener('click', async () => {
		try {
			btn.disabled = true;
			btn.textContent = 'Loading...';
			predEl.textContent = 'Prediction: —';

			const res = await fetch('/image');
			if (!res.ok) throw new Error('Failed to fetch image');
			const data = await res.json();
			const img = data.image;
			const label = data.label;

			const size = 28;
			const imageData = ctx.createImageData(size, size);
			for (let y = 0; y < size; y++) {
				for (let x = 0; x < size; x++) {
					const v = Math.round((1 - img[y][x]) * 255);
					const i = (y * size + x) * 4;
					imageData.data[i + 0] = v;
					imageData.data[i + 1] = v;
					imageData.data[i + 2] = v;
					imageData.data[i + 3] = 255;
				}
			}
			ctx.putImageData(imageData, 0, 0);
			labelEl.textContent = `Label: ${label}`;

			// Ensure we have an index to send to /predict
			if (typeof data.index === 'number') {
				try {
					const pRes = await fetch(`/predict?index=${encodeURIComponent(data.index)}`, { headers: { 'Accept': 'application/json' } });
					if (!pRes.ok) throw new Error(`Predict request failed (${pRes.status})`);
					const pData = await pRes.json();
					const predVal = pData.predicted ?? pData.prediction ?? pData.pred ?? '(no value)';
					predEl.textContent = `Prediction: ${predVal}`;
				} catch (err) {
					console.error('Prediction error', err);
					predEl.textContent = 'Prediction: (error)';
				}
			} else {
				predEl.textContent = 'Prediction: (no index from server)';
			}
		} catch (err) {
			console.error(err);
			labelEl.textContent = 'Label: (error)';
			predEl.textContent = 'Prediction: (error)';
		} finally {
			btn.disabled = false;
			btn.textContent = 'Load Random Test Image';
		}
	});
});
