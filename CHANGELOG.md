# Changelog
All notable changes to this project will be documented in this file.

## [3.1.3]

- Revert [#93](https://github.com/customerio/customerio-node/pull/93) due to a crashing bug ([#95](https://github.com/customerio/customerio-node/pull/95))

## [3.1.2]

- Set `User-Agent` for property source attributes on activity logs ([#93](https://github.com/customerio/customerio-node/pull/93))

## [3.1.1]

- Fixed types for the `fake_bcc` parameter for transactional emails ([#92](https://github.com/customerio/customerio-node/pull/92))

## [3.1.0]

- Adding support for [Merge Customers API](https://customer.io/docs/api/#operation/merge)

## [3.0.3]

- Fix an issue with some instances of `HTTPS.request` in certain runtimes ([#83](https://github.com/customerio/customerio-node/pull/83))

## [3.0.2]

- Fix a few issues in the README documentation ([#73](https://github.com/customerio/customerio-node/pull/73))
- Allow `subject` and `body` to be overridden independent of `from` for transactional messages ([#75](https://github.com/customerio/customerio-node/pull/75))

## [3.0.1]

- Fix an issue calculating the content length of multi-byte utf-8 string characters ([#69](https://github.com/customerio/customerio-node/pull/69))

## [3.0.0]

- (**BREAKING**) Remove the dependency on `request` ([#62](https://github.com/customerio/customerio-node/pull/62))
  - We don't expect this to break many consumers of `customerio-node`. Unless you were using [`request`](https://github.com/request/request#requestoptions-callback) specific options, you don't need to make any changes.

- (**BREAKING**) Return an `Error` instance for non-`2XX` status codes ([#62](https://github.com/customerio/customerio-node/pull/62))
  - We don't expect this to break many consumers of `customerio-node`. Unless you were using `instanceof` to check the type of error returned from track or api methods, you don't need to make any changed. `message`, `statusCode`, `response`, and `body` are still accessible as properties on the error.

- (**BREAKING**) `trackAnonymous` now requires an `anonymous_id` and cannot trigger campaigns. If you previously used anonymous events to trigger campaigns, you can still do so [directly through the API](https://customer.io/docs/api/#operation/trackAnonymous). We now refer to anonymous events that trigger campaigns as "invite events". 

- (**BREAKING**) Restructure the package to have a single entry point, rather than three. This is more of a standard package structure, and is more future-proof. ([#63](https://github.com/customerio/customerio-node/pull/63))

- Return a readable message when the server returns an array of errors instead of `Unknown error` ([#62](https://github.com/customerio/customerio-node/pull/62))


## [2.1.1]

### Changed
- Fix exported typings for folks using `customerio-node` with Typescript ([#56](https://github.com/customerio/customerio-node/pull/56))

## [2.1.0]

### Changed
- Upgrade `ini` from 1.3.5 to 1.3.8 ([#36](https://github.com/customerio/customerio-node/pull/36))

### Added
- Convert `customerio-node` to Typescript ([#49](https://github.com/customerio/customerio-node/pull/49))

## [2.0.0]
### Changed
- (Breaking) Move triggerBroadcast method from Track to API class ([#46](https://github.com/customerio/customerio-node/pull/46))

## [1.1.0]
### Added
- Support for the EU region

## [1.0.0]
### Added
- Support for the Transactional API

### Removed
- `addToSegment` and `removeFromSegment` methods

### Changed
- IDs in the URLs are now escaped.
- Improved validations for data that's passed in.

## [0.7.0]
### Changed
- Catch scenarios where a response body is unexpectedly `null` ([#25](https://github.com/customerio/customerio-node/pull/25))

### Added
- Allow request defaults to be overridden ([#26](https://github.com/customerio/customerio-node/pull/26))
- New API call for supressing customers ([#27](https://github.com/customerio/customerio-node/pull/27))

## [0.6.0]
### Changed
- Add missing API params to `triggerBroadcast` ([#19](https://github.com/customerio/customerio-node/pull/19))
- Further improve the `triggerBroadcast` API call and catch additional params ([#20](https://github.com/customerio/customerio-node/pull/20))
- Switch from Travis CI to Circle CI ([#21](https://github.com/customerio/customerio-node/pull/21))

## [0.5.0]
### Added
- New API calls for manual segments (`addToSegment`, `removeFromSegment`) ([#16](https://github.com/customerio/customerio-node/pull/16))

## [0.4.0]
### Added
- New API call for adding and removing devices from push notifications ([#14](https://github.com/customerio/customerio-node/pull/14))

## [0.3.0]
### Changed
- Huge thanks to [@jescalan](https://github.com/jescalan) for his work in modernizing the Javascript to es6 along with updating dependencies. ([#13](https://github.com/customerio/customerio-node/pull/13))
- README now has the correct Travis-CI badge
- README has standardized and expanded examples ([#10](https://github.com/customerio/customerio-node/issues/10))
- Fixed link in README to official Customer.io API docs
- Cleaned up .gitignore by removing unnecessary ignore statements

### Added
- This CHANGELOG file along with historical changes to provide better transparancy to changes made to the library
- New API call for API triggered broadcasts
  - Added a test for the new call
  - Added an example for the new call to README and examples/ dir
- An example config file for the practical examples
- Travis-CI builds now use currently maintained LTS versions of Node.JS (6, 8, 9)

### Removed
- .gitkeep files no longer necessary to preserve directories

## [0.2.0] - 2015-07-22
### Removed
- url.resolve() removed from API calls

## [0.1.0] - 2015-07-22
### Added
- Initial API client library
  - Create Identify call
  - Create Track call
  - Create Track Page View call
  - Create Customer Delete call
  - Test suite for API calls
- HTTP Request middleware
  - Create request handler with RSVP.js
  - Create options method for unifying all request calls
  - Create POST request
  - Create PUT request
  - Create DELETE request
  - Test suite for middleware


[Unreleased]: https://github.com/customerio/customerio-node/compare/v1.0.0...HEAD
[0.3.0]: https://github.com/customerio/customerio-node/compare/d3df250...v0.3.0
[0.2.0]: https://github.com/customerio/customerio-node/compare/54e7c68...d3df250
[0.1.0]: https://github.com/customerio/customerio-node/compare/943668e...54e7c68
