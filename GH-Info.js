const http = require('http');

module.exports = function(RED) {
  function GreenHippoInfoNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const ip = config.ipAddress;
    const port = config.port;

    node.on('input', function(msg, send, done) {
      const requestIp = ip || msg.ipAddress;
      const requestPort = port || msg.port || 40512;

      if (!requestIp) {
        node.error("IP Address is required", msg);
        done();
        return;
      }

      const options = {
        hostname: requestIp,
        port: parseInt(requestPort, 10),
        path: '/info',
        method: 'GET',
        timeout: 5000,
      };

      node.log(`Requesting http://${requestIp}:${requestPort}/info`);

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            // Output 1: full JSON
            const msg1 = { ...msg, payload: json };

            // Output 2: engineStatus as boolean
            const msg2 = { payload: json.engineStatus === "Running" };

            // Output 3: mediaManagerStatus string
            const msg3 = { payload: json.mediaManagerStatus };

            send([msg1, msg2, msg3]);
            done();
          } catch (err) {
            node.error("Failed to parse JSON response: " + err.message, msg);
            done(err);
          }
        });
      });

      req.on('error', (err) => {
        node.error("HTTP request failed: " + err.message, msg);
        done(err);
      });

      req.on('timeout', () => {
        req.destroy();
        node.error("HTTP request timed out", msg);
        done(new Error("HTTP request timed out"));
      });

      req.end();
    });
  }

  RED.nodes.registerType("GH-Info", GreenHippoInfoNode);
};
