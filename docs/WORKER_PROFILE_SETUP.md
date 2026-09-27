# Worker Profile Feature - Implementation Guide

## Quick Start

### What Was Added
A complete worker profile management system that allows workers to view and edit their profile information through a modal drawer accessed from the top-right of the Worker Dashboard.

### Files Created
1. **`client/src/components/dashboard/WorkerProfileModal.jsx`** - Main modal component (290 lines)
   - Displays all worker information
   - Editable fields: phone, work radius, bio
   - Real-time validation and error handling
   - Smooth animations and responsive design

### Files Modified
1. **`client/src/features/worker/WorkerDashboard.jsx`**
   - Added profile modal state management
   - Added profile button in header (top-right)
   - Added modal rendering
   - Added save handler

2. **`client/src/services/worker.service.js`**
   - Added `updateProfile()` method for API calls

## Feature Walkthrough

### 1. Access the Profile
- Look at the top-right of Worker Dashboard
- Click the profile icon button (orange circle with user icon)
- The modal slides in from the right side

### 2. View Profile Information
The modal displays:
- **Personal**: Name, email, phone
- **Professional**: Trade, rating, total earnings
- **Location**: Current address, working radius (km)
- **About**: Bio/experience description
- **Status**: Verification badges (Aadhaar, NSDC, Bank verified)

### 3. Edit Profile
- Click "Edit Profile" button
- Fields become editable:
  - **Phone**: Direct text input
  - **Work Radius**: Slider (1-100 km) + number input
  - **Bio**: Textarea for experience description

### 4. Save Changes
- Click "Save Changes" 
- System validates working radius (1-100 km)
- Success message shows for 3 seconds
- Profile auto-updates

### 5. Close Modal
- Click "Close" button OR
- Click X button in top-right

## Key Features

✅ **Profile Viewing** - See all worker information at a glance
✅ **Work Radius Management** - Adjust job search area with slider
✅ **Phone Update** - Change contact information
✅ **Bio Editing** - Update professional description
✅ **Real-time Validation** - Input validation with error messages
✅ **Responsive Design** - Works on mobile, tablet, desktop
✅ **Smooth Animations** - Slide-in modal with backdrop blur
✅ **Error Handling** - Graceful error messages and retry capability
✅ **Loading States** - Visual feedback during save operation

## Technical Details

### Component Architecture
```
WorkerDashboard
├── Profile button (top-right) → toggles modal
└── WorkerProfileModal (conditional render)
    ├── Header (sticky)
    ├── Scrollable Content
    │   ├── Profile image
    │   ├── View/Edit fields
    │   ├── Validation feedback
    │   └── Verification status
    └── Footer (sticky) - Action buttons
```

### State Management
```javascript
// In WorkerDashboard.jsx
const [showProfileModal, setShowProfileModal] = useState(false);
const [isSavingProfile, setIsSavingProfile] = useState(false);

// In WorkerProfileModal.jsx
const [isEditing, setIsEditing] = useState(false);
const [editData, setEditData] = useState({...});
const [error, setError] = useState(null);
const [saveMessage, setSaveMessage] = useState(null);
```

### API Integration
**Endpoint**: `PATCH /workers/profile`

**Request Payload**:
```json
{
  "location": {
    "workingRadiusKm": 25
  },
  "bio": "Experienced electrician...",
  "phone": "+91 9876543210"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "worker_123",
    "name": "John Doe",
    "phone": "+91 9876543210",
    "bio": "...",
    "location": {
      "workingRadiusKm": 25,
      "address": "Mumbai"
    }
  }
}
```

## Styling Highlights

