const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    try {
        // Obtener la clave desde query parameter o desde .env (backwards compatibility)
        const apiKey = event.queryStringParameters?.key || process.env.CMC_API_KEY;
        
        if (!apiKey) {
            return {
                statusCode: 401,
                body: JSON.stringify({ 
                    error: 'API key not configured',
                    message: 'Proporciona la clave CMC como parámetro query o configúrala en .env'
                })
            };
        }

        const response = await fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`CMC API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Error fetching dominance data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
