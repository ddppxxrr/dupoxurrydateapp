import https from 'https';
https.get('https://pub-9f8d7e0a94464c84a41bd64c250edad5.r2.dev/1780239851336-3panfv.mp3', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
});
