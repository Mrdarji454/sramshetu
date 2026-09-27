export function getDefaultAddressForBooking(addresses = []) {
    const address = addresses.find(item => item.isDefault) || addresses[0];
    if (!address) return null;

    return {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        landmark: address.landmark || '',
        coordinates: Array.isArray(address.coordinates) ? address.coordinates : [0, 0],
    };
}
