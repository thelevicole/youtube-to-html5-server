# YouTube to HTML5 server
**Basic usage**

Once cloned this repo simply run the below command to start the local server.
```bash
HOST=localhost PORT=8000 node index.js
```

Now set the global `YouTubeToHtml5()` javascript endpoint by placing the below above any library initiations.
```js
YouTubeToHtml5.defaultOptions.endpoint = 'http://localhost:8000/?id=';
```
