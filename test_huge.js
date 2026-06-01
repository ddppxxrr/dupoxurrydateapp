import fetch from 'node-fetch';

async function test() {
  const hugePayload = 'data:image/jpeg;base64,' + 'A'.repeat(60 * 1024 * 1024); // 60MB
  const res = await fetch('http://127.0.0.1:3000/api/upload-base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: hugePayload, contentType: 'image/jpeg' })
  });
  console.log('Status Huge POST:', res.status, res.statusText);
}
test();
