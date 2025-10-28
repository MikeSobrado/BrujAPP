// netlify/functions/proxy.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Obtenemos la URL del feed RSS desde los parámetros de la consulta
  const { url } = event.queryStringParameters;

  // Lista de dominios de feeds RSS que permitimos para mayor seguridad
  const allowedDomains = [
    
    'www.coindesk.com',
    'cointelegraph.com',
    'decrypt.co',
    'www.investing.com',
    'www.marketwatch.com',
    'bitcoinmagazine.com',
    'elpais.com',
    'https://www.newsbtc.com/feed/'

    // Puedes añadir más dominios de confianza aquí
  ];

  // Validación de seguridad
  try {
    const urlObj = new URL(url);
    if (!allowedDomains.includes(urlObj.hostname)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Dominio no permitido' }),
      };
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL inválida' }),
    };
  }

  try {
    // Hacemos la petición a la URL del feed RSS
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`El feed RSS respondió con estado: ${response.status}`);
    }

    // Los feeds RSS son texto plano (XML), así que usamos .text()
    const rssText = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*', // ¡Cabecera crucial para CORS!
      },
      body: rssText,
    };
  } catch (error) {
    console.error('Error en el proxy:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener el feed RSS' }),
    };
  }
};