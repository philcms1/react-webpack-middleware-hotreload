/**
 * Created by Thorin on 02/23/17.
 */
// BASE SETUP
// ================================================================================================
// Imports
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');
const fs = require('fs');
let request = require('request');
const webpackDevMiddleware = require('webpack-dev-middleware');
const middlewareHotReload = require('webpack-hot-middleware');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');

const app = express();

// Webpack
const compiler = webpack(webpackConfig);

// Instructs request to save cookies
request = request.defaults({ jar: true });

// Setup SSL
const keyFile = 'privatekey.pem';
const certFile = 'certificate.pem';
const config = {
  key: fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile),
};

const router = express.Router(); // get an instance of the router
const sslPort = process.env.PORT || 8223;
// WARNING: this is really insecure, and is only for local testing
// http://stackoverflow.com/questions/10888610/ignore-invalid-self-signed-ssl-certificate-in-node-js-with-https-request
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Login dev or test
const loginUriEnv = process.argv[4] !== undefined ? process.argv[4] : 'test';
const uriPrefix = `https://tam-${loginUriEnv}.org/`;
const loginUri = `${uriPrefix}pkmslogin.form?token=Unknown`;
request({
  method: 'POST',
  uri: loginUri,
  form: {
    username: process.argv[2],
    password: process.argv[3],
    isubmit: 'Sign+In',
    'login-form-type': 'pwd',
  },
}, (error, response) => {
  if (!error && response.statusCode === 200) {
    console.log(`Successfully signed-in in: ${loginUriEnv}`);
  }
});

// Router definition
router
    .get(/^\/api*/, (req, res) => request(uriPrefix + req.originalUrl).pipe(res))
    .post(/^\/api*/, (req, res) => {
      request.post({
        headers: { 'content-type': 'application/json; charset=utf-8' },
        url: uriPrefix + req.originalUrl,
        body: JSON.stringify(req.body),
      }, (error, response, body) => {
        res.write(body);
        res.end();
      });
    });

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/bower_components`));
app.use(express.static(`${__dirname}/`));

// REGISTER OUR ROUTES
app.get('/app', (req, res) => res.sendFile('index.html', { root: path.join(__dirname, '.') }));
app.use(webpackDevMiddleware(compiler, {
  publicPath: '/app', // Same as `output.publicPath` in most cases.
}));
app.use(middlewareHotReload(compiler, {
  log: console.log, path: '/__webpack_hmr', heartbeat: 10 * 1000,
}));
app.use('/', router);

// START THE SERVER
// ================================================================================================
https.createServer(config, app).listen(sslPort, 'localhost');
console.log('Browse to: https://localhost:8223/app');
