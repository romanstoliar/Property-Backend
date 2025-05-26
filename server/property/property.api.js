module.exports = async (waw) => {
	const baseCrud = {
		get: {
			query: (req) => ({
				moderators: req.user._id,
			}),
			sort: () => ({ _id: -1 }),
		},
	};

	const propertyrecordCrud = {
		get: {
			query: (req) => {
				const query = {
					moderators: req.user._id,
				};

				if (req.query.property_id) {
					query.property_id = req.query.property_id;
				}

				if (req.query.type) {
					query.type = req.query.type;
				}

				// Фільтрація за createdAt (дата створення)
				if (req.query.dateStart || req.query.dateEnd) {
					query.createdAt = {};
					if (req.query.dateStart) {
						query.createdAt.$gte = new Date(req.query.dateStart);
					}
					if (req.query.dateEnd) {
						query.createdAt.$lte = new Date(req.query.dateEnd);
					}
				}

				return query;
			},

			sort: (req) => {
				if (req.query.sort === 'asc') return { createdAt: 1 };
				return { createdAt: -1 }; 
			},
		},
	};

	// Реєстрація моделей з відповідною конфігурацією
	waw.crud("property", baseCrud);
	waw.crud("propertyrecord", propertyrecordCrud);
	waw.crud("propertymaterial", baseCrud);
	waw.crud("propertyprovider", baseCrud);
	waw.crud("propertyservice", baseCrud);
	waw.crud("propertyworker", baseCrud);
	waw.crud("propertytrade", baseCrud);
};
