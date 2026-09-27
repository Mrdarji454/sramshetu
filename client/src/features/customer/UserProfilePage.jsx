import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  FileText,
  Home,
  LockKeyhole,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { bookingService } from "../../services/booking.service";
import { paymentStatusLabel } from "../../utils/paymentStatus";
import { otpService } from "../../services/otp.service";
import { profileService } from "../../services/profile.service";
import { pincodeService } from "../../services/pincode.service";

const sections = [
  { id: "overview", label: "Overview", icon: CircleUserRound },
  { id: "details", label: "Personal Details", icon: UserRound },
  { id: "addresses", label: "Saved Addresses", icon: Home },
  { id: "vault", label: "Vault", icon: CreditCard },
  { id: "security", label: "Security & Preferences", icon: ShieldCheck },
];

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-saffron-500 focus:ring-2 focus:ring-brand-saffron-100";
const emptyAddress = () => ({
  id: "",
  label: "Home",
  street: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  longitude: "",
  latitude: "",
});
const money = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not recorded";
const initials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-brand-navy-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function TextField({
  label,
  id,
  value,
  onChange,
  required = false,
  type = "text",
  maxLength,
  autoComplete,
}) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      {label}
      {required && <span className="text-red-600"> *</span>}
      <input
        id={id}
        name={id}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={fieldClass}
      />
    </label>
  );
}

