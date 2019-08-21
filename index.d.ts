
export = CIO

declare namespace CIO {
    // MARK: - Customer
    namespace Customer {
        interface Payload {
            email: string
            created_at?: number
            [key: string]: any
        }
    }

    // MARK: - Track
    namespace Track {
        interface Payload {
            name: string
            data?: object
        }
    }

    namespace TrackAnonymous {
        interface Payload {
            name: string,
            data?: {
                [key: string]: any
                recipient?: string
                from_address?: string
                reply_to?: string
            }
        }
    }

    // MARK: - Device
    namespace Device {
        type Payload = object
        type Platform = 'ios' | 'android'
    }

    // MARK: - Broadcast
    namespace Broadcast {
        type Payload = object

        interface FilterPerDataFile {
            data_file_url: string
        }

        interface FilterPerUserData {
            per_user_data: Array<{ id: string, data: object } | { email: string, data: object }>
            id_ignore_missing?: boolean
            email_ignore_missing?: boolean
            email_add_duplicates?: boolean
        }

        interface FiltersById {
            ids: Array<string>
            id_ignore_missing?: boolean
        }

        interface FiltersByEmail {
            emails: Array<string>
            email_ignore_missing?: boolean
            email_add_duplicates?: boolean
        }

        interface FiltersByRecipients {
            recipients: { segment: { id: number } }
        }

        type Filter = FiltersById | FiltersByEmail | FiltersByRecipients | FilterPerDataFile | FilterPerUserData

        interface Response {
            id: number
        }
    }

}

/**
 * Creating a new instance
 * 
 * Both the siteId and apiKey are required in order to create a Basic Authorization header, allowing us to associate the data with your account.
 */
declare class CIO {
    constructor(siteId: string, apiKey: string)

    // MARK: - Customers
    /** Creating a person is as simple as identifying them with this call. You can also use this method to update a persons data. */
    identify(customerId: string, payload: CIO.Customer.Payload): Promise<void>

    /** This will delete a person from Customer.io. */
    destroy(customerId: string): Promise<void>

    // MARK: - Tracking
    /** The track method will trigger events within Customer.io. When sending data along with your event, 
     * it is required to send a name key/value pair in you data object. */
    track(customerId: string, payload: CIO.Track.Payload): Promise<void>

    /** Anonymous event tracking does not require a customer ID and these events will not be associated with a tracked profile in Customer.io */
    trackAnonymous(payload: CIO.TrackAnonymous.Payload): Promise<void>

    /** Sending a page event includes sending over the customers id and the name of the page. */
    trackPageView(customerId: string, url: string): Promise<void>

    // MARK: - Device
    /** Add a device to send push notifications. */
    addDevice(customerId: string, deviceId: string, platform: CIO.Device.Platform, payload: CIO.Device.Payload): Promise<void>

    /** Delete a device to remove it from the associated customer and stop sending push notifications to it. */
    deleteDevice(customerId: string, deviceId: string): Promise<void>

    // MARK: - Segments
    /** Add customers to a manual segment.  */
    addToSegment(segmentId: string, customerIds: Array<string>): Promise<void>

    /** Remove customers from a manual segment. */
    removeFromSegment(segmentId: string, customerIds: Array<string>): Promise<void>

    // MARK: - Broadcast
    triggerBroadcast(campaignId: string, payload?: CIO.Broadcast.Payload, filters?: CIO.Broadcast.Filter): Promise<CIO.Broadcast.Response>
}