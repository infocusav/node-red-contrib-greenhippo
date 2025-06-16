//=============================\\
//        infocusav           \\
//=============================\\

const http = require('http');

module.exports = function(RED) {
  function GreenHippoNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on('input', function(msg, send, done) {
      const ip = config.ipAddress || msg.ipAddress;
      const port = config.port || msg.port || 40512;
      const path = config.apiPath || msg.apiPath;

      if (!ip) {
        node.error("No IP address specified");
        done();
        return;
      }
      if (!path) {
        node.error("No API path specified");
        done();
        return;
      }

      const options = {
        hostname: ip,
        port: parseInt(port, 10),
        path: path,
        method: 'GET',
      };
      //uncomment below line for troubleshooting
       node.log(`Requesting http://${ip}:${port}${path}`); 

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            msg.payload = JSON.parse(data);
          } catch (e) {
            msg.payload = data;  // fallback if not JSON
          }
          send(msg);
          done();
        });
      });

      req.on('error', (err) => {
        node.error("HTTP request failed: " + err.message, msg);
        done(err);
      });

      req.end();
    });
  }
  RED.nodes.registerType("greenhippoAPI", GreenHippoNode);
};
