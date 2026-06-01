import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://127.0.0.1:3000/api/upload-base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: 'data:image/jpeg;base64,12345', contentType: 'image/jpeg' })
  });
  console.log('Status Base64:', res.status, res.statusText);
  const text = await res.text();
  console.log('Body:', text);
}

test();
