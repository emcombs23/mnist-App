document.addEventListener('DOMContentLoaded', () => {
	const btn = document.getElementById('loadBtn');
	const loopBtn = document.getElementById('loopBtn');
	const loopStatus = document.getElementById('loopStatus');
	const canvas = document.getElementById('mnistCanvas');
	const labelEl = document.getElementById('label');
	const predEl = document.getElementById('prediction');
	const ctx = canvas.getContext('2d');

	function renderImage(img, label) {
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
	}

	async function fetchImage() {
		const res = await fetch('/image');
		if (!res.ok) throw new Error('Failed to fetch image');
		return res.json();
	}

	async function fetchPredict(index) {
		const pRes = await fetch(`/predict?index=${encodeURIComponent(index)}`, { headers: { 'Accept': 'application/json' } });
		if (!pRes.ok) throw new Error(`Predict request failed (${pRes.status})`);
		const pData = await pRes.json();
		return pData.predicted ?? pData.prediction ?? pData.pred ?? null;
	}

	btn.addEventListener('click', async () => {
		try {
			btn.disabled = true;
			btn.textContent = 'Loading...';
			predEl.textContent = 'Prediction: —';

			const data = await fetchImage();
			renderImage(data.image, data.label);

			if (typeof data.index === 'number') {
				try {
					const predVal = await fetchPredict(data.index);
					predEl.textContent = `Prediction: ${predVal ?? '(no value)'}`;
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

	// Looping generator: keep requesting until label != prediction
	loopBtn.addEventListener('click', async () => {
		loopBtn.disabled = true;
		btn.disabled = true;
		loopStatus.textContent = 'Status: Running...';
		let attempts = 0;
		try {
			while (true) {
				attempts += 1;
				const data = await fetchImage();
				renderImage(data.image, data.label);
				if (typeof data.index === 'number') {
					try {
						const predVal = await fetchPredict(data.index);
						predEl.textContent = `Prediction: ${predVal ?? '(no value)'}`;
						if (String(predVal) !== String(data.label)) {
							loopStatus.textContent = `Status: Stopped after ${attempts} tries`;
							break;
						}
					} catch (err) {
						console.error('Prediction error', err);
						predEl.textContent = 'Prediction: (error)';
						loopStatus.textContent = `Status: Error after ${attempts} tries`;
						break;
					}
				} else {
					predEl.textContent = 'Prediction: (no index from server)';
					loopStatus.textContent = `Status: No index provided (stopped)`;
					break;
				}
				// small pause to allow UI update and avoid hammering server
				await new Promise(r => setTimeout(r, 150));
			}
		} catch (err) {
			console.error('Looping generator error', err);
			loopStatus.textContent = 'Status: Error';
		} finally {
			loopBtn.disabled = false;
			btn.disabled = false;
		}
	});
});
