# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

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
