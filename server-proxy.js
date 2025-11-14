// server-proxy.js - Proxy para API de Bitget sin restricciones CORS

const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');

const PORT = 8000;
const BITGET_API = 'https://api.bitget.com';

/**
 * Hacer petición a Bitget API
 */
function makeRequest(method, path, headers, body, callback) {
    console.log(`\n📤 Enviando a Bitget: ${method} ${BITGET_API}${path}`);
    console.log(`📋 Headers:`, {
        'ACCESS-KEY': headers['ACCESS-KEY'] ? headers['ACCESS-KEY'].substring(0, 10) + '...' : 'N/A',
        'ACCESS-TIMESTAMP': headers['ACCESS-TIMESTAMP'],
        'Content-Type': headers['Content-Type']
    });

    const options = {
        hostname: 'api.bitget.com',
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'ACCESS-KEY': headers['ACCESS-KEY'] || '',
            'ACCESS-SIGN': headers['ACCESS-SIGN'] || '',
            'ACCESS-TIMESTAMP': headers['ACCESS-TIMESTAMP'] || '',
            'ACCESS-PASSPHRASE': headers['ACCESS-PASSPHRASE'] || '',
            'User-Agent': 'Crystal-Sphere-Proxy/1.0'
        }
    };

    if (body) {
        options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`📥 Respuesta de Bitget: ${res.statusCode}`);
            callback(null, {
                status: res.statusCode,
                headers: res.headers,
                body: data
            });
        });
    });

    req.on('error', (error) => {
        console.error(`❌ Error en petición a Bitget:`, error.message);
        callback(error);
    });

    if (body) {
        req.write(body);
    }

    req.end();
}

/**
 * Servidor HTTP principal
 */
const server = http.createServer((req, res) => {
    // Headers CORS - Permitir todas las cabeceras necesarias
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, access-key, access-sign, access-timestamp, access-passphrase, ok-access-key, ok-access-sign, ok-access-timestamp, ok-access-passphrase');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Content-Type', 'application/json');

    // Manejar preflight CORS
    if (req.method === 'OPTIONS') {
        console.log('✅ Preflight CORS OK');
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    console.log(`\n[${new Date().toISOString()}] 🔵 ${req.method} ${pathname}`);
    console.log(`🔹 Query:`, Object.keys(query).length > 0 ? query : 'ninguno');
    console.log(`🔹 Headers auth:`, {
        'ACCESS-KEY': req.headers['access-key'] ? req.headers['access-key'].substring(0, 10) + '...' : 'N/A',
        'ACCESS-TIMESTAMP': req.headers['access-timestamp']
    });

    // Ruta: /api/v2/*
    if (pathname.startsWith('/api/v2/')) {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // Construir la query string
                const queryString = Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : '';
                const fullPath = pathname + queryString;

                // Obtener headers de autenticación del request
                const authHeaders = {
                    'Content-Type': 'application/json',
                    'ACCESS-KEY': req.headers['access-key'] || '',
                    'ACCESS-SIGN': req.headers['access-sign'] || '',
                    'ACCESS-TIMESTAMP': req.headers['access-timestamp'] || '',
                    'ACCESS-PASSPHRASE': req.headers['access-passphrase'] || ''
                };

                // Hacer petición a Bitget
                makeRequest(
                    req.method,
                    fullPath,
                    authHeaders,
                    body || null,
                    (error, response) => {
                        if (error) {
                            console.error('❌ Error:', error.message);
                            res.writeHead(500, {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            });
                            res.end(JSON.stringify({ 
                                error: error.message,
                                code: 'REQUEST_ERROR'
                            }));
                            return;
                        }

                        console.log(`✅ Respondiendo con status ${response.status}`);
                        
                        // Parsear la respuesta para ver si es JSON
                        try {
                            const jsonData = JSON.parse(response.body);
                            console.log(`📦 Respuesta JSON:`, JSON.stringify(jsonData, null, 2).substring(0, 500));
                        } catch (e) {
                            console.log(`📦 Respuesta (no JSON):`, response.body.substring(0, 500));
                        }
                        
                        // Escribir status con headers CORS
                        res.writeHead(response.status, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                            'Access-Control-Allow-Headers': 'Content-Type, Authorization, access-key, access-sign, access-timestamp, access-passphrase'
                        });
                        res.end(response.body);
                    }
                );
            } catch (error) {
                console.error('❌ Error procesando request:', error);
                res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ 
                    error: error.message,
                    code: 'PARSE_ERROR'
                }));
            }
        });
    } else if (pathname === '/health') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'Proxy is running',
            timestamp: new Date().toISOString()
        }));
    } else {
        console.log(`❌ Ruta no encontrada: ${pathname}`);
        res.writeHead(404, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
            error: 'Not found',
            path: pathname,
            code: 'NOT_FOUND'
        }));
    }
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  🚀 Proxy de Bitget API corriendo en puerto ${PORT}        ║
║  📡 Redirigiendo peticiones a ${BITGET_API}  ║
║  ✅ Endpoint de salud: http://localhost:${PORT}/health     ║
╚════════════════════════════════════════════════════════╝
`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso. Intenta otro puerto.`);
        process.exit(1);
    } else {
        console.error('❌ Error del servidor:', error);
        process.exit(1);
    }
});
