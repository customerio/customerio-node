const CIO = require('customerio-node')
const cio = new CIO(siteid, apikey)

async function* getSegmentMembership(segmentId, limit = 1000) {
  let next = null
  while (true) {
    try {
      const response = await cio.getSegmentMembership(segmentId, next, limit)
      yield response.ids
      next = response.next
      if (!next) break
    } catch (error) {
      console.error(error)
      break
    }
  }
}

async function getIds(segmentId) {
  let segmentIds = []
  for await (const ids of getSegmentMembership(segmentId)) {
    console.log(`Fetched ${ids.length} ids ...`)
    segmentIds = segmentIds.concat(ids)
  }
  console.log(`${segmentIds.length} ids fetched`)
  return segmentIds
}

async function doSomethingWithIds() {
  const segmentId = 7
  const customerIds = await getIds(segmentId)
  // ...
}

doSomethingWithIds()
