import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://127.0.0.1:3000/unknown-post-path', {
    method: 'POST'
  });
  console.log('Status Unknown POST:', res.status, res.statusText);
}

test();
