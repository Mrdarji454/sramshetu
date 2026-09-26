import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import workerService from '../../services/worker.service';
import cooperativeService from '../../services/cooperative.service';
import pincodeService from '../../services/pincode.service';
import otpService from '../../services/otp.service';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trash2,
  MapPin,
  Briefcase,
  Wrench,
  Award,
  FileText,
  Clock,
  ExternalLink,
  Plus,
  Compass,
  Building2,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

// Popular Professions Catalog (Requirement 4)
const POPULAR_PROFESSIONS = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Cleaner',
  'Gardener',
  'Driver',
  'Caregiver',
  'Domestic Helper',
  'Mason',
  'Technician',
  'Mechanic',
  'Appliance Repair',
  'AC Technician',
  'Welder',
  'Tailor',
];

// Contextual Skill Suggestions by Profession (Requirement 6)
const PROFESSION_SKILL_SUGGESTIONS = {
  Plumber: ['Leak Detection', 'Drain Cleaning & Jetting', 'CPVC & UPVC Piping', 'Hydro-Pneumatic Pumps', 'Sanitary Fitting', 'Water Heater Repair'],
  Electrician: ['Concealed House Wiring', 'DB Dressing & MCB', 'Solar Inverter Installation', 'Earthing & Grounding', '3-Phase Substation Maintenance', 'Smart Home Automation'],
  Carpenter: ['Modular Kitchen Fitting', 'Door Lock Installation', 'Furniture Restoration', 'False Ceiling Framing', 'Wood Veneer & Polishing', 'Cabinet Making'],
  Painter: ['Interior Texture Emulsion', 'Exterior Weatherproof Coat', 'Waterproof Damp Proofing', 'Wood PU Polish', 'Airless Spray Painting', 'Epoxy Floor Coating'],
  Cleaner: ['Deep Home Cleaning', 'Sofa & Carpet Shampooing', 'Kitchen Chimney Degreasing', 'Bathroom Disinfection', 'Facade Window Cleaning'],
  Gardener: ['Lawn Maintenance & Mowing', 'Plant Pruning & Grafting', 'Drip Irrigation Setup', 'Organic Pest Management', 'Landscape Design'],
  Driver: ['Manual Transmission Driving', 'Automatic Vehicle Driving', 'Heavy Commercial Driving', 'Airport & Highway Chauffeur', 'Valet Logistics'],
  Caregiver: ['Elderly Care Assistance', 'Post-Surgery Patient Attendant', 'Medication Management', 'Mobility Support & Therapy'],
  'Domestic Helper': ['General Housekeeping', 'Meal Preparation & Cooking', 'Utensil Cleaning', 'Laundry & Ironing'],
  Mason: ['Tile & Granite Laying', 'Brickwork & Mortar Plastering', 'Waterproofing Membrane', 'Structural Concrete Formwork', 'Grouting'],
  Technician: ['CCTV & Security Wiring', 'Inverter Battery Servicing', 'Solar Panel Maintenance', 'Networking & Router Setup'],
  Mechanic: ['Two-Wheeler Engine Overhaul', 'Car Brake & Suspension Repair', 'Wheel Alignment', 'Oil & Filter Replacement'],
  'Appliance Repair': ['Washing Machine PCB Repair', 'Microwave Magnetron Fix', 'Refrigerator Gas Charging', 'Geyser Element Replacement'],
  'AC Technician': ['Split AC Installation', 'Inverter Compressor Overhaul', 'Gas Charging & Leak Fix', 'Copper Pipe Flare & Braze', 'Filter Deep Jet Cleaning'],
  Welder: ['TIG Stainless Steel Welding', 'MIG Industrial Welding', 'Arc Structural Fabrication', 'Safety Grill Design'],
  Tailor: ['Custom Suit Stitching', 'Blouse & Traditional Wear', 'Alterations & Fitting', 'Curtain & Upholstery Hemming'],
};

const STEPS = [
  { stepNumber: 1, title: 'Basic Info', icon: User, desc: 'Name, Phone & Email' },
  { stepNumber: 2, title: 'OTP Verify', icon: Phone, desc: 'Mobile Verification' },
  { stepNumber: 3, title: 'Profile', icon: Briefcase, desc: 'Bio & Cooperative' },
  { stepNumber: 4, title: 'Address', icon: MapPin, desc: 'Pincode & Location' },
  { stepNumber: 5, title: 'Profession', icon: Award, desc: 'Primary Trade' },
  { stepNumber: 6, title: 'Skills & Radius', icon: Wrench, desc: 'Experience & Radius' },
  { stepNumber: 7, title: 'Documents', icon: FileText, desc: 'KYC & e-Shram' },
  { stepNumber: 8, title: 'Review', icon: ShieldCheck, desc: 'Verify All Details' },
];

