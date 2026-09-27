# Worker Profile Modal Feature

## Overview
A comprehensive worker profile management system that allows workers to view and edit their profile information through a modal drawer that opens from the top-right of the Worker Dashboard. This feature enables workers to manage critical fields like work radius, contact information, and professional details.

## Features

### 1. Profile View
- **Display all worker information** including:
  - Full name
  - Phone number
  - Email address
  - Professional trade/profession
  - Rating and reviews
  - Total earnings
  - Working location
  - Current working radius
  - About/Bio section
  - Verification status badges

### 2. Profile Editing
Workers can edit the following fields:
- **Phone Number**: Update contact information
- **Working Radius** (km): Adjust the geographic area to receive job assignments
  - Range: 1-100 km
  - Slider + number input for easy adjustment
  - Real-time visual feedback
- **Bio/About**: Update professional description
- **Profile Image**: Upload new profile photo (placeholder for enhancement)

### 3. Save & Validation
- Real-time error messages for invalid inputs
- Working radius validation (1-100 km range)
- Success feedback with confirmation message
- Auto-dismiss notifications after 3 seconds
- Error state persistence for fixing issues

## Components

### WorkerProfileModal.jsx
**Location**: `client/src/components/dashboard/WorkerProfileModal.jsx`

**Purpose**: Sidebar drawer modal for displaying and editing worker profile

**Key Props**:
- `profile`: Worker profile object with all information
- `onClose`: Callback function to close modal
- `onSave`: Async function to save profile changes
- `isLoading`: Boolean to show loading state during save

**Features**:
- Responsive sidebar design (max-width: 448px)
- Smooth animations (slide-in from right, fade background)
- Error and success message display
- Two-mode interface (view/edit)
- Sticky header and footer for easy access

**Structure**:
```
WorkerProfileModal
├── Header (with close button)
├── Content (scrollable)
│   ├── Profile image section
│   ├── Basic info (name, phone, email)
│   ├── Professional info (trade, rating, earnings)
│   ├── Location & work radius
│   ├── Bio/About section
│   └── Verification status
└── Footer (action buttons)
```

## Usage

### Integration in WorkerDashboard
```jsx
// 1. Import the component and icon
import { WorkerProfileModal } from "../../components/dashboard/WorkerProfileModal";
import { User } from "lucide-react";

// 2. Add state for modal
const [showProfileModal, setShowProfileModal] = useState(false);
const [isSavingProfile, setIsSavingProfile] = useState(false);

// 3. Create save handler
const handleSaveProfile = async (editData) => {
  setIsSavingProfile(true);
  try {
    const updatePayload = {
      location: {
        ...profile?.location,
        workingRadiusKm: editData.workingRadiusKm,
      },
      bio: editData.bio,
      phone: editData.phone,
    };

    await workerService.updateProfile(updatePayload);
    setProfile((prev) => ({
      ...prev,
      ...updatePayload,
      location: updatePayload.location,
    }));
    return true;
  } finally {
    setIsSavingProfile(false);
  }
};

// 4. Add profile button in header
<button
  onClick={() => setShowProfileModal(true)}
  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-saffron-50 to-amber-50 border border-brand-saffron-200 hover:border-brand-saffron-400 hover:shadow-md transition-all group"
>
  <div className="w-8 h-8 rounded-full bg-brand-saffron-200 flex items-center justify-center group-hover:bg-brand-saffron-300 transition">
    <User className="w-4 h-4 text-brand-saffron-700" />
  </div>
  <span className="text-xs font-bold text-slate-700 hidden sm:inline">
    Profile
  </span>
</button>

// 5. Render modal conditionally
{showProfileModal && profile && (
  <WorkerProfileModal
    profile={profile}
    onClose={() => setShowProfileModal(false)}
    onSave={handleSaveProfile}
    isLoading={isSavingProfile}
  />
)}
```

## API Integration

### Worker Service Update
**File**: `client/src/services/worker.service.js`

**New Method**:
```javascript
async updateProfile(profileData) {
  const response = await apiClient.patch('/workers/profile', profileData);
  return response.data || response;
}
```

**Expected Payload**:
```json
{
  "location": {
    "workingRadiusKm": 25
  },
  "bio": "Experienced electrician with 10+ years...",
  "phone": "+91 9876543210"
}
```

**API Endpoint**: `PATCH /workers/profile`

