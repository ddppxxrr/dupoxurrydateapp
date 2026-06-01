import https from 'https';
https.get('https://pub-9f8d7e0a94464c84a41bd64c250edad5.r2.dev//1780238889412-a2el6o.mp3', (res) => {
  console.log(res.statusCode);
});
