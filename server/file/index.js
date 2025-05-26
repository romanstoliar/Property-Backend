const path = require('path');
const fs = require('fs');
/* To Do
1) Delete temp files periodically
2) Add support for aws and google files
3) Add support for files directly
*/
module.exports = async waw => {
	const router = waw.router('/api/file');

	waw.save_file = url => {
		if (url.split('/').length !== 4) {
			return;
		}
		const container = url.split('/')[2];
		const file = url.split('/')[5].split('?')[0];
		const tempFilePath = path.join(
			__dirname,
			'temp',
			container,
			file
		);

		if (fs.existsSync(tempFilePath)) {
			const filePath = path.join(
				__dirname,
				'files',
				container,
				file
			);

			fs.renameSync(tempFilePath, filePath);
		}
	};

	waw.delete_file = url => {
		if (url.split('/').length !== 4) {
			return;
		}
		const container = url.split('/')[2];
		const file = url.split('/')[5].split('?')[0];
		const tempFilePath = path.join(
			__dirname,
			'temp',
			container,
			file
		);

		if (fs.existsSync(tempFilePath)) {
			fs.rmSync(tempFilePath);
		}

		const filePath = path.join(
			__dirname,
			'files',
			container,
			file
		);

		if (fs.existsSync(filePath)) {
			fs.rmSync(tempFilePath);
		}
	};

	router.get('/get/:container/:file', (req, res) => {
		const tempFilePath = path.join(
			__dirname,
			'temp',
			req.params.container,
			req.params.file
		);

		const filePath = path.join(
			__dirname,
			'files',
			req.params.container,
			req.params.file
		);

		if (fs.existsSync(tempFilePath)) {
			res.sendFile(tempFilePath);
		} else if (fs.existsSync(filePath)) {
			res.sendFile(filePath);
		} else {
			res.sendFile(process.cwd() + '/default.jpg');
		}
	});

	router.post('/photo', async (req, res) => {
		const name = req.body.name || Date.now() + '.png';
		const container = req.body.container || 'general';
		const filePath = path.join(
			__dirname,
			'files',
			container
		);
		waw.dataUrlToLocation(req.body.dataUrl, filePath, name, () => {
			res.json(`/api/file/get/${container}/${name}?${Date.now()}`);
		});
	});

	router.post('/file', async (req, res) => {
		const name = req.body.name || Date.now() + '.png';
		const container = req.body.container || 'general';
		const filePath = path.join(
			__dirname,
			'files',
			container
		);
		waw.dataUrlToLocation(req.body.dataUrl, filePath, name, () => {
			res.json(`/api/file/get/${container}/${name}?${Date.now()}`);
		});
	});
};