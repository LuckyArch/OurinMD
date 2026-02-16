const axios = require('axios');
const FormData = require('form-data');

async function translateToEnglish(text) {
    try {
        const url = "https://translate.googleapis.com/translate_a/single"
        const params = {
            client: "gtx",
            sl: "auto",
            tl: "en",
            dt: "t",
            q: text,
        }
        const res = await axios.get(url, { params })
        return res.data[0][0][0]
    } catch (err) {
        return text
    }
}
 
async function creartTxt2Img(prompt) {
    try {
        const translatedPrompt = await translateToEnglish(prompt)
        const form = new FormData()
        form.append("prompt", translatedPrompt)
        form.append("input_image_type", "text2image")
        form.append("aspect_ratio", "4x5")
        form.append("guidance_scale", "9.5")
        form.append("controlnet_conditioning_scale", "0.5")
        
        const response = await axios.post(
            "https://api.creartai.com/api/v2/text2image",
            form,
            {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
            }
        )
        return Buffer.from(response.data)
    } catch (err) {
        throw new Error(err?.message || err)
    }
}

async function creartImg2Img(prompt, imageBuffer) {
    try {
        const translatedPrompt = await translateToEnglish(prompt)
        const form = new FormData()
        form.append("prompt", translatedPrompt)
        form.append("input_image_type", "image2image")
        form.append("aspect_ratio", "4x5")
        form.append("guidance_scale", "9.5")
        form.append("controlnet_conditioning_scale", "0.5")
        form.append("image_file", imageBuffer, "image.png")
        
        const response = await axios.post(
            "https://api.creartai.com/api/v2/image2image",
            form,
            {
                headers: form.getHeaders(),
                responseType: "arraybuffer",
            }
        )
        return Buffer.from(response.data)
    } catch (err) {
        throw new Error(err?.message || err)
    }
}

module.exports = {
    creartTxt2Img,
    creartImg2Img
}