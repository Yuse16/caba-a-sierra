const http = require('http')
const port = Number(process.env.PORT || 3000)
http.createServer((req, res) => {
  const body = `DUPEZ_HOSTINGER_PROBE ${req.method} ${req.url}\n`
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(body))
  res.end(body)
}).listen(port, '0.0.0.0', () => console.log(`probe ready on ${port}`))
