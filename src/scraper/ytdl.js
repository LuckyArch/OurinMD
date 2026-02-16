const axios = require('axios')

class Youtube {
    constructor() {
        this.API_URL = "https://thesocialcat.com/api/youtube-download"
        this.HEADERS = {
            "accept": "*/*",
            "accept-language": "id-ID",
            "content-type": "application/json",
            "Referer": "https://thesocialcat.com/tools/youtube-video-downloader",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
        this.CREATED_BY = "Ditzzy"
        this.NOTE = "Thank you for using this scrape"
    }

    wrapResponse(data) {
        return {
            created_by: this.CREATED_BY,
            note: this.NOTE,
            results: data
        }
    }

    async download(url, format = 'audio') {
        try {
            const config = {
                url: this.API_URL,
                headers: this.HEADERS,
                method: "POST",
                data: {
                    format,
                    url
                },
                timeout: 60000
            }

            const { data } = await axios.request(config)
            return this.wrapResponse(data)
        } catch (e) {
            throw new Error(`Error downloading YouTube content: ${e.message}`)
        }
    }
}

module.exports = { Youtube }
