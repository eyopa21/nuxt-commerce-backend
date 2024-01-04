// Require the cloudinary library
const cloudinary = require('cloudinary').v2;
const axios = require('axios')
const fs = require('fs')

cloudinary.config({
    cloud_name: 'doifglnsi',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadImage = async(req, res, next) => {
    const { base64 } = req.body.input;
console.log("base64")
    fs.writeFile('image.png', base64, { encoding: 'base64' }, async function(err) {
        console.log('File created');

        const options = {
            use_filename: false,
            unique_filename: true,
            overwrite: false,
        };

        try {
            // Upload the image
            const result = await cloudinary.uploader.upload('image.png', options);
            console.log(result);
            return res.json({
                url: result.url
            });
        } catch (error) {
            console.error("uploading error", error);
            return res.status(400).json({ message: "Image uploading error" });
        }
    });


}