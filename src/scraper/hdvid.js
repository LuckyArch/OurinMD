const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
const API = 'https://api.unblurimage.ai/api/upscaler'

function productserial() {
  const raw = [
    UA,
    process.platform,
    process.arch,
    Date.now(),
    Math.random()
  ].join('|')

  return crypto.createHash('md5').update(raw).digest('hex')
}

const product = productserial()

async function uploadvid(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('file not found')

  const form = new FormData()
  form.append('video_file_name', path.basename(filePath))

  const res = await axios.post(`${API}/v1/ai-video-enhancer/upload-video`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'user-agent': UA,
        origin: 'https://unblurimage.ai',
        referer: 'https://unblurimage.ai/'
      }
    }
  )

  return res.data.result
}

async function putoOss(uploadUrl, filePath) {
  const stream = fs.createReadStream(filePath)

  await axios.put(uploadUrl, stream, {
    headers: {
      'content-type': 'video/mp4'
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  })
}

async function createJob(originalVideoUrl, resolution = '4k', preview = false) {
  const form = new FormData()
  form.append('original_video_file', originalVideoUrl)
  form.append('resolution', resolution)
  form.append('is_preview', preview ? 'true' : 'false')

  const res = await axios.post(`${API}/v2/ai-video-enhancer/create-job`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'user-agent': UA,
        origin: 'https://unblurimage.ai',
        referer: 'https://unblurimage.ai/',
        'product-serial': product
      }
    }
  )

  if (res.data?.code !== 100000) {
    throw new Error(JSON.stringify(res.data))
  }

  return res.data.result.job_id
}

async function getjob(jobId) {
  const res = await axios.get(`${API}/v2/ai-video-enhancer/get-job/${jobId}`,
    {
      headers: {
        'user-agent': UA,
        origin: 'https://unblurimage.ai',
        referer: 'https://unblurimage.ai/',
        'product-serial': product
      }
    }
  )

  return res.data
}

async function pollJob(jobId, interval = 5000) {
  while (true) {
    const res = await getjob(jobId)

    if (res.code === 100000 && res.result?.output_url) {
      return res.result
    }

    if (res.code !== 300010) {
      throw new Error(JSON.stringify(res))
    }

    await new Promise(r => setTimeout(r, interval))
  }
}

async function videoenhancer(video, resolution = '4k') {
  if (!video) throw new Error('video is required')

  const upload = await uploadvid(video)
  await putoOss(upload.url, video)
  const cdnUrl = 'https://cdn.unblurimage.ai/' + upload.object_name
  const jobId = await createJob(cdnUrl, resolution, false)
  const result = await pollJob(jobId)

  return {
    job_id: jobId,
    input_url: result.input_url,
    output_url: result.output_url
  }
}

module.exports = videoenhancer