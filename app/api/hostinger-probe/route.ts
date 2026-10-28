export async function GET() {
  return new Response("NEXT_ROUTE_OK\n", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  })
}
