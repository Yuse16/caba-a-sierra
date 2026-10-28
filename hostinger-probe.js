const http = require('http')
const port = Number(process.env.PORT || 3000)
http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  if (req.url === '/chunked') {
    res.write('DUPEZ_CHUNK_1 ')
    setTimeout(() => { res.write('CHUNK_2 '); res.end('CHUNK_3\n') }, 20)
    return
  }
  const body = `DUPEZ_LENGTH_PROBE ${req.method} ${req.url}\n`
  res.setHeader('Content-Length', Buffer.byteLength(body))
  res.end(body)
}).listen(port, '0.0.0.0', () => console.log(`probe ready on ${port}`))