**Expected Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "worker_123",
    "name": "John Doe",
    "phone": "+91 9876543210",
    "bio": "Experienced electrician...",
    "location": {
      "workingRadiusKm": 25,
      "address": "Mumbai, Maharashtra"
    }
  }
}
```

## Styling

### Design System
- **Colors**: Uses Tailwind brand colors (saffron, navy, slate, emerald)
- **Typography**: Professional hierarchy with varying font sizes
- **Icons**: Lucide React icons (User, Phone, Mail, MapPin, Compass, etc.)
- **Spacing**: Consistent padding (6 units = 24px base unit)

### Key CSS Classes
- `.max-w-md`: Modal width (448px)
- `.h-screen`: Full screen height
- `.overflow-y-auto`: Scrollable content
- `.z-50`: Modal z-index for overlay
- `.sticky`: Header and footer positioning
- `.animate-in`: Entry animations

## States & Interactions

### Modal States
1. **Closed**: Modal not visible
2. **View Mode**: Display all profile info, read-only
3. **Edit Mode**: Editable fields highlighted, sliders active
4. **Saving**: Loading state with disabled buttons
5. **Success**: Green confirmation message
6. **Error**: Red error message with retry option

### User Interactions
1. Click profile button (top-right) → Opens modal
2. Click "Edit Profile" → Switches to edit mode
3. Adjust slider/inputs → Live preview
4. Click "Save Changes" → API call
5. See success → Auto-close message
6. Click "Close" or X → Closes modal

## Data Flow

```
User clicks profile icon
    ↓
setShowProfileModal(true)
    ↓
WorkerProfileModal renders with profile data
    ↓
User clicks "Edit Profile"
    ↓
setIsEditing(true) → Shows editable inputs
    ↓
User modifies fields
    ↓
editData state updates in real-time
    ↓
User clicks "Save Changes"
    ↓
handleSaveProfile(editData) called
    ↓
workerService.updateProfile(payload) → API call
    ↓
Success: Update local profile state
         Show success message
         Auto-close after 3s
    ↓
Error: Show error message
       Allow user to retry
```

## Validation Rules

### Working Radius
- **Min**: 1 km
- **Max**: 100 km
- **Type**: Integer
- **Error Message**: "Work radius must be between 1 and 100 km"
- **UI**: Range slider + number input
- **Feedback**: Real-time visual display of selected value

### Phone Number
- **Type**: String/Tel
- **Placeholder**: "+91 XXXXXXXXXX"
- **Optional**: Can be empty (bio is truly optional)

### Bio
- **Type**: Text (up to 500 chars recommended)
- **Placeholder**: "Write something about your experience and skills..."

## Mobile Responsiveness

### Desktop (> 1024px)
- Modal width: 448px (max-w-md)
- Profile button shows icon + text
- All features fully visible

### Tablet (768px - 1024px)
- Modal full screen or 90% width
- Profile button icon + text
- Scrollable if needed

### Mobile (< 768px)
- Modal full screen (100% width)
- Profile button shows icon only (hidden text on sm)
- Touch-friendly inputs (larger touch targets)
- Slide-in animation from right edge

## Performance Considerations

1. **Lazy Loading**: Modal only renders when `showProfileModal` is true
2. **Optimized Re-renders**: Uses local state for editData to avoid parent re-renders
3. **Debounced Inputs**: Range slider updates efficiently
4. **Smooth Animations**: GPU-accelerated with Tailwind's `animate-in`
5. **Image Optimization**: Profile images should be pre-optimized

## Future Enhancements

1. **Profile Image Upload**
   - Implement Camera component
   - Add image cropping
   - Upload to cloud storage

2. **Additional Editable Fields**
   - Skills/certifications
   - Experience details
   - Work availability hours

3. **Batch Operations**
   - Save multiple changes in one API call
   - Track unsaved changes indicator

4. **Photo Verification**
   - Add liveness check for profile photo
   - Support for multiple verification methods

5. **Analytics**
   - Track profile completion percentage
   - Monitor field update frequency

## Files Modified/Created

### New Files
- `client/src/components/dashboard/WorkerProfileModal.jsx` (290 lines)

### Modified Files
- `client/src/features/worker/WorkerDashboard.jsx`
  - Added import for WorkerProfileModal
  - Added import for User icon
  - Added state: `showProfileModal`, `isSavingProfile`
  - Added handler: `handleSaveProfile()`
  - Added profile button in header section
  - Added modal rendering at end of return

- `client/src/services/worker.service.js`
  - Added `updateProfile()` async method

## Testing Checklist

- [ ] Modal opens when profile button is clicked
- [ ] Modal displays all worker information correctly
- [ ] Edit button switches to edit mode
- [ ] Work radius slider works smoothly
- [ ] Work radius number input validates correctly
- [ ] Cancel button exits edit mode without saving
- [ ] Save button calls API correctly
- [ ] Success message displays for 3 seconds
- [ ] Error message displays for invalid radius
- [ ] Profile updates reflect in local state
- [ ] Close button (X) closes modal
- [ ] Modal responsive on mobile/tablet
- [ ] Profile info persists after page refresh

## Troubleshooting

### Modal doesn't appear
- Check if `showProfileModal` state is true
- Verify profile data is loaded
- Check console for errors

### Save fails silently
- Check network tab for API errors
- Verify `/workers/profile` endpoint exists
- Check error handling in `handleSaveProfile`

### Styling issues
- Verify Tailwind CSS is properly configured
- Check z-index conflicts with other modals
- Test in different breakpoints

### Working radius slider not responsive
- Clear browser cache
- Check if max/min values are set correctly
- Verify range input is not disabled

