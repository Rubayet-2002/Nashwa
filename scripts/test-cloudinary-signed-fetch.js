const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();
const fetch = global.fetch || (async () => { throw new Error('No fetch available'); })();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'nashwa_uploads_tests';
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const fileUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/June_odd-eyed-cat.jpg/320px-June_odd-eyed-cat.jpg';

    const FormData = global.FormData || require('form-data');
    const body = new FormData();
    body.append('file', fileUrl);
    body.append('timestamp', String(timestamp));
    body.append('folder', folder);
    body.append('api_key', apiKey);
    body.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
    });
    const text = await res.text();
    console.log('status', res.status);
    console.log(text);
  } catch (err) {
    console.error('err', err);
  }
}

run();
