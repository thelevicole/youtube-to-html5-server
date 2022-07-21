const ytdl = require('ytdl-core');
const http = require('http');
const url = require('url');
const NodeCache = require('node-cache');
const cache = new NodeCache();

const hostname = process?.env?.HOST;
const port = process?.env?.PORT;

const successCacheAge = 14400; // 4hrs
const errorCacheAge = 3600; // 1hrs

// Clear cache on restart
if (process.env.CLEAR_CACHE) {
	cache.flushAll();
}

/**
 * Send response headers and data.
 *
 * @param {ServerResponse} response
 * @param {object} data
 */
function sendResponse(response, data) {
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.setHeader('Access-Control-Allow-Methods', 'GET');

	response.setHeader( 'Content-Type', 'application/json' );
	response.end(JSON.stringify(data));
}

/**
 * Send a successful response.
 *
 * @param {ServerResponse} response
 * @param {*} data
 */
function sendSuccess(response, data) {
	sendResponse(response, {
		success: true,
		data
	});
}

/**
 * Send a failed response.
 *
 * @param {ServerResponse} response
 * @param {*} data
 */
function sendError(response, data) {
	sendResponse(response, {
		success: false,
		data
	});
}

/**
 * Initiate our server instance.
 *
 * @type {Server} app
 */
const app = http.createServer(function(request, response) {

	/**
	 * Get query params.
	 *
	 * @type {ParsedUrlQuery}
	 */
	const queryObject = url.parse(request.url, true).query;

	const idParam = queryObject?.id;
	const urlParam = queryObject?.url;

	if (!idParam && !urlParam) {
		sendError(response, 'Missing `url` or `id` paramater.');
	} else {

		/**
		 * Build url from id or url param.
		 *
		 * @type {string}
		 */
		const youtubeUrl = idParam ? `https://www.youtube.com/watch?v=${idParam}` : urlParam;

		/**
		 * Get current cache value (if any).
		 *
		 * @type {null|object}
		 */
		const cacheValue = cache.get(youtubeUrl);

		// Return cache  value if exists.
		if (cacheValue) {

			// Cached response was a failure, send error.
			if (Object.keys(cacheValue).length === 0 && cacheValue.constructor === Object || cacheValue.statusCode) {
				sendError(response, cacheValue);
			}

			// Cache response was a success!
			else {
				sendSuccess(response, cacheValue);
			}
		}

		// No cache, make a new request.
		else {
			try {

				/**
				 * @link https://github.com/fent/node-ytdl-core
				 */
				ytdl.getInfo(youtubeUrl).then(data => {
					cache.set(youtubeUrl, data, successCacheAge);
					sendSuccess(response, data);
				}).catch(error => {
					cache.set(youtubeUrl, error, errorCacheAge);
					sendError(response, error);
				});

			} catch (error) {
				sendError(response, error);
			}
		}
	}
});

app.listen(port, hostname, () => {
	console.log(`Server running at https://${hostname}:${port}`);
});
