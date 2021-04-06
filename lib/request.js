const request = require('request')
const TIMEOUT = 10000

class Request {
  constructor(auth, defaults) {
    if (typeof auth === 'object') {
      this.apikey = auth.apikey
      this.siteid = auth.siteid

      this.auth = `Basic ${Buffer.from(
        `${this.siteid}:${this.apikey}`,
        'utf8'
      ).toString('base64')}`
    } else {
      this.appKey = auth
      this.auth = `Bearer ${this.appKey}`
    }

    this.defaults = Object.assign(
      {
        timeout: TIMEOUT,
      },
      defaults
    )
    this._request = request.defaults(this.defaults)
  }

  options(uri, method, data) {
    const headers = {
      Authorization: this.auth,
      'Content-Type': 'application/json',
    }

    let options = { method, uri, headers }

    if (method === 'GET') {
      // query string
      options.qs = data
    } else {
      if (data) options.body = JSON.stringify(data)
    }

    return options
  }

  handler(options) {
    return new Promise((resolve, reject) => {
      this._request(options, (error, response, body) => {
        if (error) return reject(error)

        let json = null
        try {
          if (body) json = JSON.parse(body)
        } catch (e) {
          const message = `Unable to parse JSON. Error: ${e} \nBody:\n ${body}`
          return reject(new Error(message))
        }

        if (response.statusCode == 200 || response.statusCode == 201) {
          resolve(json)
        } else {
          reject({
            message: (json && json.meta && json.meta.error) || 'Unknown error',
            statusCode: response.statusCode,
            response: response,
            body: body,
          })
        }
      })
    })
  }

  get(uri, data = {}) {
    return this.handler(this.options(uri, 'GET', data))
  }

  put(uri, data = {}) {
    return this.handler(this.options(uri, 'PUT', data))
  }

  destroy(uri) {
    return this.handler(this.options(uri, 'DELETE'))
  }

  post(uri, data = {}) {
    return this.handler(this.options(uri, 'POST', data))
  }
}

module.exports = Request
