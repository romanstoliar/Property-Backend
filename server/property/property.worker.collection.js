module.exports = async function (waw) {
	const Schema = waw.mongoose.Schema({
		name: String,
		position: String,
		region: String,
		city: String,
		experience: String,
		task: String,
		status: String,
		phone_number: String,
		email: String,
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
	});
	
	Schema.methods.create = function (obj, user, waw) {
		this.author = user._id;
		this.moderators = [user._id];
	
		this.name = obj.name;
		this.position = obj.position;
		this.region = obj.region;
		this.city = obj.city;
		this.experience = obj.experience;
		this.task = obj.task;
		this.status = obj.status;
		this.worker = obj.worker;
		this.phone_number=obj.phone_number;
		this.email=obj.email;
		this.data = obj.data;
		this.url = obj.url;
	};
	
	return (waw.Propertyworker = waw.mongoose.model("Propertyworker", Schema));
};
