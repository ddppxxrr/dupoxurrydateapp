import https from 'https';

https.get('https://pub-9f8d7e0a94464c84a41bd64c250edad5.r2.dev/test.mp3', (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', (d) => process.stdout.write(d));
});
