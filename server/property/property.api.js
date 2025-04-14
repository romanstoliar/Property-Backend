module.exports = async (waw) => {
	const crudConfig = {
		get: {
			query: (req) => {
				const query = {
					moderators: req.user._id,
				};

				if (req.query.provider) {
					query.provider = req.query.provider;
				}

				if (req.query.property) {
					query.property = req.query.property;
				}

				return query;
			},
			sort: () => {
				return {
					_id: "-1",
				};
			},
		},
	};
	waw.crud("property", crudConfig);
	waw.crud("propertyrecord", crudConfig);
	waw.crud("propertymaterial", crudConfig);
	waw.crud("propertyprovider", crudConfig);
	waw.crud("propertyservice", crudConfig);
	waw.crud("propertyworker", crudConfig);
	waw.crud("propertytrade", crudConfig);
};
