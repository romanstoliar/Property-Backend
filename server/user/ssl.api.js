
module.exports = function (waw) {
	const serve = (page, config) => {
		page[config.url] = (req, res) => {
			res.send(config.code);
		}
	}
	for (const ssl of waw.config.ssls) {
		const page = {};
		for (const config of ssl.configs) {
			serve(page, config);
		}
		waw.api({
			domain: ssl.domain,
			page
		});
	}
}
