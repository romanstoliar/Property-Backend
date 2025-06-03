module.exports = function (waw) {
	const bcrypt = require("bcrypt-nodejs");

	waw.UserSelect = "-password -telegram_chat_id -resetPin";

	const schema = waw.mongoose.Schema(
		{
			apps: [String],
			is: {},
			data: {},
			thumb: { type: String, default: "/assets/default.png" },
			email: { type: String, unique: true, sparse: true, trim: true },
			reg_email: { type: String, unique: true, sparse: true, trim: true },
		/*	tools: [
				{
					type: waw.mongoose.Schema.Types.ObjectId,
					sparse: true,
					ref: "Tool",
				},
			],
			projects: [
				{
					type: waw.mongoose.Schema.Types.ObjectId,
					sparse: true,
					ref: "Project",
				},
			],
			skills: [
				{
					type: waw.mongoose.Schema.Types.ObjectId,
					sparse: true,
					ref: "Skill",
				},
			],*/
			languages: [String],
			password: String,
			name: String,
			phone: String,
			bio: String,
			resetPin: Number,
		},
		{
			minimize: false,
		}
	);

	schema.methods.generateHash = function (password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	};

	schema.methods.validPassword = function (password) {
		return bcrypt.compareSync(password, this.password);
	};

	schema.methods.create = function (obj, user, sd) {
		this.thumb = obj.thumb || "/assets/default.png";
		this.reg_email = obj.email;
		this.email = obj.email;
		this.name = obj.name;
		this.phone = obj.phone;
		this.bio = obj.bio;
		this.data = {};
		this.is = {};
	};

	return (waw.User = waw.mongoose.model("User", schema));
};
