## pre-install:
```
root: npm i
root/client: npm i
```
## run server:
```
root: npm run start
```
## run client
```
root/client: npm run start
```

## Crud extend
## Add files management
## Serve Template Static Page
At `server/user/serve.js` we have `waw.build` will prepare dist for selected page. `waw.url` will serve static page from `process.cwd() + '/waw/dist/index.html'`, with url `'/'` and template data `{...}`.
```
waw.build(waw_base, 'index');

waw.url(
	path.join(waw_base, 'dist', 'index.html'),
	'/',
	seo,
	waw.config.waw_website
);
```
## Serve Template Dynamic Page
Also at `server/user/serve.js` we have `waw.build`, but for dynamic we will use express route `waw.app.get` which first search for the user, then servce the template page.
```
waw.build(waw_base, 'member');

waw.app.get('/m/:user_url', async (req, res) => {
	const user = await User.findOne({
		$or: [{
			email: req.params.user_url
		}, {
			_id: req.params.user_url
		}, {
			url: req.params.user_url
		}]
	});
	if (!user) return res.redirect('/agency');
	res.send(
		waw.derer.renderFile(process.cwd() + '/waw/dist/member.html', {
			...seo,
			title: user.name + ' | Web Art Work',
			user
		})
	);
});
```
## Serve Client Page
At `server/user/serve.js` we have `waw.url(client, '...')` we have list of urls which we wanna serve from the client. Should have been filled urls of pages with space as separator.
