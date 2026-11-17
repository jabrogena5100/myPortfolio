// CloudFront Function (cloudfront-js-2.0), viewer-request.
// The site is built as directories (/projects/ryucloud/index.html), but S3 does not serve index documents
// for sub-paths. This maps a directory URL to its index.html and sends extension-less paths to the
// trailing-slash form, which is the canonical URL (Astro `trailingSlash: 'always'`).
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.charAt(uri.length - 1) === '/') {
    request.uri = uri + 'index.html';
    return request;
  }

  var last = uri.substring(uri.lastIndexOf('/') + 1);
  if (last.indexOf('.') === -1) {
    var qs = Object.keys(request.querystring)
      .map(function (k) { return k + '=' + request.querystring[k].value; })
      .join('&');
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: uri + '/' + (qs ? '?' + qs : '') } },
    };
  }

  return request;
}
