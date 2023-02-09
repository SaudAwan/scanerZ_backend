function extractIdFromUrl(url) {
   return url.split('/').pop().split('.')[0]
}

module.exports = extractIdFromUrl
