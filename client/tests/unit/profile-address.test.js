import assert from 'node:assert/strict';
import { getDefaultAddressForBooking } from '../../src/utils/address.utils.js';

const first = {
    id: 'home', label: 'Home', street: '17 Lake Road', city: 'Pune',
    state: 'Maharashtra', pincode: '411001', landmark: 'Near park',
    coordinates: [73.8, 18.5], isDefault: true,
};
const second = { ...first, id: 'work', label: 'Work', street: 'Office', isDefault: false };
assert.deepEqual(getDefaultAddressForBooking([first, second]), {
    street: '17 Lake Road', city: 'Pune', state: 'Maharashtra',
    pincode: '411001', landmark: 'Near park', coordinates: [73.8, 18.5],
});
assert.equal(getDefaultAddressForBooking([second]).street, 'Office');
assert.equal(getDefaultAddressForBooking([]), null);
console.log('Profile address prefill: 3 tests passed');