### Color Scheme
- **Primary**: Brand saffron (#F97316) for buttons and accents
- **Secondary**: Brand navy (#1F2B4D) for tabs
- **Accent**: Emerald (#10B981) for success states
- **Neutral**: Slate grays for text and borders

### Responsive Breakpoints
- **Mobile**: Full-screen width, hide text labels
- **Tablet**: 85% width with padding
- **Desktop**: 448px max width (max-w-md)

### Animations
- **Modal Entry**: Slide-in from right (200ms)
- **Backdrop**: Fade-in blur effect (150ms)
- **Button Hover**: Scale and shadow effects

## Validation Rules

### Work Radius (km)
- **Range**: 1-100 km
- **Input Types**: Slider or number input
- **Error Handling**: Shows error if outside range
- **UI Feedback**: Real-time value display

### Phone Number
- **Format**: Tel input with placeholder "+91 XXXXXXXXXX"
- **Validation**: Basic format check
- **Optional**: Can be empty

### Bio
- **Type**: Textarea
- **Max Recommended**: 500 characters
- **Optional**: Can be empty

## How to Test

1. **Open Worker Dashboard**
   ```bash
   npm run dev
   Navigate to /worker
   ```

2. **Click Profile Button** (top-right)
   - Should see modal slide in
   - All info should display correctly

3. **Test Edit Mode**
   - Click "Edit Profile"
   - Try changing work radius
   - Try changing phone and bio
   - Test slider and number input

4. **Test Validation**
   - Try entering radius > 100 or < 1
   - Should see error message

5. **Test Save**
   - Change at least one field
   - Click "Save Changes"
   - Should see success message
   - Close and reopen to verify persistence

6. **Test Responsive**
   - Resize browser window
   - Test on mobile view
   - Verify layout adapts

## Customization Options

### Adjust Modal Width
Edit in `WorkerProfileModal.jsx`:
```jsx
<div className="bg-white w-full max-w-md h-screen ...">
  // Change max-w-md to max-w-lg (512px) or max-w-2xl (672px)
</div>
```

### Change Work Radius Limits
Edit in `WorkerProfileModal.jsx`:
```jsx
<input type="range" min="5" max="50" {...} />
// Change from 1-100 to 5-50
```

### Customize Colors
Edit Tailwind classes:
- Replace `brand-saffron` with `brand-navy`, `emerald`, etc.
- Adjust opacity with `opacity-50`, `opacity-75`, etc.

## Backend Requirements

Your API must support:

1. **GET /workers/profile**
   - Returns worker profile data
   - Already implemented

2. **PATCH /workers/profile**
   - Updates worker profile
   - Required fields in body: location, bio, phone
   - Returns updated profile

**Example API Implementation** (if not already done):
```javascript
// server/routes/workers.js
router.patch('/profile', authenticateWorker, async (req, res) => {
  const { location, bio, phone } = req.body;
  
  const worker = await Worker.findByIdAndUpdate(
    req.user.id,
    { location, bio, phone },
    { new: true }
  );
  
  res.json({ success: true, data: worker });
});
```

## Common Issues & Solutions

### Issue: Modal doesn't appear
**Solution**: 
- Check if profile data is loaded
- Verify `showProfileModal` state is true
- Check console for errors

### Issue: Save fails silently
**Solution**:
- Open DevTools Network tab
- Check API response
- Verify endpoint exists on backend
- Check request payload is correct

### Issue: Work radius slider doesn't update
**Solution**:
- Clear browser cache
- Check console for JavaScript errors
- Verify range input min/max values

### Issue: Layout looks broken on mobile
**Solution**:
- Verify Tailwind CSS is loaded
- Check z-index conflicts with other modals
- Test in different screen sizes

## Next Steps

1. ✅ Component is ready to use
2. ⚠️ Backend API endpoint needs to be implemented (if not done)
3. Test on your deployment environment
4. Monitor usage and gather user feedback
5. Consider future enhancements:
   - Profile image upload
   - Skills/certifications editing
   - Work availability hours

## Support

For issues or questions:
1. Check the component code comments
2. Review the full documentation: `WORKER_PROFILE_FEATURE.md`
3. Test in browser DevTools
4. Check backend API logs

---

**Status**: ✅ Ready for Production
**Last Updated**: September 26, 2026
