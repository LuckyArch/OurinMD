const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

async function videy(file){
    try{
        if(!file) throw new Error('input required')
        if(!fs.existsSync(file)) throw new Error('file not found')

        const form = new FormData()
        form.append(
            'file',
            fs.createReadStream(file),
            {
                filename: path.basename(file),
                contentType: 'video/mp4'
            }
        )

        const r = await axios.post(
            'https://videy.co/api/upload?visitorId=' + crypto.randomUUID(),
            form,
            {
                headers:{
                    ...form.getHeaders(),
                    'User-Agent':'Mozilla/5.0 (Linux; Android 10)',
                    origin:'https://videy.co',
                    referer:'https://videy.co/',
                    accept:'application/json'
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        )

        return {
            output:r.data
        }

    }catch(e){
        return { status:'error', msg:e.message }
    }
}

module.exports = videy
