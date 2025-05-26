module.exports = async function (waw) {
	const Schema = waw.mongoose.Schema(
		{
			name: String,
			description: String,
			property_id: String,
			type: String,
			cost: Number,
			date: Date,
			status: String,
			duration: Number,
			files: [String],
			worker_id: String,
			createdAt: Date,
			url: { type: String, sparse: true, trim: true, unique: true },
			data: {},
			author: {
				type: waw.mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
			moderators: [
				{
					type: waw.mongoose.Schema.Types.ObjectId,
					sparse: true,
					ref: "User",
				},
			],
		},
		{ timestamps: true }
		
	);

	Schema.methods.create =function (obj, user, waw) {
		this.author = user._id;
		this.moderators = [user._id];
		this.name = obj.name;
		this.description = obj.description;
		this.property_id = obj.property_id;
		this.type = obj.type;
		this.cost = obj.cost;
		this.date = obj.date;
		this.status = obj.status;
		this.duration = obj.duration;
		this.files = obj.files;
		this.worker_id = obj.worker_id;
		this.data = obj.data;
		this.createdAt = obj.createdAt;

	};
	
	return waw.Propertyrecord = waw.mongoose.model("Propertyrecord", Schema);
};
