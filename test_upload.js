import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

fs.writeFileSync('dummy.mp3', 'dummy data');

const form = new FormData();
form.append('file', fs.createReadStream('dummy.mp3'));

fetch('http://127.0.0.1:3000/api/upload', {
  method: 'POST',
  body: form
}).then(res => res.json())
  .then(console.log)
  .catch(console.error);