export function UserProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [section, setSection] = useState(
    searchParams.get("section") || "overview",
  );
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [details, setDetails] = useState({ name: "", email: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneDebugCode, setPhoneDebugCode] = useState("");
  const [phoneVerifiedForEdit, setPhoneVerifiedForEdit] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressDraft, setAddressDraft] = useState(emptyAddress);
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressNotice, setAddressNotice] = useState("");
  const [locating, setLocating] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const photoInputRef = useRef(null);

  const loadProfile = async () => {
    const data = await profileService.getProfile();
    setProfile(data);
    setDetails({
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
    });
    return data;
  };

  const loadPage = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileResult, bookingResult, vaultResult] =
        await Promise.allSettled([
          profileService.getProfile(),
          bookingService.getBookings(),
          profileService.getVault(),
        ]);
      if (profileResult.status === "rejected") throw profileResult.reason;
      setProfile(profileResult.value);
      setDetails({
        name: profileResult.value.name || "",
        email: profileResult.value.email || "",
        phone: profileResult.value.phone || "",
      });
      setBookings(
        bookingResult.status === "fulfilled" &&
          Array.isArray(bookingResult.value)
          ? bookingResult.value
          : [],
      );
      setVault(vaultResult.status === "fulfilled" ? vaultResult.value : null);
      if (
        bookingResult.status === "rejected" ||
        vaultResult.status === "rejected"
      ) {
        setNotice(
          "Some booking or Vault information could not be loaded. Refresh to retry.",
        );
      }
    } catch (loadError) {
      setError(loadError.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);
  useEffect(() => {
    const requested = searchParams.get("section");
    if (requested && sections.some((item) => item.id === requested))
      setSection(requested);
  }, [searchParams]);

  const openSection = (id) => {
    setSection(id);
    const params = new URLSearchParams(searchParams);
    params.set("section", id);
    setSearchParams(params);
  };

  const activeBooking = useMemo(
    () =>
      bookings.find(
        (booking) =>
          !["COMPLETED", "CANCELLED"].includes(
            String(booking.status || "").toUpperCase(),
          ),
      ) ||
      bookings[0] ||
      null,
    [bookings],
  );
  const transactions = vault?.transactions || [];
  const filteredTransactions = transactions.filter(
    (item) =>
      transactionFilter === "all" || item.paymentStatus === transactionFilter,
  );
  const savedAddresses = profile?.addresses || [];

  const updateProfilePhoto = (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeByExtension = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    const supportedTypes = Object.values(mimeByExtension);
    const photoType = supportedTypes.includes(file.type)
      ? file.type
      : mimeByExtension[extension];
    if (!photoType || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, WEBP, or GIF image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const previousImage = profile?.profileImage;
      const nextImage = reader.result;
      setProfile((previous) => ({ ...previous, profileImage: nextImage }));
      updateUser?.({ profileImage: nextImage });
      setSaving(true);
      setError("");
      try {
        const updated = await profileService.updateProfile({
          profileImage: nextImage,
        });
        setProfile((previous) => ({
          ...previous,
          profileImage: updated.profileImage,
        }));
        updateUser?.({ profileImage: updated.profileImage });
        setNotice("Profile photo updated everywhere.");
      } catch (photoError) {
        setProfile((previous) => ({
          ...previous,
          profileImage: previousImage,
        }));
        updateUser?.({ profileImage: previousImage });
        setError(photoError.message || "Unable to update profile photo.");
      } finally {
        setSaving(false);
      }
    };
    reader.onerror = () => setError("Could not read that image.");
    reader.readAsDataURL(file.slice(0, file.size, photoType));
  };

  const savePersonalDetails = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (details.phone !== profile.phone && !phoneVerifiedForEdit) {
      setError("Verify your new phone number before saving it.");
      return;
    }
    if (details.email !== profile.email) {
      setError("Verify your new email address before saving it.");
      return;
    }
    setSaving(true);
    try {
      const updated = await profileService.updateProfile(details);
      setProfile(updated);
      setDetails({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
      });
      updateUser?.({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        profileImage: updated.profileImage,
        phoneVerified: updated.phoneVerified,
        emailVerified: updated.emailVerified,
      });
      setOtp("");
      setOtpSent(false);
      setPhoneVerifiedForEdit(false);
      setEmailCodeSent(false);
      setEmailCode("");
      setNotice("Personal details saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save profile details.");
    } finally {
      setSaving(false);
    }
  };

  const sendPhoneOtp = async () => {
    setError("");
    try {
      const result = await otpService.sendOtp(details.phone);
      setOtpSent(true);
      setPhoneDebugCode(result?.debugOtp || "");
      setPhoneVerifiedForEdit(false);
      setNotice(
        details.phone === profile.phone
          ? "Verification code sent to your current phone number."
          : "Verification code sent to the new phone number.",
      );
    } catch (otpError) {
      setError(otpError.message || "Could not send verification code.");
    }
  };

  const verifyPhoneOtp = async () => {
    setError("");
    try {
      await otpService.verifyOtp(details.phone, otp);
      if (details.phone === profile.phone) {
        const updated = await profileService.verifyCurrentPhone();
        setProfile(updated);
        updateUser?.({ phoneVerified: updated.phoneVerified });
      }
      setPhoneVerifiedForEdit(true);
      setNotice(
        details.phone === profile.phone
          ? "Your phone number is verified."
          : "New phone number verified. Save your profile to apply the change.",
      );
    } catch (otpError) {
      setPhoneVerifiedForEdit(false);
      setError(otpError.message || "Phone verification failed.");
    }
  };

  const sendEmailCode = async () => {
    setError("");
    setNotice("");
    try {
      const result = await profileService.requestEmailVerification(
        details.email,
      );
      if (result.alreadyVerified) {
        setNotice("This email address is already verified.");
        return;
      }
      setEmailCodeSent(true);
      setEmailCode("");
      setNotice(`Verification code sent to ${result.email}.`);
    } catch (emailError) {
      setError(emailError.message || "Could not send email verification code.");
    }
  };

  const verifyEmailCode = async () => {
    setError("");
    setNotice("");
    try {
      const result = await profileService.verifyEmail(details.email, emailCode);
      const updated = await loadProfile();
      updateUser?.({
        email: result.email,
        emailVerified: updated.emailVerified,
      });
      setEmailCodeSent(false);
      setEmailCode("");
      setNotice("Email address verified.");
    } catch (emailError) {
      setError(emailError.message || "Email verification failed.");
    }
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await profileService.updateProfile({
        preferences: profile.preferences,
      });
      setProfile(updated);
      updateUser?.({ preferences: updated.preferences });
      setNotice("Language preference saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const addressPayload = () => {
    const { id, longitude, latitude, ...address } = addressDraft;
    if ((longitude && !latitude) || (!longitude && latitude))
      throw new Error(
        "Enter both longitude and latitude, or leave both blank.",
      );
    return {
      ...address,
      coordinates:
        longitude && latitude ? [Number(longitude), Number(latitude)] : [],
    };
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setAddressBusy(true);
    setAddressError("");
    setAddressNotice("");
    try {
      const payload = addressPayload();
      if (addressDraft.id)
        await profileService.updateAddress(addressDraft.id, payload);
      else await profileService.addAddress(payload);
      await loadProfile();
      setAddressDraft(emptyAddress());
      setAddressNotice(addressDraft.id ? "Address updated." : "Address saved.");
    } catch (saveError) {
      setAddressError(saveError.message || "Unable to save address.");
    } finally {
      setAddressBusy(false);
    }
  };

  const useCurrentLocation = () => {
    setAddressError("");
    setAddressNotice("");
    if (!navigator.geolocation) {
      setAddressError("Location services are not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        setAddressDraft((previous) => ({
          ...previous,
          longitude: String(longitude),
          latitude: String(latitude),
        }));
        try {
          const found = await pincodeService.reverseGeocode(
            latitude,
            longitude,
          );
          const address = found?.address || found;
          setAddressDraft((previous) => ({
            ...previous,
            street: previous.street || address?.street || address?.road || "",
            city:
              previous.city ||
              address?.city ||
              address?.town ||
              address?.village ||
              "",
            state: previous.state || address?.state || "",
            pincode:
              previous.pincode || address?.pincode || address?.postcode || "",
            landmark: previous.landmark,
          }));
        } catch {
          /* Coordinates remain available even when reverse geocoding is unavailable. */
        }
        setAddressNotice(
          "Current location added. Review the address fields before saving.",
        );
        setLocating(false);
      },
      (geoError) => {
        setLocating(false);
        setAddressError(
          geoError.code === 1
            ? "Location permission was denied."
            : "Could not determine your current location.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const removeAddress = async (address) => {
    setAddressError("");
    setAddressNotice("");
    try {
      await profileService.deleteAddress(address.id);
      await loadProfile();
      setAddressNotice("Address deleted.");
    } catch (deleteError) {
      setAddressError(deleteError.message || "Unable to delete address.");
    }
  };

  const setDefaultAddress = async (address) => {
    setAddressError("");
    try {
      const addresses = await profileService.setDefaultAddress(address.id);
      setProfile((previous) => ({ ...previous, addresses }));
      setAddressNotice(`${address.label} address set as default.`);
    } catch (saveError) {
      setAddressError(
        saveError.message || "Unable to set the default address.",
      );
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      await profileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setNotice("Password updated.");
    } catch (passwordError) {
      setError(passwordError.message || "Unable to update password.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  const statusLabel = (status) =>
    String(status || "unknown")
      .replaceAll("_", " ")
      .toUpperCase();
  const feedbackLink = "/user/dashboard?tab=bookings&view=feedback";
  const historyLink = "/user/dashboard?tab=bookings&view=completed";

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="Manage your personal information, saved places, and booking payments."
      roleBadge="Customer Account"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/user/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy-800 hover:text-brand-saffron-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <span className="text-xs text-slate-500">Customer account</span>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {loading ? (
        <div
          className="flex min-h-64 items-center justify-center"
          role="status"
          aria-label="Loading profile"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-saffron-500 border-t-transparent" />
        </div>
      ) : !profile ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Your profile could not be loaded.{" "}
          <button
            type="button"
            onClick={loadPage}
            className="font-bold text-brand-navy-900 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <section className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt=""
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-navy-900 text-lg font-bold text-white">
                  {initials(profile.name)}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-brand-navy-900">
                  {profile.name}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {profile.email || profile.phone}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    variant={profile.phoneVerified ? "verified" : "outline"}
                    size="sm"
                    icon={profile.phoneVerified ? CheckCircle2 : undefined}
                  >
                    {profile.phoneVerified
                      ? "Phone verified"
                      : "Phone not verified"}
                  </Badge>
                  <Badge
                    variant={profile.emailVerified ? "verified" : "outline"}
                    size="sm"
                    icon={profile.emailVerified ? CheckCircle2 : undefined}
                  >
                    {profile.emailVerified
                      ? "Email verified"
                      : "Email not verified"}
                  </Badge>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-saffron-700"
              onClick={() => photoInputRef.current?.click()}
              disabled={saving}
            >
              <Camera className="h-4 w-4" /> Change photo
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              className="hidden"
              onChange={(event) => {
                updateProfilePhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              icon={Pencil}
              onClick={() => openSection("details")}
            >
              Edit Profile
            </Button>
          </section>

          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav
              aria-label="Profile sections"
              className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible"
            >
              {sections.map((item) => {
                const Icon = item.icon;
                const selected = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => openSection(item.id)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${selected ? "border-brand-navy-900 bg-brand-navy-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {selected && (
                      <ChevronRight className="ml-auto hidden h-4 w-4 lg:block" />
                    )}
                  </button>
                );
              })}
            </nav>

            <main
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              aria-live="polite"
            >
              {section === "overview" && (
                <section>
                  <SectionHeading
                    title="Account overview"
                    description="Your profile and current service at a glance."
                  />
                  {activeBooking ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {["COMPLETED", "CANCELLED"].includes(
                              String(activeBooking.status || "").toUpperCase(),
                            )
                              ? "Most recent booking"
                              : "Current booking"}
                          </p>
                          <h3 className="mt-1 font-bold text-slate-900">
                            {activeBooking.serviceName ||
                              activeBooking.trade ||
                              "Service booking"}
                          </h3>
                        </div>
                        <Badge
                          variant={
                            String(activeBooking.status).toUpperCase() ===
                            "COMPLETED"
                              ? "verified"
                              : "saffron"
                          }
                          size="sm"
                        >
                          {statusLabel(activeBooking.status)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        Scheduled:{" "}
                        <strong className="text-slate-800">
                          {dateTime(activeBooking.scheduledTime?.start)}
                        </strong>
                      </p>
                      {(activeBooking.workerName ||
                        activeBooking.worker?.name) && (
                        <p className="mt-1 text-sm text-slate-600">
                          Artisan:{" "}
                          <strong className="text-slate-800">
                            {activeBooking.workerName ||
                              activeBooking.worker?.name}
                          </strong>
                        </p>
                      )}
                      {(activeBooking.cooperativeName ||
                        activeBooking.cooperative?.name) && (
                        <p className="mt-1 text-sm text-slate-600">
                          Cooperative:{" "}
                          <strong className="text-slate-800">
                            {activeBooking.cooperativeName ||
                              activeBooking.cooperative?.name}
                          </strong>
                        </p>
                      )}
                      <Link
                        to={`/user/dashboard?tab=bookings&view=${String(activeBooking.status).toUpperCase() === "COMPLETED" ? "completed" : "active"}`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-navy-900 hover:text-brand-saffron-700"
                      >
                        Track booking <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                      <CalendarDays className="mx-auto h-7 w-7 text-slate-400" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        No bookings yet
                      </p>
                      <Link
                        to="/user/dashboard?tab=match"
                        className="mt-2 inline-block text-sm font-bold text-brand-navy-900 underline"
                      >
                        Find an artisan
                      </Link>
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    <Link
                      to={historyLink}
                      className="text-sm font-semibold text-brand-navy-900 underline underline-offset-4"
                    >
                      Booking history
                    </Link>
                    <Link
                      to={feedbackLink}
                      className="text-sm font-semibold text-brand-navy-900 underline underline-offset-4"
                    >
                      Reviews & feedback
                    </Link>
                    <button
                      type="button"
                      onClick={() => openSection("addresses")}
                      className="text-sm font-semibold text-brand-navy-900 underline underline-offset-4"
                    >
                      Manage saved addresses
                    </button>
                  </div>
                </section>
              )}

              {section === "details" && (
                <section>
                  <SectionHeading
                    title="Personal details"
                    description="Edit the contact information connected to your customer account."
                  />
                  <form onSubmit={savePersonalDetails} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        id="profile-name"
                        label="Full name"
                        value={details.name}
                        required
                        maxLength={100}
                        autoComplete="name"
                        onChange={(event) =>
                          setDetails((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        id="profile-email"
                        label="Email address"
                        type="email"
                        value={details.email}
                        required
                        autoComplete="email"
                        onChange={(event) => {
                          setDetails((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }));
                          setEmailCodeSent(false);
                          setEmailCode("");
                        }}
                      />
                    </div>
                    {(details.email !== profile.email ||
                      !profile.emailVerified) && (
                      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-600">
                          Verify ownership of this email address. Email delivery
                          must be configured by the service administrator.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!details.email}
                          onClick={sendEmailCode}
                        >
                          {details.email === profile.email
                            ? "Send email verification code"
                            : "Verify new email address"}
                        </Button>
                        {emailCodeSent && (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <TextField
                              id="email-verification-code"
                              label="6-digit email code"
                              value={emailCode}
                              maxLength={6}
                              onChange={(event) =>
                                setEmailCode(
                                  event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 6),
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={emailCode.length !== 6}
                              onClick={verifyEmailCode}
                            >
                              Verify email
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                      <TextField
                        id="profile-phone"
                        label="Phone number"
                        value={details.phone}
                        required
                        autoComplete="tel"
                        onChange={(event) => {
                          setDetails((previous) => ({
                            ...previous,
                            phone: event.target.value,
                          }));
                          setPhoneVerifiedForEdit(false);
                          setOtpSent(false);
                          setPhoneDebugCode("");
                        }}
                      />
                      {(details.phone !== profile.phone ||
                        !profile.phoneVerified) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!details.phone}
                          onClick={sendPhoneOtp}
                        >
                          {details.phone === profile.phone
                            ? "Verify current number"
                            : "Verify new number"}
                        </Button>
                      )}
                    </div>
                    {(details.phone !== profile.phone ||
                      !profile.phoneVerified) &&
                      otpSent && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                          <TextField
                            id="phone-otp"
                            label="6-digit verification code"
                            value={otp}
                            maxLength={6}
                            onChange={(event) =>
                              setOtp(
                                event.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6),
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant={
                              phoneVerifiedForEdit ? "emerald" : "outline"
                            }
                            size="sm"
                            disabled={otp.length !== 6 || phoneVerifiedForEdit}
                            onClick={verifyPhoneOtp}
                          >
                            {phoneVerifiedForEdit
                              ? "Phone verified"
                              : "Verify phone"}
                          </Button>
                        </div>
                      )}
                    {otpSent && phoneDebugCode && (
                      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Development OTP:{" "}
                        <strong className="font-mono">{phoneDebugCode}</strong>
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Phone and email verification codes expire after a short
                      time. Email verification requires SMTP delivery to be
                      configured by the service administrator.
                    </p>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save personal details"}
                    </Button>
                  </form>
                </section>
              )}

              {section === "addresses" && (
                <section>
                  <SectionHeading
                    title="Saved addresses"
                    description="Choose a default location for new bookings. You can still edit an address for each booking."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Plus}
                        onClick={() => {
                          setAddressDraft(emptyAddress());
                          setAddressError("");
                        }}
                      >
                        Add address
                      </Button>
                    }
                  />
                  {addressError && (
                    <p role="alert" className="mb-3 text-sm text-red-700">
                      {addressError}
                    </p>
                  )}
                  {addressNotice && (
                    <p role="status" className="mb-3 text-sm text-emerald-700">
                      {addressNotice}
                    </p>
                  )}
                  <div className="mb-6 divide-y divide-slate-100 border-y border-slate-100">
                    {savedAddresses.length ? (
                      savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="flex gap-3">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-saffron-600" />
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="text-sm text-slate-900">
                                  {address.label}
                                </strong>
                                {address.isDefault && (
                                  <Badge variant="verified" size="sm">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-slate-600">
                                {[
                                  address.street,
                                  address.landmark,
                                  address.city,
                                  address.state,
                                  address.pincode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Pencil}
                              onClick={() => {
                                setAddressDraft({
                                  ...address,
                                  longitude: address.coordinates?.[0] ?? "",
                                  latitude: address.coordinates?.[1] ?? "",
                                });
                                setAddressError("");
                              }}
                            >
                              Edit
                            </Button>
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultAddress(address)}
                              >
                                Set default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => removeAddress(address)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-6 text-sm text-slate-500">
                        No saved addresses. Add one to prefill future bookings.
                      </p>
                    )}
                  </div>
                  <form onSubmit={saveAddress} className="space-y-4">
                    <h3 className="font-bold text-slate-900">
                      {addressDraft.id ? "Edit address" : "Add an address"}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Label
                        <select
                          className={fieldClass}
                          value={addressDraft.label}
                          onChange={(event) =>
                            setAddressDraft((previous) => ({
                              ...previous,
                              label: event.target.value,
                            }))
                          }
                        >
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                      </label>
                      <TextField
                        id="address-street"
                        label="Street address"
                        value={addressDraft.street}
                        required
                        maxLength={200}
                        onChange={(event) =>
                          setAddressDraft((previous) => ({
                            ...previous,
                            street: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        id="address-city"
                        label="City"
                        value={addressDraft.city}
                        required
                        onChange={(event) =>
                          setAddressDraft((previous) => ({
                            ...previous,
                            city: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        id="address-state"
                        label="State"
                        value={addressDraft.state}
                        required
                        onChange={(event) =>
                          setAddressDraft((previous) => ({
                            ...previous,
                            state: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        id="address-pincode"
                        label="Pincode"
                        value={addressDraft.pincode}
                        required
                        maxLength={6}
                        onChange={(event) =>
                          setAddressDraft((previous) => ({
                            ...previous,
                            pincode: event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          }))
                        }
                      />
                      <TextField
                        id="address-landmark"
                        label="Landmark (optional)"
                        value={addressDraft.landmark}
                        maxLength={200}
                        onChange={(event) =>
                          setAddressDraft((previous) => ({
                            ...previous,
                            landmark: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <TextField
                        id="address-longitude"
                        label="Longitude (optional)"
                        value={addressDraft.longitude}
                        onChange={(event) =>
                          setAddressDraft((previous) => ({
                            ...previous,
                            longitude: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        id="address-latitude"
                        label="Latitude (optional)"
                        value={addressDraft.latitude}
                        onChange={(event) =>
                          setAddressDraft((previous) => ({
                            ...previous,
                            latitude: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Navigation}
                        disabled={locating}
                        onClick={useCurrentLocation}
                      >
                        {locating ? "Locating…" : "Use current location"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        icon={Save}
                        disabled={addressBusy}
                      >
                        {addressBusy
                          ? "Saving…"
                          : addressDraft.id
                            ? "Update address"
                            : "Save address"}
                      </Button>
                      {addressDraft.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setAddressDraft(emptyAddress())}
                        >
                          Cancel edit
                        </Button>
                      )}
                    </div>
                  </form>
                </section>
              )}

              {section === "vault" && (
                <section>
                  <SectionHeading
                    title="Vault"
                    description="Booking-related payment records from your authenticated account. This is not a wallet."
                  />
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {vault?.providerIntegrationAvailable
                      ? "Provider-confirmed totals come from recorded payment transactions. Booking completion by itself does not count as payment."
                      : "No payment provider is connected. Paid and refunded totals include only provider-confirmed records; booking completion by itself does not count as payment."}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Provider-confirmed paid
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {money(vault?.summary?.paidAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payments pending
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {money(vault?.summary?.pendingAmount)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Based on booking payment records
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Provider-confirmed refunds
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {money(vault?.summary?.refundAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Recorded escrow states
                      </p>
                      {Object.keys(vault?.summary?.escrow || {}).length ? (
                        <ul className="mt-2 space-y-1 text-xs text-slate-700">
                          {Object.entries(vault.summary.escrow).map(
                            ([key, amount]) => (
                              <li
                                key={key}
                                className="flex justify-between gap-2"
                              >
                                <span>{statusLabel(key)}</span>
                                <strong>{money(amount)}</strong>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No escrow state recorded
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-7 border-t border-slate-100 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-bold text-slate-900">
                        Booking payment history
                      </h3>
                      <label className="text-xs font-semibold text-slate-600">
                        Filter{" "}
                        <select
                          value={transactionFilter}
                          onChange={(event) =>
                            setTransactionFilter(event.target.value)
                          }
                          className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="all">All records</option>
                          {[
                            ...new Set(
                              transactions.map((item) => item.paymentStatus),
                            ),
                          ].map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                      {filteredTransactions.length ? (
                        filteredTransactions.map((item) => (
                          <div key={item.bookingId} className="py-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedTransaction(
                                      expandedTransaction === item.bookingId
                                        ? null
                                        : item.bookingId,
                                    )
                                  }
                                  aria-expanded={
                                    expandedTransaction === item.bookingId
                                  }
                                  className="text-left text-sm font-bold text-brand-navy-900 hover:underline"
                                >
                                  {item.service}
                                </button>
                                <p className="mt-1 text-xs text-slate-500">
                                  Booking #{item.bookingReference} ·{" "}
                                  {item.bookingDate
                                    ? new Date(
                                        item.bookingDate,
                                      ).toLocaleDateString("en-IN", {
                                        dateStyle: "medium",
                                      })
                                    : "Date unavailable"}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-4 sm:justify-end">
                                <span className="text-sm font-bold text-slate-900">
                                  {money(item.amount, item.currency)}
                                </span>
                                <Badge variant="outline" size="sm">
                                  {paymentStatusLabel(item.paymentStatus)}
                                </Badge>
                                {item.invoiceUrl && (
                                  <a
                                    href="#invoice"
                                    onClick={async (event) => {
                                      event.preventDefault();
                                      try {
                                        await bookingService.downloadInvoice(item.bookingId);
                                      } catch (error) {
                                        setError(error.message || "Invoice could not be downloaded.");
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy-900 underline"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Invoice PDF
                                  </a>
                                )}
                              </div>
                            </div>
                            {expandedTransaction === item.bookingId && (
                              <dl className="mt-3 grid gap-x-5 gap-y-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-2">
                                <div>
                                  <dt className="text-slate-500">
                                    Recorded payment state
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {paymentStatusLabel(item.paymentStatus)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">
                                    Provider-confirmed state
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {item.providerConfirmed
                                      ? statusLabel(item.providerState)
                                      : "Awaiting payment confirmation"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">
                                    Provider confirmation time
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {dateTime(item.providerConfirmedAt)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">
                                    Escrow state
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {item.escrowState
                                      ? statusLabel(item.escrowState)
                                      : "Not recorded"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">
                                    Refund state
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {String(item.refundStatus || item.refundState || "not_applicable").replaceAll("_", " ")}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">
                                    Refund confirmation time
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {dateTime(item.refundConfirmedAt)}
                                  </dd>
                                </div>
                                {item.razorpayPaymentId && <div>
                                  <dt className="text-slate-500">Razorpay Payment ID</dt>
                                  <dd className="mt-0.5 font-mono text-slate-800">{item.razorpayPaymentId}</dd>
                                </div>}
                                <div>
                                  <dt className="text-slate-500">
                                    Payment method
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {item.paymentMethod || "Not recorded"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">
                                    Booking record updated
                                  </dt>
                                  <dd className="mt-0.5 font-semibold text-slate-800">
                                    {dateTime(item.updatedAt)}
                                  </dd>
                                </div>
                              </dl>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <ReceiptText className="mx-auto h-7 w-7 text-slate-400" />
                          <p className="mt-2 text-sm font-semibold text-slate-700">
                            No booking payment records
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Records will appear here when bookings are created.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-7 border-t border-slate-100 pt-5">
                    <h3 className="font-bold text-slate-900">
                      Payment methods
                    </h3>
                    {vault?.paymentMethods?.length ? (
                      <ul className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                        {vault.paymentMethods.map((method) => (
                          <li
                            key={method.id}
                            className="flex items-center justify-between py-3 text-sm"
                          >
                            <span>
                              {method.providerName} ···· {method.last4}
                            </span>
                            <span className="text-xs text-slate-500">
                              Provider saved method
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Payment methods will appear after a supported checkout.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {section === "security" && (
                <section>
                  <SectionHeading
                    title="Security & preferences"
                    description="Manage your password and language preference."
                  />
                  <form onSubmit={savePreferences} className="space-y-5">
                    <label className="block max-w-sm text-sm font-semibold text-slate-700">
                      Language
                      <select
                        value={profile.preferences?.language || "en"}
                        onChange={(event) =>
                          setProfile((previous) => ({
                            ...previous,
                            preferences: {
                              ...previous.preferences,
                              language: event.target.value,
                            },
                          }))
                        }
                        className={fieldClass}
                      >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी</option>
                      </select>
                    </label>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Notifications
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Notification preferences will be available when
                        supported delivery channels are connected.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Save}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save preferences"}
                    </Button>
                  </form>

                  <div className="my-7 border-t border-slate-100" />
                  <form
                    onSubmit={updatePassword}
                    className="max-w-lg space-y-4"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Change password
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Your current password is required. Passwords are never
                        saved in browser storage.
                      </p>
                    </div>
                    <TextField
                      id="current-password"
                      label="Current password"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      required
                      onChange={(event) =>
                        setPasswordForm((previous) => ({
                          ...previous,
                          currentPassword: event.target.value,
                        }))
                      }
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        id="new-password"
                        label="New password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        required
                        maxLength={128}
                        onChange={(event) =>
                          setPasswordForm((previous) => ({
                            ...previous,
                            newPassword: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        id="confirm-password"
                        label="Confirm new password"
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        required
                        maxLength={128}
                        onChange={(event) =>
                          setPasswordForm((previous) => ({
                            ...previous,
                            confirmPassword: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Use at least 8 characters.
                    </p>
                    <Button
                      type="submit"
                      variant="outline"
                      icon={LockKeyhole}
                      disabled={
                        passwordBusy || passwordForm.newPassword.length < 8
                      }
                    >
                      {passwordBusy ? "Updating…" : "Update password"}
                    </Button>
                  </form>

                  <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">Sign out</h3>
                      <p className="text-xs text-slate-500">
                        End your current session on this device.
                      </p>
                    </div>
                    <Button variant="outline" onClick={signOut}>
                      Sign out
                    </Button>
                  </div>
                </section>
              )}
            </main>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default UserProfilePage;
