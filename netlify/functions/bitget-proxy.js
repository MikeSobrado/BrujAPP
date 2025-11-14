const fetch = require('node-fetch');
const crypto = require('crypto');

// Utilidad para firmar la petición Bitget
function signBitgetRequest(apiSecret, method, path, params, timestamp, apiPassphrase) {
  const preHash = timestamp + method.toUpperCase() + path + (params || '');
  return crypto.createHmac('sha256', apiSecret).update(preHash).digest('base64');
}

exports.handler = async (event) => {
  try {
    const { apiKey, apiSecret, apiPassphrase, endpoint, params } = JSON.parse(event.body);
    const method = 'GET';
    let path = endpoint;
    let query = '';
    if (params && Object.keys(params).length > 0) {
      query = '?' + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
      path += query;
    }
    const timestamp = Date.now().toString();
    const sign = signBitgetRequest(apiSecret, method, endpoint, query, timestamp, apiPassphrase);

    const response = await fetch('https://api.bitget.com' + path, {
      method,
      headers: {
        'ACCESS-KEY': apiKey,
        'ACCESS-SIGN': sign,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': apiPassphrase,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
