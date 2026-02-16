const axios = require('axios');
const cheerio = require('cheerio');

async function ttdown(url) {
    try {
        if (!url.includes('tiktok.com')) throw new Error('Invalid url.');
        
        const { data: html, headers } = await axios.get('https://musicaldown.com/en');
        const $ = cheerio.load(html);
        
        const payload = {};
        $('#submit-form input').each((i, elem) => {
            const name = $(elem).attr('name');
            const value = $(elem).attr('value');
            if (name) payload[name] = value || '';
        });
        
        const urlField = Object.keys(payload).find(key => !payload[key]);
        if (urlField) payload[urlField] = url;
        
        const { data } = await axios.post('https://musicaldown.com/download', new URLSearchParams(payload).toString(), {
            headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                cookie: headers['set-cookie'].join('; '),
                origin: 'https://musicaldown.com',
                referer: 'https://musicaldown.com/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });
        
        const $$ = cheerio.load(data);
        
        const videoHeader = $$('.video-header');
        const bgImage = videoHeader.attr('style');
        const coverMatch = bgImage?.match(/url\((.*?)\)/);
        
        const downloads = [];
        $$('a.download').each((i, elem) => {
            const $elem = $$(elem);
            const type = $elem.data('event')?.replace('_download_click', '');
            const label = $elem.text().trim();
            downloads.push({
                type: type,
                label: label,
                url: $elem.attr('href')
            });
        });
        
        return {
            title: $$('.video-desc').text().trim(),
            author: {
                username: $$('.video-author b').text().trim(),
                avatar: $$('.img-area img').attr('src')
            },
            cover: coverMatch ? coverMatch[1] : null,
            downloads: downloads
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = ttdown
