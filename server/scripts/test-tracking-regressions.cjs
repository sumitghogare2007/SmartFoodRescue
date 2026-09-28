const assert = require('node:assert/strict');
const { validateLocation } = require('../src/services/trackingValidation');
const { routingService } = require('../src/services/routingService');
const axios = require('axios');
(async () => {
  // Boundary inputs only; never sent to the database or represented as device GPS.
  for (const invalid of [null, {}, {latitude:NaN,longitude:0}, {latitude:91,longitude:0}, {latitude:0,longitude:181}, {latitude:0,longitude:0,accuracy:-1}, {latitude:0,longitude:0,timestamp:'invalid'}]) assert.ok(validateLocation(invalid));
  assert.equal(validateLocation({latitude:0,longitude:0,timestamp:Date.now()}), null);
  const original = axios.default.get;
  axios.default.get = async () => { throw new Error('Intentional routing outage test'); };
  try {
    await assert.rejects(routingService.computeRoute({latitude:0,longitude:0},{latitude:0,longitude:0},true), /Road routing service is unavailable/);
  } finally { axios.default.get = original; }
  console.log('PASS: coordinate/timestamp validation and routing outage produces an error, never a fabricated route.');
})().catch(e => { console.error(e.message); process.exitCode=1; });
