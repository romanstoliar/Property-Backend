const path = require("path");
const template = path.join(process.cwd(), "waw");
const { v4: uuidv4 } = require("uuid");
const nJwt = require("njwt");
const cors = require("cors");
const authCode = `<script>
window.addEventListener("message", (event) => {
    const { action, token } = event.data;

    if (action === "setToken" && token) {
        // Store the received token
        localStorage.setItem("token", token);
    } else if (action === "clearToken") {
        // Clear the stored token
        localStorage.removeItem("token");
    }
});

// On iframe load, check if token exists and send it automatically
window.onload = () => {
	window.parent.postMessage({ action: "tokenResponse", token: localStorage.getItem("token") }, "*");
};
</script>
`;

module.exports = function (waw) {
	waw.use(cors());
	/* remove support of waw.file */
	waw.file("user", {
		rename: (req) => req.user._id + ".jpg",
		ensure: waw.ensure,
		process: async (req, res) => {
			const user = await waw.User.findOne({
				_id: req.user._id,
			});

			user.thumb = req.files[0].url;

			await user.save();

			res.json(user.thumb);
		},
	});

	/*
	 *	Initialize
	 */
	const select = () => "-password -resetPin";
	waw.config.nowYear = new Date().getFullYear();

	/*
	 *	User configuration
	 */
	if (!waw.config.signingKey) {
		waw.config.signingKey = uuidv4();

		let serverJson = waw.readJson(process.cwd() + "/server.json");

		serverJson.signingKey = waw.config.signingKey;

		waw.writeJson(process.cwd() + "/server.json", serverJson);
	}

	if (waw.config.mail) {
		const nodemailer = require("nodemailer");

		let transporter = nodemailer.createTransport({
			host: waw.config.mail.host,
			port: waw.config.mail.port,
			secure: waw.config.mail.secure,
			auth: waw.config.mail.auth,
		});

		waw.send = (opts, cb = (resp) => {}) => {
			transporter.sendMail(
				{
					from: waw.config.mail.from,
					subject: opts.subject || waw.config.mail.subject,
					to: opts.to,
					text: opts.text,
					html: opts.html,
				},
				cb
			);
		};
	} else {
		waw.send = () => {};
	}

	const set_is = async (email, is) => {
		await waw.wait(300);

		const user = await waw.User.findOne({
			email: email,
		});

		if (!user) return;

		if (!user.is) user.is = {};

		user.is[is] = true;

		user.markModified("is");

		await user.save();
	};

	if (waw.config.user && waw.config.user.is) {
		for (const is in waw.config.user.is) {
			const emails = waw.config.user.is[is].split(" ");

			for (var i = 0; i < emails.length; i++) {
				set_is(emails[i], is);
			}
		}
	}

	/* API */
	waw.use((req, res, next) => {
		if (req.cookies.authToken) {
			nJwt.verify(
				req.cookies.authToken,
				waw.config.signingKey,
				(err, verifiedJwt) => {
					if (err) {
						res.clearCookie("authToken", {
							httpOnly: true,
							secure: true,
						});

						next();
					} else {
						req.user = verifiedJwt.body;
						next();
					}
				}
			);
		} else if (req.headers.token) {
			nJwt.verify(
				req.headers.token,
				waw.config.signingKey,
				(err, verifiedJwt) => {
					if (err) {
						res.set("remove", "token");

						res.set("Access-Control-Expose-Headers", "field");

						next();
					} else {
						req.user = verifiedJwt.body;
						next();
					}
				}
			);
		} else next();
	});
	const prepareUser = (user, res) => {
		user = JSON.parse(JSON.stringify(user));

		delete user.password;

		delete user.resetPin;

		delete user.data;

		user.token = nJwt.create(user, waw.config.signingKey);

		user.token.setExpiration(new Date().getTime() + 48 * 60 * 60 * 1000);

		user.token = user.token.compact();

		// Set the token in a cookie
		res.cookie("authToken", user.token, {
			httpOnly: true, // Makes the cookie inaccessible to JavaScript on the client
			secure: true, // Ensures the cookie is sent only over HTTPS
			maxAge: 3600000 * 24 * 30, // Sets cookie expiration,
			sameSite: "None", // This is crucial for cross-domain cookie sharing
		});

		return user;
	};
	const findUser = async (email) => {
		return await waw.User.findOne({
			$or: [
				{
					reg_email: email.toLowerCase(),
				},
				{
					email: email.toLowerCase(),
				},
			],
		});
	};
	const new_pin = async (user, cb = () => {}) => {
		user.resetPin = Math.floor(Math.random() * (999999 - 100000)) + 100000;

		console.log(user.email + ": " + user.resetPin);

		user.markModified("data");

		await user.save();

		waw.send(
			{
				to: user.email,
				subject: "Code: " + user.resetPin,
				html: "Code: " + user.resetPin,
			},
			cb
		);
	};

	waw.api({
		router: "/api/user",
		post: {
			"/status": async (req, res) => {
				const user = await findUser(req.body.email);

				const json = {};

				json.email = !!user;

				if (user && req.body.password) {
					json.pass = user.validPassword(req.body.password);
				}

				res.json(json);
			},
			"/request": async (req, res) => {
				const user = await findUser(req.body.email);

				if (user) {
					new_pin(user);
				}

				res.json(true);
			},
			"/change": async (req, res) => {
				const user = await findUser(req.body.email);

				if (
					user &&
					user.resetPin &&
					req.body.resetPin &&
					user.resetPin.toString() === req.body.resetPin.toString()
				) {
					user.password = user.generateHash(req.body.password);

					delete user.resetPin;

					await user.save();

					res.json(true);
				} else if (user) {
					new_pin(user, () => {
						res.json(false);
					});
				}
			},
			"/changePassword": async (req, res) => {
				if (!req.user) return res.send(false);

				const user = await waw.User.findOne({ _id: req.user._id });

				if (user.validPassword(req.body.oldPass)) {
					user.password = user.generateHash(req.body.newPass);

					user.apps = user.apps || [];

					if (req.body.appId && !user.apps.includes(req.body.appId)) {
						user.apps.push(req.body.appId);
					}

					await user.save();

					res.json(true);
				} else {
					res.json(false);
				}
			},
			"/login": async (req, res) => {
				const user = await findUser(req.body.email);

				if (!user || !user.validPassword(req.body.password)) {
					return res.json(false);
				}

				user.apps = user.apps || [];

				if (req.body.appId && !user.apps.includes(req.body.appId)) {
					user.apps.push(req.body.appId);

					user.markModified("apps");

					await user.save();
				}

				res.json(prepareUser(user, res));
			},
			"/sign": async (req, res) => {
				const userExists = await findUser(req.body.email);

				if (userExists) {
					res.json(false);
				} else {
				}

				const user = new waw.User({
					apps: req.body.appId ? [req.body.appId] : [],
					reg_email: req.body.email.toLowerCase(),
					email: req.body.email.toLowerCase(),
					data: req.body.data || {},
					is: {},
				});

				user.password = user.generateHash(req.body.password);

				await user.save();

				res.json(prepareUser(user, res));
			},
		},
		get: {
			"/logout": async (req, res) => {
				res.clearCookie("authToken", {
					httpOnly: true,
					secure: true,
				});

				res.json(true);
			},
			"/agents/:projectId": async (req, res) => {
				const agents = await waw.User.find({
					"is.agent": true,
					projects: req.params.projectId,
				}).select(select());

				res.json(agents);
			},
			"/agents/:projectId/:_id": async (req, res) => {
				const agent = await waw.User.findOne({
					"is.agent": true,
					projects: req.params.projectId,
					_id: req.params._id,
				}).select(select());

				res.json(agent);
			},
		},
	});

	/* CRUD */
	waw.crud("user", {
		get: {
			ensure: waw.next,
			query: (req) => {
				return req.query.appId
					? {
							apps: { $in: req.query.appId },
					  }
					: {
							"is.admin": true,
					  };
			},
			select,
		},
		fetch: [
			{
				ensure: waw.next,
				query: (req) => {
					return {
						_id: req.body._id,
					};
				},
				select,
			},
			{
				name: "me",
				query: (req) => {
					return {
						_id: req.user._id,
					};
				},
				select,
			},
		],
		update: [
			{
				query: (req) => {
					return {
						_id: req.user._id,
					};
				},
				select,
			},
			{
				name: "admin",
				ensure: waw.role("admin"),
				query: (req) => {
					return {
						_id: req.body._id,
					};
				},
				select,
			},
		],
		delete: {
			name: "admin",
			ensure: waw.role("admin"),
			query: (req) => {
				return {
					_id: req.body._id,
				};
			},
			select,
		},
	});
};
