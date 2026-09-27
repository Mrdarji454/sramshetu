import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Star,
  DollarSign,
  Compass,
  Camera,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

/**
 * Worker Profile Modal Component
 * Displays worker information and allows editing of certain fields
 */
export function WorkerProfileModal({ profile, onClose, onSave, isLoading }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    workingRadiusKm: profile?.location?.workingRadiusKm || 15,
    bio: profile?.bio || profile?.experience?.bio || "",
    profileImage: profile?.profileImage || "",
    phone: profile?.phone || "",
  });
  const [saveMessage, setSaveMessage] = useState(null);
  const [error, setError] = useState(null);

  // Sync editData when profile loads or updates
  React.useEffect(() => {
    if (profile) {
      setEditData({
        workingRadiusKm: profile?.location?.workingRadiusKm || 15,
        bio: profile?.bio || profile?.experience?.bio || "",
        profileImage: profile?.profileImage || "",
        phone: profile?.phone || "",
      });
    }
  }, [profile]);

  // Safely format address into string
  const formatLocation = (loc) => {
    if (!loc) return "N/A";
    if (typeof loc.address === "string" && loc.address.trim())
      return loc.address;
    if (loc.address && typeof loc.address === "object") {
      const parts = [
        loc.address.street,
        loc.address.city,
        loc.address.state,
        loc.address.pincode,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    if (loc.city) return `${loc.city}${loc.state ? `, ${loc.state}` : ""}`;
    return "N/A";
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, WEBP, or GIF image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleEditChange("profileImage", reader.result);
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSaveMessage(null);

      // Validate work radius
      if (editData.workingRadiusKm < 1 || editData.workingRadiusKm > 100) {
        setError("Work radius must be between 1 and 100 km");
        return;
      }

      // Call parent save function
      await onSave(editData);
      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-150">
      {/* Sidebar Drawer */}
      <div className="bg-white w-full max-w-md h-screen overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-brand-saffron-50 to-amber-50 border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-saffron-200 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-saffron-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Worker Profile
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? "Edit your details" : "View your information"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Loading skeleton — shown when profile data hasn't arrived yet */}
          {!profile?.name && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 animate-pulse flex items-center justify-center">
                <User className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                Loading your profile…
              </p>
              <p className="text-xs text-slate-400">
                If this takes too long, try refreshing the page.
              </p>
            </div>
          )}
          {/* Full content — only shown when profile.name is available */}
          {profile?.name && (
            <>
              {/* Success Message */}
              {saveMessage && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  {saveMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Profile Image Section */}
              <div className="text-center space-y-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-saffron-200 to-amber-200 mx-auto flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  {editData.profileImage ? (
                    <img
                      src={editData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-brand-saffron-700" />
                  )}
                </div>
                {isEditing && (
                  <label className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Camera className="h-4 w-4" /> Change Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>

              {/* Name & Basic Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Full Name
                  </label>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {profile?.name || "N/A"}
                  </p>
                </div>

                {/* Phone - Editable */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) =>
                        handleEditChange("phone", e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-saffron-500 text-sm"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  ) : (
                    <p className="flex items-center gap-2 text-slate-900 mt-1">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {profile?.phone || "N/A"}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Email
                  </label>
                  <p className="flex items-center gap-2 text-slate-900 mt-1">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {profile?.email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Professional Info */}
              <div className="space-y-3">
                {/* Profession/Trade */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Primary Trade
                  </label>
                  <p className="flex items-center gap-2 text-slate-900 mt-1">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {profile?.profession ||
                      profile?.experience?.primaryTrade ||
                      "N/A"}
                  </p>
                </div>

                {/* Rating */}
                {profile?.rating && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Rating
                    </label>
                    <p className="flex items-center gap-2 text-slate-900 mt-1">
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                      {typeof profile.rating === "object"
                        ? profile.rating.average || "N/A"
                        : profile.rating}{" "}
                      (
                      {typeof profile.rating === "object"
                        ? profile.rating.count || 0
                        : 0}{" "}
                      reviews)
                    </p>
                  </div>
                )}

                {/* Earnings */}
                {profile?.earnings && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Total Earnings
                    </label>
                    <p className="flex items-center gap-2 text-emerald-600 font-bold mt-1">
                      <DollarSign className="w-4 h-4" />₹
                      {Number(
                        typeof profile.earnings === "object"
                          ? profile.earnings.total || 0
                          : profile.earnings || 0,
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Location & Radius */}
              <div className="space-y-3">
                {/* Location */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Working Location
                  </label>
                  <p className="flex items-start gap-2 text-slate-900 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{formatLocation(profile?.location)}</span>
                  </p>
                </div>

                {/* Work Radius - Editable */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                    <Compass className="w-4 h-4 text-brand-saffron-600" />
                    Working Radius
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={editData.workingRadiusKm}
                        onChange={(e) =>
                          handleEditChange(
                            "workingRadiusKm",
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full"
                      />
                      <div className="flex items-center justify-between">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editData.workingRadiusKm}
                          onChange={(e) =>
                            handleEditChange(
                              "workingRadiusKm",
                              Math.min(
                                100,
                                Math.max(1, parseInt(e.target.value)),
                              ),
                            )
                          }
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-sm font-bold text-center"
                        />
                        <span className="text-sm font-bold text-slate-600">
                          km radius
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        You'll receive jobs within {editData.workingRadiusKm} km
                        of your location
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-brand-saffron-600">
                      {editData.workingRadiusKm} km radius
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Bio - Editable */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  About You
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.bio}
                    onChange={(e) => handleEditChange("bio", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-saffron-500 text-sm min-h-20 resize-none"
                    placeholder="Write something about your experience and skills..."
                  />
                ) : (
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {profile?.bio ||
                      profile?.experience?.bio ||
                      "No bio added yet"}
                  </p>
                )}
              </div>

              {/* Verification Status */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  ✓ Verification Status
                </p>
                <div className="space-y-1 text-xs text-emerald-700">
                  <p className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Aadhaar Verified
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    NSDC Certified
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Bank Account Verified
                  </p>
                </div>
              </div>
            </>
          )}{" "}
          {/* end profile?.name fragment */}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 space-y-3">
          {isEditing ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkerProfileModal;