export function WorkerOnboardingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [cooperativesList, setCooperativesList] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    phoneVerified: Boolean(user?.phoneVerified),
    profileImage: user?.profileImage || '',
    bio: '',
    cooperativeId: '', // OPTIONAL
    profession: 'Plumber',
    customProfession: '',
    address: {
      line1: '',
      line2: '',
      pincode: '',
      district: '',
      state: '',
      city: '',
      latitude: 18.5204,
      longitude: 73.8567,
    },
    skills: [
      {
        skillId: 's1',
        skillName: 'Leak Detection',
        experienceYears: 3,
        serviceRadiusKm: 15,
      },
    ],
    documents: {
      aadhaar: null, // { url, name }
      addressProof: null, // { url, name, docType }
      eshramCard: null, // { url, name }
    },
  });

  // Step 2 OTP State
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [mockOtpHint, setMockOtpHint] = useState(null);

  // Step 4 Pincode & Geolocation State
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  // Step 5 & 6 Custom input states
  const [isCustomProfession, setIsCustomProfession] = useState(false);
  const [newCustomSkillName, setNewCustomSkillName] = useState('');
  const [showAddCustomSkillInput, setShowAddCustomSkillInput] = useState(false);

  // Address proof document type
  const [addressProofType, setAddressProofType] = useState('Electricity Bill');

  // Cooldown timer
  useEffect(() => {
    let t;
    if (otpCooldown > 0) {
      t = setInterval(() => setOtpCooldown((p) => p - 1), 1000);
    }
    return () => clearInterval(t);
  }, [otpCooldown]);

  // Load existing profile & progress
  useEffect(() => {
    async function loadWorkerData() {
      setIsLoading(true);
      try {
        const [regStatus, coops] = await Promise.allSettled([
          workerService.getRegistrationStatus(),
          cooperativeService.getCooperativesList(),
        ]);

        if (regStatus.status === 'fulfilled' && regStatus.value) {
          const res = regStatus.value;

          // Requirement 10: If status is PENDING_APPROVAL, redirect to /registration-pending
          if (res.registrationStatus === 'PENDING_APPROVAL') {
            navigate('/registration-pending', { replace: true });
            return;
          }

          // If APPROVED or VERIFIED, redirect to dashboard — worker must not see onboarding form
          const isVer = Boolean(
            res.registrationStatus === 'APPROVED' ||
            res.isVerified === true ||
            String(res.verificationStatus?.status || res.verificationStatus || '').toLowerCase() === 'verified'
          );
          if (isVer) {
            navigate('/worker/dashboard', { replace: true });
            return;
          }

          const progress = res.registrationProgress || {};
          const cSteps = progress.completedSteps?.length ? progress.completedSteps : [];
          setCompletedSteps(cSteps);

          // Handle URL step parameter with Requirement 11 step enforcement
          const requestedStep = parseInt(searchParams.get('step'), 10);
          if (requestedStep && requestedStep >= 1 && requestedStep <= 8) {
            // Check if worker has completed all prerequisites up to requestedStep - 1
            const canAccess = Array.from({ length: requestedStep - 1 }, (_, i) => i + 1).every((s) =>
              cSteps.includes(s)
            );
            if (canAccess) {
              setCurrentStep(requestedStep);
            } else {
              // Redirect to first incomplete step
              const firstIncomplete = Math.min(...Array.from({ length: 8 }, (_, i) => i + 1).filter((s) => !cSteps.includes(s)));
              setCurrentStep(firstIncomplete);
              setSearchParams({ step: firstIncomplete });
            }
          } else {
            const nextStep = progress.currentStep || (cSteps.length ? Math.max(...cSteps) + 1 : 1);
            setCurrentStep(nextStep <= 8 ? nextStep : 8);
          }

          if (res.worker) {
            const w = res.worker;
            setFormData((prev) => ({
              ...prev,
              name: w.name || prev.name,
              phone: w.phone || prev.phone,
              email: w.email || prev.email,
              phoneVerified: Boolean(res.phoneVerified || progress.phoneVerified),
              bio: w.bio || prev.bio,
              cooperativeId: w.cooperativeId || prev.cooperativeId,
              profession: w.customProfession ? 'Other / Add New Profession' : (w.profession || prev.profession),
              customProfession: w.customProfession || '',
              address: {
                ...prev.address,
                ...(w.address || {}),
                line1: w.address?.line1 || w.address?.addressLine1 || w.address?.street || w.location?.address?.street || prev.address.line1 || '',
                addressLine1: w.address?.addressLine1 || w.address?.line1 || w.address?.street || w.location?.address?.street || prev.address.addressLine1 || '',
                line2: w.address?.line2 || w.address?.addressLine2 || prev.address.line2 || '',
                addressLine2: w.address?.addressLine2 || w.address?.line2 || prev.address.addressLine2 || '',
                pincode: w.address?.pincode || w.location?.address?.pincode || prev.address.pincode || '',
                city: w.address?.city || w.location?.address?.city || prev.address.city || '',
                district: w.address?.district || prev.address.district || '',
                state: w.address?.state || w.location?.address?.state || prev.address.state || '',
              },
              skills: w.skills?.length
                ? w.skills.map((s, idx) => ({
                    skillId: s.skillId || `s_${idx}`,
                    skillName: s.skillName || s.name,
                    experienceYears: s.experienceYears ?? s.years ?? 2,
                    serviceRadiusKm: s.serviceRadiusKm ?? s.radius ?? 15,
                  }))
                : prev.skills,
              documents: {
                aadhaar: w.documents?.aadhaar || null,
                addressProof: w.documents?.addressProof || null,
                eshramCard: w.documents?.eshramCard || null,
              },
            }));

            if (w.customProfession) {
              setIsCustomProfession(true);
            }
          }
        }

        if (coops.status === 'fulfilled' && Array.isArray(coops.value)) {
          setCooperativesList(coops.value);
        }
      } catch (err) {
        console.error('Error loading worker onboarding progress:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkerData();
  }, []);

  // Update URL search param on step change
  const navigateToStep = (targetStep) => {
    // Check if worker can access targetStep
    if (targetStep > currentStep) {
      // Must have completed all previous steps
      const canAccess = Array.from({ length: targetStep - 1 }, (_, i) => i + 1).every((s) =>
        completedSteps.includes(s)
      );
      if (!canAccess) {
        setFeedback({
          type: 'error',
          message: `Cannot jump to Step ${targetStep}. Please complete previous steps first.`,
        });
        return;
      }
    }
    setCurrentStep(targetStep);
    setSearchParams({ step: targetStep });
    setFeedback(null);
  };

  // Requirement 1: OTP Send & Verify
  const handleSendOtp = async () => {
    setFeedback(null);
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setFeedback({ type: 'error', message: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await otpService.sendOtp(cleanPhone);
      setOtpCooldown(res.cooldownSeconds || 60);
      setFeedback({ type: 'success', message: `OTP sent successfully to ${res.phone || cleanPhone}` });
      if (res.mockOtp) setMockOtpHint(res.mockOtp);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send OTP' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFeedback(null);
    if (!otp.trim() || otp.trim().length !== 6) {
      setFeedback({ type: 'error', message: 'Please enter the 6-digit OTP received on your phone' });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await otpService.verifyOtp(formData.phone.trim(), otp.trim());
      setFormData((prev) => ({ ...prev, phoneVerified: true }));
      setMockOtpHint(null);
      setFeedback({ type: 'success', message: res.message || 'Mobile number verified successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Invalid or expired OTP' });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Requirement 3: Pincode Auto-Lookup (Triggered on 6 digits)
  const handlePincodeChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        pincode: val,
        line1: prev.address.line1 || prev.address.addressLine1 || '',
        addressLine1: prev.address.addressLine1 || prev.address.line1 || '',
      },
    }));
    setPincodeError('');

    if (val.length === 6) {
      setIsLookingUpPincode(true);
      try {
        const data = await pincodeService.lookupPincode(val);
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            pincode: val,
            district: data.district || prev.address.district,
            state: data.state || prev.address.state,
            city: data.city || prev.address.city || data.district,
            line1: prev.address.line1 || prev.address.addressLine1 || '',
            addressLine1: prev.address.addressLine1 || prev.address.line1 || '',
          },
        }));
        setPincodeError('');
      } catch (err) {
        setPincodeError(err.message || 'Invalid or non-existent PIN code. Please enter a valid Indian pincode.');
      } finally {
        setIsLookingUpPincode(false);
      }
    }
  };

  // Requirement 3B: Use My Current Location
  const handleUseCurrentLocation = () => {
    setFeedback(null);
    if (!navigator.geolocation) {
      setFeedback({
        type: 'error',
        message: 'Geolocation is not supported by your browser. Please enter your address manually.',
      });
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geoData = await pincodeService.reverseGeocode(latitude, longitude);

          setFormData((prev) => {
            const resolvedLine1 = geoData.line1 || geoData.addressLine1 || geoData.addressLine || prev.address.line1 || '';
            return {
              ...prev,
              address: {
                ...prev.address,
                line1: resolvedLine1,
                addressLine1: resolvedLine1,
                line2: prev.address.line2 || '',
                addressLine2: prev.address.line2 || '',
                pincode: geoData.pincode || prev.address.pincode || '',
                city: geoData.city || prev.address.city || '',
                district: geoData.district || prev.address.district || '',
                state: geoData.state || prev.address.state || '',
                latitude,
                longitude,
              },
            };
          });

          const locLabel = [geoData.city, geoData.district, geoData.state].filter(Boolean).join(', ');
          setFeedback({
            type: 'success',
            message: `Location detected: ${locLabel || 'Coordinates recorded'} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          });
        } catch (err) {
          setFeedback({
            type: 'error',
            message: 'Failed to reverse geocode location. Please fill your address fields manually.',
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        let msg = 'Location access denied. Please enter your address manually.';
        if (err.code === 1 || err.code === (window.GeolocationPositionError?.PERMISSION_DENIED || 1)) {
          msg = 'Location permission was denied. Please enter your address manually.';
        } else if (err.code === 2) {
          msg = 'Location unavailable. Please enter your address manually.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please enter your address manually.';
        }
        setFeedback({ type: 'error', message: msg });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // File Upload Helper with Requirement 8C Validation
  const handleFileUpload = (e, docKey, docTypeLabel) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File size exceeds 5MB limit. Please upload a smaller file.' });
      return;
    }

    // Validate type
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Invalid file format. Allowed formats: PDF, JPG, JPEG, PNG.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      setFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: {
            url: dataUrl,
            name: cleanName,
            docType: docTypeLabel || docKey,
          },
        },
      }));
      setFeedback({ type: 'success', message: `${docTypeLabel} uploaded successfully!` });
    };
    reader.readAsDataURL(file);
  };

  // Skill Management (Requirements 6 & 7)
  const handleAddSkillFromSuggestion = (skillName) => {
    if (formData.skills.some((s) => s.skillName.toLowerCase() === skillName.toLowerCase())) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          skillId: `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          skillName,
          experienceYears: 2,
          serviceRadiusKm: 15,
        },
      ],
    }));
  };

  const handleAddCustomSkill = () => {
    const trimmed = newCustomSkillName.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: 'Custom skill name cannot be empty' });
      return;
    }
    if (formData.skills.some((s) => s.skillName.toLowerCase() === trimmed.toLowerCase())) {
      setFeedback({ type: 'error', message: 'This skill is already added in your roster' });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          skillId: `cust_${Date.now()}`,
          skillName: trimmed,
          experienceYears: 2,
          serviceRadiusKm: 15,
        },
      ],
    }));

    setNewCustomSkillName('');
    setShowAddCustomSkillInput(false);
  };

  const handleRemoveSkill = (skillId) => {
    if (formData.skills.length <= 1) {
      setFeedback({ type: 'error', message: 'You must maintain at least one technical skill.' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.skillId !== skillId),
    }));
  };

  const handleSkillPropChange = (skillId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.skillId === skillId ? { ...s, [field]: value } : s)),
    }));
  };

  // Step Validation & Save Logic
  const handleSaveAndNext = async () => {
    setFeedback(null);
    setIsSaving(true);

    try {
      let stepPayload = {};

      switch (currentStep) {
        case 1: {
          if (!formData.name.trim()) throw new Error('Full Name is required');
          if (!formData.email.trim()) throw new Error('Email address is compulsory');
          if (!formData.phone.trim()) throw new Error('Phone number is required');
          stepPayload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          };
          break;
        }

        case 2: {
          if (!formData.phoneVerified) {
            throw new Error('Please verify your mobile number with OTP before continuing.');
          }
          stepPayload = {
            phoneVerified: true,
            phone: formData.phone,
          };
          break;
        }

        case 3: {
          // Requirement 5: Cooperative is optional
          stepPayload = {
            bio: formData.bio,
            profileImage: formData.profileImage,
            cooperativeId: formData.cooperativeId || null,
          };
          break;
        }

        case 4: {
          const addr = formData.address;
          const pincode = String(addr.pincode || '').trim();
          const district = String(addr.district || '').trim();
          const state = String(addr.state || '').trim();
          const line1 = String(addr.line1 || addr.addressLine1 || '').trim();

          if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
            throw new Error('A valid 6-digit Indian postal PIN code is required');
          }
          if (!district) throw new Error('District is required. Please enter or autofill via pincode.');
          if (!state) throw new Error('State is required. Please enter or autofill via pincode.');
          if (!line1) throw new Error('Address Line 1 is required');

          stepPayload = {
            address: {
              ...addr,
              pincode,
              district,
              state,
              line1,
              addressLine1: line1,
              line2: String(addr.line2 || addr.addressLine2 || '').trim(),
              addressLine2: String(addr.line2 || addr.addressLine2 || '').trim(),
              city: String(addr.city || district).trim(),
            },
          };
          break;
        }

        case 5: {
          // Requirement 4: Profession
          let effectiveProfession = formData.profession;
          if (formData.profession === 'Other / Add New Profession') {
            if (!formData.customProfession.trim()) {
              throw new Error('Please enter your custom profession title');
            }
            effectiveProfession = formData.customProfession.trim();
          }
          stepPayload = {
            profession: effectiveProfession,
            customProfession: isCustomProfession ? formData.customProfession.trim() : null,
          };
          break;
        }

        case 6: {
          // Requirements 6 & 7: Skills with experience & radius
          if (!formData.skills.length) {
            throw new Error('Please add at least one technical skill');
          }
          for (const s of formData.skills) {
            const exp = Number(s.experienceYears);
            if (isNaN(exp) || exp < 0 || exp > 50) {
              throw new Error(`Experience for "${s.skillName}" must be between 0 and 50 years`);
            }
            const rad = Number(s.serviceRadiusKm);
            if (isNaN(rad) || rad < 1 || rad > 100) {
              throw new Error(`Service radius for "${s.skillName}" must be between 1 and 100 km`);
            }
          }
          stepPayload = { skills: formData.skills };
          break;
        }

        case 7: {
          // Requirements 8, 8B, 8C: Documents
          const docs = formData.documents;
          if (!docs.aadhaar?.url) throw new Error('Aadhaar Card document is required');
          if (!docs.addressProof?.url) throw new Error('Address Proof document is required');
          if (!docs.eshramCard?.url) {
            throw new Error('e-Shram Card is required to complete worker registration.');
          }
          stepPayload = { documents: docs };
          break;
        }

        case 8: {
          // Review step -> Proceed to final submission
          await handleFinalSubmit();
          return;
        }
      }

      // Save step to backend
      const res = await workerService.saveStep(currentStep, stepPayload);

      // Update local completed steps
      const newCompleted = Array.from(new Set([...completedSteps, currentStep])).sort((a, b) => a - b);
      setCompletedSteps(newCompleted);

      // Advance to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setSearchParams({ step: nextStep });
      setFeedback({ type: 'success', message: `Step ${currentStep} completed successfully!` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Validation failed. Please review your input.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Requirement 10: Final Submission
  const handleFinalSubmit = async () => {
    setIsSaving(true);
    try {
      await workerService.submitRegistration();
      // Redirect to dedicated /registration-pending page
      navigate('/registration-pending', { replace: true });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit registration.' });
      setIsSaving(false);
    }
  };

  const effectiveProfession =
    formData.profession === 'Other / Add New Profession' ? formData.customProfession || 'Custom' : formData.profession;

  const currentSuggestions = PROFESSION_SKILL_SUGGESTIONS[effectiveProfession] || [
    'General Maintenance',
    'Emergency Repair',
    'Component Diagnostics',
    'Installation & Assembly',
    'Preventive Inspection',
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <Loader2 className="w-10 h-10 text-brand-saffron-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading worker registration wizard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stepper Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-saffron-600 bg-brand-saffron-50 px-2.5 py-1 rounded-full border border-brand-saffron-200">
                Official Worker KYC Onboarding
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-brand-navy-900 mt-1">
              Step {currentStep}: {STEPS[currentStep - 1]?.title} – {STEPS[currentStep - 1]?.desc}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Registration Progress</span>
            <div className="text-lg font-extrabold text-brand-saffron-600">
              {Math.round(((completedSteps.length) / STEPS.length) * 100)}%
            </div>
          </div>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 border-t border-slate-100">
          {STEPS.map((s) => {
            const isCompleted = completedSteps.includes(s.stepNumber);
            const isCurrent = currentStep === s.stepNumber;
            const isLocked = !isCompleted && !isCurrent;
            const StepIcon = s.icon;

            return (
              <button
                key={s.stepNumber}
                type="button"
                disabled={isLocked}
                onClick={() => navigateToStep(s.stepNumber)}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-brand-saffron-500 bg-brand-saffron-50/60 ring-2 ring-brand-saffron-500/20'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-950 cursor-pointer'
                    : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold ${isCurrent ? 'text-brand-saffron-700' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                    0{s.stepNumber}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isLocked ? (
                    <Lock className="w-3 h-3 text-slate-400" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5 text-brand-saffron-600" />
                  )}
                </div>
                <span className={`text-xs font-bold truncate ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Wizard Form Container */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200 shadow-sm">
        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Step 1: Basic Identity Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please confirm your full name, contact phone, and mandatory email address.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rajeshwar Shinde"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, phoneVerified: false })}
                    placeholder="e.g. 98201 44019"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">* (Compulsory)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rajeshwar.worker@domain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Official government KYC communications and customer booking confirmations will be dispatched here.</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MOBILE OTP VERIFICATION */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Step 2: Mobile OTP Verification</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every artisan on ShramSetu must verify their mobile number with a secure one-time passcode.
              </p>
            </div>

            {formData.phoneVerified ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-emerald-950">Mobile Verified Successfully!</h4>
                <p className="text-xs text-emerald-800">
                  Your phone number <strong className="font-mono">{formData.phone}</strong> is verified and linked to your artisan KYC.
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSendingOtp || otpCooldown > 0}
                      onClick={handleSendOtp}
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : otpCooldown > 0 ? (
                        `Resend (${otpCooldown}s)`
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Mock OTP notification banner for easy demo */}
                {mockOtpHint && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <span><strong>Demo Code:</strong> <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">{mockOtpHint}</code></span>
                    <button
                      type="button"
                      onClick={() => setOtp(mockOtpHint)}
                      className="text-[11px] font-bold underline hover:text-amber-950"
                    >
                      Fill
                    </button>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold uppercase text-slate-700">Enter 6-Digit OTP</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-mono tracking-widest text-center font-bold bg-white focus:ring-2 focus:ring-brand-saffron-500"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={isVerifyingOtp || otp.length !== 6}
                      onClick={handleVerifyOtp}
                    >
                      {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: WORKER PROFILE & OPTIONAL COOPERATIVE */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Step 3: Worker Profile & Cooperative Affiliation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tell customers about your craftsmanship. Affiliation with a cooperative society is strictly optional.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Professional Bio / Summary
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="e.g. Government certified master artisan with experience in domestic and commercial electrical repairs..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50"
              />
            </div>

            {/* Requirement 5: Cooperative Society is OPTIONAL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cooperative Society <span className="text-slate-400 font-normal lowercase">(Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Independent artisans can leave this unselected</span>
              </div>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={formData.cooperativeId}
                  onChange={(e) => setFormData({ ...formData, cooperativeId: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50"
                >
                  <option value="">[ Select Cooperative (Optional) ]</option>
                  {cooperativesList.map((coop) => (
                    <option key={coop._id || coop.id} value={coop._id || coop.id}>
                      {coop.name} ({coop.location?.district || 'Pune'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ADDRESS + PINCODE AUTO-FILL + CURRENT LOCATION */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 4: Operational Base Address</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your 6-digit postal pincode for automatic district and state population.
                </p>
              </div>

              {/* Requirement 3B: Use My Current Location */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={isDetectingLocation ? Loader2 : Compass}
                disabled={isDetectingLocation}
                onClick={handleUseCurrentLocation}
                className="whitespace-nowrap"
              >
                {isDetectingLocation ? 'Detecting your location...' : 'Use My Current Location'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Postal Pincode <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formData.address.pincode}
                    onChange={handlePincodeChange}
                    placeholder="e.g. 395005"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-brand-saffron-500 bg-slate-50/50"
                  />
                  {isLookingUpPincode && (
                    <Loader2 className="w-4 h-4 text-brand-saffron-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {pincodeError && <span className="text-xs text-red-600 font-semibold mt-1 block">{pincodeError}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  City / Town / Locality
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value },
                    }))
                  }
                  placeholder="e.g. Surat / Rander"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  District <span className="text-red-500">* (Auto-filled via PIN)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.district}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, district: e.target.value },
                    }))
                  }
                  placeholder="e.g. Surat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/50 text-slate-800 focus:ring-2 focus:ring-brand-saffron-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  State <span className="text-red-500">* (Auto-filled via PIN)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value },
                    }))
                  }
                  placeholder="e.g. Gujarat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/50 text-slate-800 focus:ring-2 focus:ring-brand-saffron-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.line1 || formData.address.addressLine1 || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        line1: e.target.value,
                        addressLine1: e.target.value,
                      },
                    }))
                  }
                  placeholder="Flat / House No., Building Name, Street"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Address Line 2 / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.address.line2 || formData.address.addressLine2 || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        line2: e.target.value,
                        addressLine2: e.target.value,
                      },
                    }))
                  }
                  placeholder="Near landmark, Sector, Cross road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PROFESSION SELECTION + CUSTOM PROFESSION */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Step 5: Primary Trade / Profession</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select from standard crafts or add your customized artisan profession.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Profession <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {POPULAR_PROFESSIONS.map((prof) => {
                  const isSelected = formData.profession === prof && !isCustomProfession;
                  return (
                    <button
                      key={prof}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, profession: prof });
                        setIsCustomProfession(false);
                      }}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        isSelected
                          ? 'border-brand-saffron-500 bg-brand-saffron-50/70 text-brand-saffron-950 ring-2 ring-brand-saffron-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {prof}
                    </button>
                  );
                })}

                {/* Option to select Other / Add New */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, profession: 'Other / Add New Profession' });
                    setIsCustomProfession(true);
                  }}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    isCustomProfession
                      ? 'border-brand-saffron-500 bg-brand-saffron-50/70 text-brand-saffron-950 ring-2 ring-brand-saffron-500/20'
                      : 'border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  + Other / Add New
                </button>
              </div>
            </div>

            {/* Custom Profession Input (Requirement 4) */}
            {isCustomProfession && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 animate-in fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-950">
                  Enter Custom Profession Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customProfession}
                  onChange={(e) => setFormData({ ...formData, customProfession: e.target.value })}
                  placeholder="e.g. Solar Photovoltaic Installer / Grade-A Blacksmith"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-sm font-medium bg-white focus:ring-2 focus:ring-brand-saffron-500"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 6: SKILLS + EXPERIENCE + SERVICE RADIUS PER SKILL */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Step 6: Skills, Experience & Service Radius
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every skill requires its own verified experience and operational dispatch radius.
              </p>
            </div>

            {/* Quick Skill Suggestions for Selected Profession */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Suggested Skills for {effectiveProfession}:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((skillName) => {
                  const alreadyAdded = formData.skills.some((s) => s.skillName.toLowerCase() === skillName.toLowerCase());
                  return (
                    <button
                      key={skillName}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddSkillFromSuggestion(skillName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        alreadyAdded
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 opacity-60 cursor-default'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {alreadyAdded ? `✓ ${skillName}` : `+ ${skillName}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Skills Roster (Requirement 7) */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Selected Skills ({formData.skills.length})
              </span>

              {formData.skills.map((skillItem) => (
                <div
                  key={skillItem.skillId}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skill Name</span>
                    <h4 className="text-base font-extrabold text-slate-900">{skillItem.skillName}</h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Experience per skill */}
                    <div className="w-36">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Experience: <strong className="text-brand-navy-900">{skillItem.experienceYears} Years</strong>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={skillItem.experienceYears}
                        onChange={(e) => handleSkillPropChange(skillItem.skillId, 'experienceYears', Number(e.target.value))}
                        className="w-full accent-brand-saffron-500"
                      />
                    </div>

                    {/* Service Radius per skill */}
                    <div className="w-36">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Service Radius: <strong className="text-brand-saffron-600">{skillItem.serviceRadiusKm} KM</strong>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={skillItem.serviceRadiusKm}
                        onChange={(e) => handleSkillPropChange(skillItem.skillId, 'serviceRadiusKm', Number(e.target.value))}
                        className="w-full accent-brand-saffron-500"
                      />
                    </div>

                    {/* Remove Skill */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skillItem.skillId)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Skill Input */}
            {showAddCustomSkillInput ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex gap-2 animate-in fade-in">
                <input
                  type="text"
                  value={newCustomSkillName}
                  onChange={(e) => setNewCustomSkillName(e.target.value)}
                  placeholder="Enter custom skill name (e.g. Industrial Pipe Braze)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                />
                <Button type="button" variant="primary" size="sm" onClick={handleAddCustomSkill}>
                  Add Skill
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCustomSkillInput(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setShowAddCustomSkillInput(true)}
              >
                + Add Custom Skill
              </Button>
            )}
          </div>
        )}

        {/* STEP 7: DOCUMENTS (Aadhaar, Address Proof, e-Shram Card) */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Step 7: Verification Documents</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your statutory documents for government compliance. Police verification is no longer required.
              </p>
            </div>

            {/* Requirement 8B: e-Shram Card Notice & External Portal Link */}
            {!formData.documents.eshramCard?.url && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">e-Shram Card is required to complete worker registration.</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Don't have an e-Shram card yet? Register directly on the official Ministry of Labour & Employment portal.
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.eshram.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                >
                  <span>Get e-Shram Card</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Document Upload Cards (Only 3 required documents: Aadhaar, Address Proof, e-Shram Card) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Document 1: Aadhaar */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900">Aadhaar Identity Card</h4>
                    {formData.documents.aadhaar?.url ? (
                      <Badge variant="verified" size="sm">Uploaded ✓</Badge>
                    ) : (
                      <Badge variant="outline" size="sm" className="border-red-300 text-red-600">Required</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Front or back scan (PDF, JPG, PNG under 5MB)</p>
                  {formData.documents.aadhaar?.name && (
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono truncate text-slate-700 mb-3">
                      {formData.documents.aadhaar.name}
                    </div>
                  )}
                </div>

                <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-brand-saffron-600" />
                  <span>{formData.documents.aadhaar?.url ? 'Replace Document' : 'Upload Aadhaar'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'aadhaar', 'Aadhaar Card')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Document 2: Address Proof */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900">Address Proof</h4>
                    {formData.documents.addressProof?.url ? (
                      <Badge variant="verified" size="sm">Uploaded ✓</Badge>
                    ) : (
                      <Badge variant="outline" size="sm" className="border-red-300 text-red-600">Required</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">Electricity Bill or Property Tax Document</p>
                  <select
                    value={addressProofType}
                    onChange={(e) => setAddressProofType(e.target.value)}
                    className="w-full mb-3 px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="Electricity Bill">Electricity Bill</option>
                    <option value="Property Tax Receipt">Property Tax Receipt</option>
                    <option value="Water Bill">Water Utility Bill</option>
                  </select>
                  {formData.documents.addressProof?.name && (
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono truncate text-slate-700 mb-3">
                      {formData.documents.addressProof.name}
                    </div>
                  )}
                </div>

                <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-brand-saffron-600" />
                  <span>{formData.documents.addressProof?.url ? 'Replace Proof' : 'Upload Address Proof'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'addressProof', addressProofType)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Document 3: e-Shram Card (MANDATORY) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900">e-Shram Card</h4>
                    {formData.documents.eshramCard?.url ? (
                      <Badge variant="verified" size="sm">Uploaded ✓</Badge>
                    ) : (
                      <Badge variant="outline" size="sm" className="border-amber-400 text-amber-700 bg-amber-50">Mandatory</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Ministry of Labour & Employment Worker Card</p>
                  {formData.documents.eshramCard?.name && (
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono truncate text-slate-700 mb-3">
                      {formData.documents.eshramCard.name}
                    </div>
                  )}
                </div>

                <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-brand-saffron-600" />
                  <span>{formData.documents.eshramCard?.url ? 'Replace e-Shram' : 'Upload e-Shram Card'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'eshramCard', 'e-Shram Card')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW ALL DATA BEFORE FINAL SUBMISSION */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Step 8: Review Application Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review all registered credentials before submitting for administrative verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Profile Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">Personal & Trade Info</span>
                <div><span className="text-slate-400">Name:</span> <strong className="text-slate-800">{formData.name}</strong></div>
                <div><span className="text-slate-400">Mobile:</span> <strong className="text-slate-800">{formData.phone} (Verified ✓)</strong></div>
                <div><span className="text-slate-400">Email:</span> <strong className="text-slate-800">{formData.email}</strong></div>
                <div><span className="text-slate-400">Profession:</span> <strong className="text-slate-800">{effectiveProfession}</strong></div>
                <div><span className="text-slate-400">Cooperative:</span> <strong className="text-slate-800">{cooperativesList.find((c) => c._id === formData.cooperativeId)?.name || 'Independent / None'}</strong></div>
              </div>

              {/* Address Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold uppercase tracking-wider text-slate-500 block">Address & Jurisdiction</span>
                <div><span className="text-slate-400">Line 1:</span> <strong className="text-slate-800">{formData.address.line1}</strong></div>
                <div><span className="text-slate-400">Pincode:</span> <strong className="text-slate-800 font-mono">{formData.address.pincode}</strong></div>
                <div><span className="text-slate-400">District & State:</span> <strong className="text-slate-800">{formData.address.district}, {formData.address.state}</strong></div>
              </div>
            </div>

            {/* Skills Table */}
            <div>
              <span className="font-bold uppercase tracking-wider text-xs text-slate-500 block mb-2">Technical Skills & Radius</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.skills.map((s) => (
                  <div key={s.skillId} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{s.skillName}</span>
                    <div className="text-slate-500">
                      <span>{s.experienceYears} Yrs Exp</span> • <span className="font-bold text-brand-saffron-600">{s.serviceRadiusKm} KM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Checklist */}
            <div>
              <span className="font-bold uppercase tracking-wider text-xs text-slate-500 block mb-2">Attached Documents</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {formData.documents.aadhaar?.url && <Badge variant="verified">✓ Aadhaar Card</Badge>}
                {formData.documents.addressProof?.url && <Badge variant="verified">✓ Address Proof</Badge>}
                {formData.documents.eshramCard?.url && <Badge variant="verified">✓ e-Shram Card</Badge>}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="border-t border-slate-100 pt-5 mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={ArrowLeft}
            disabled={currentStep === 1 || isSaving}
            onClick={() => navigateToStep(currentStep - 1)}
          >
            Previous
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isSaving}
            iconRight={currentStep === 8 ? CheckCircle2 : ArrowRight}
            onClick={handleSaveAndNext}
          >
            {isSaving
              ? 'Saving...'
              : currentStep === 8
              ? 'Submit Application for Admin Approval'
              : `Save & Continue to Step ${currentStep + 1}`}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default WorkerOnboardingWizard;
