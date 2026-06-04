import { useEffect, useState } from "react";
import
{
  ArrowLeft,
  Save,
  Camera,
  Lock,
  User,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import ThemeSettings from "@/theme/ThemeSettings";

import { userApi } from "@/api/user";
import { chatApi } from "@/api/chat";
import { useAuthStore } from "@/store/authStore";

const sections = [
  {
    id: "profile",
    label: "Update Profile",
    icon: User,
    description: "Name, bio, avatar",
  },
  {
    id: "password",
    label: "Change Password",
    icon: Lock,
    description: "Update account password",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Shield,
    description: "Last seen and visibility",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Message alerts",
  },
  {
    id: "themes",
    label: "Themes",
    icon: Palette,
    description: "Themes and wallpaper",
  },
];

export default function ProfilePage()
{
  const navigate = useNavigate();

  const { user, setAuth } = useAuthStore();
  const isFullyVerified =
    Boolean(user?.emailVerified || user?.email) &&
    Boolean(user?.phoneVerified);

  const [activeSection, setActiveSection] =
    useState("profile");

  const [name, setName] =
    useState(user?.name || "");

  const [bio, setBio] =
    useState(user?.bio || "");

  const [avatar, setAvatar] =
    useState(user?.avatar || "");

  const [phone, setPhone] =
    useState(user?.phone || "");

  const [phoneOtp, setPhoneOtp] =
    useState("");

  const [phoneOtpSent, setPhoneOtpSent] =
    useState(false);

  const [sendingPhoneOtp, setSendingPhoneOtp] =
    useState(false);

  const [verifyingPhone, setVerifyingPhone] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [cropImage, setCropImage] =
    useState(null);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  useEffect(() =>
  {
    const loadProfile = async () =>
    {
      setLoading(true);

      try
      {
        const res = await userApi.getProfile();

        const profile = res.user;

        setName(profile?.name || "");
        setBio(profile?.bio || "");
        setAvatar(profile?.avatar || "");
        setPhone(profile?.phone || "");

        setAuth({
          user: profile,
        });
      }
      catch (error)
      {
        toast.error(
          error?.response?.data?.message ||
          "Failed to load profile"
        );
      }
      finally
      {
        setLoading(false);
      }
    };

    loadProfile();
  }, [setAuth]);

  const uploadAvatar = async (e) =>
  {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/"))
    {
      toast.error("Please select an image file");
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    setCropImage(previewUrl);

    e.target.value = "";
  };

  const handleCroppedAvatar = async (croppedFile) =>
  {
    setUploadingAvatar(true);

    try
    {
      const res =
        await chatApi.uploadFile(croppedFile);

      const fileUrl =
        res?.file?.fileUrl;

      if (!fileUrl)
      {
        toast.error("Avatar upload failed");
        return;
      }

      setAvatar(fileUrl);
      setCropImage(null);

      toast.success("Avatar uploaded. Click Update Profile.");
    }
    catch (error)
    {
      toast.error(
        error?.response?.data?.message ||
        "Failed to upload avatar"
      );
    }
    finally
    {
      setUploadingAvatar(false);
    }
  };

  const changePassword = async (e) =>
  {
    e.preventDefault();

    if (newPassword.length < 6)
    {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword)
    {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);

    try
    {
      await userApi.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password changed successfully");
    }
    catch (error)
    {
      toast.error(
        error?.response?.data?.message ||
        "Failed to change password"
      );
    }
    finally
    {
      setChangingPassword(false);
    }
  };


  const sendPhoneOtp = async () =>
  {
    if (!phone.trim())
    {
      toast.error("Enter mobile number");
      return;
    }

    setSendingPhoneOtp(true);

    try
    {
      const res =
        await userApi.sendPhoneVerificationOTP(
          phone.trim()
        );

      setPhoneOtpSent(true);

      toast.success(
        res?.message || "OTP sent successfully"
      );
    }
    catch (error)
    {
      toast.error(
        error?.response?.data?.message ||
        "Failed to send OTP"
      );
    }
    finally
    {
      setSendingPhoneOtp(false);
    }
  };

  const verifyPhone = async () =>
  {
    if (!phone.trim() || phoneOtp.length < 6)
    {
      toast.error("Enter phone and 6-digit OTP");
      return;
    }

    setVerifyingPhone(true);

    try
    {
      const res =
        await userApi.verifyPhone(
          phone.trim(),
          phoneOtp
        );

      setAuth({
        user: res.user,
      });

      setPhone(res.user?.phone || "");
      setPhoneOtp("");
      setPhoneOtpSent(false);

      toast.success("Mobile number verified");
    }
    catch (error)
    {
      toast.error(
        error?.response?.data?.message ||
        "Failed to verify phone"
      );
    }
    finally
    {
      setVerifyingPhone(false);
    }
  };

  const saveProfile = async (e) =>
  {
    e.preventDefault();

    if (!name.trim())
    {
      toast.error("Name is required");
      return;
    }

    setSaving(true);

    try
    {
      const res = await userApi.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar,
      });

      setAuth({
        user: res.user,
      });

      toast.success("Profile updated");
    }
    catch (error)
    {
      toast.error(
        error?.response?.data?.message ||
        "Failed to update profile"
      );
    }
    finally
    {
      setSaving(false);
    }
  };

  const renderProfileSection = () => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
      <form
        onSubmit={saveProfile}
        className="space-y-5"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar
              name={name}
              src={avatar}
              size={96}
            />


            <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow hover:bg-[var(--color-muted)]">
              {uploadingAvatar ? (
                <Spinner />
              ) : (
                <Camera size={17} />
              )}

              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploadingAvatar}
                onChange={uploadAvatar}
              />
            </label>
          </div>

          <div className="text-center">
            <div className="font-semibold">
              {name || "Your Name"}
            </div>

            <div className="text-xs text-[var(--color-muted-fg)]">
              {user?.email || user?.phone}
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            {avatar && (
              <div className="flex items-center gap-2 rounded-full border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-2 py-1 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
                <span className="text-xs font-medium text-[var(--color-success)]">
                  Avatar Selected
                </span>
              </div>
            )}

            {isFullyVerified && (
              <div className="flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-1 text-[var(--color-primary-fg)] shadow-[var(--shadow-card)]">
                <BadgeCheck size={14} />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>

        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Full Name
            </label>

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Bio
            </label>

            <Input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell something about yourself"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <div className="mb-3 text-sm font-semibold">
            Account Info
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[var(--color-muted-fg)]">
                  Email
                </div>
                <div className="break-all">
                  {user?.email || "Not added"}
                </div>
              </div>

              {user?.email && (
                <span className="flex items-center gap-1 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-medium text-[var(--color-success)]">
                    <BadgeCheck size={12} />
                    Verified
                  </span>
              )}
            </div>

            <div className="">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[var(--color-muted-fg)]">
                    Mobile Number
                  </div>

                  {/* <div className="text-xs text-[var(--color-muted-fg)]">
                    Verify your mobile number for account security.
                  </div> */}
                </div>

                {user?.phoneVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-medium text-[var(--color-success)]">
                    <BadgeCheck size={12} />
                    Verified
                  </span>
                )}
              </div>

              {user?.phoneVerified ? (
                <div className="break-all">
                  {user?.phone}
                </div>
              ) : (
                <div div className="grid gap-2">
                  <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                      {
                        setPhone(e.target.value);
                        setPhoneOtpSent(false);
                      }}
                      placeholder="Enter mobile number"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendPhoneOtp}
                      disabled={sendingPhoneOtp}
                    >
                      {sendingPhoneOtp ? (
                        <Spinner />
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </div>

                  {phoneOtpSent && (
                    <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                      <Input
                        value={phoneOtp}
                        onChange={(e) =>
                          setPhoneOtp(e.target.value)
                        }
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                      />

                      <Button
                        type="button"
                        onClick={verifyPhone}
                        disabled={verifyingPhone}
                      >
                        {verifyingPhone ? (
                          <Spinner />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving || uploadingAvatar}
          className="w-full"
        >
          {saving ? (
            <Spinner />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Save size={16} />
              Update Profile
            </span>
          )}
        </Button>
      </form>
    </div>
  );

  const renderPasswordSection = () => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
      <form
        onSubmit={changePassword}
        className="space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold">
            Change Password
          </h2>

          <p className="text-sm text-[var(--color-muted-fg)]">
            Update your account password.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Current Password
          </label>

          <Input
            type="password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(e.target.value)
            }
            placeholder="Current password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            New Password
          </label>

          <Input
            type="password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
            placeholder="New password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Confirm Password
          </label>

          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm new password"
          />
        </div>

        <Button
          type="submit"
          disabled={changingPassword}
          className="w-full"
        >
          {changingPassword ? (
            <Spinner />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Lock size={16} />
              Update Password
            </span>
          )}
        </Button>
      </form>
    </div>
  );

  const renderPlaceholderSection = (title, description) => (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
        {description}
      </p>

      <div className="mt-5 rounded-xl bg-[var(--color-muted)] p-4 text-sm text-[var(--color-muted-fg)]">
        This section will be added soon.
      </div>
    </div>
  );

  const renderContent = () =>
  {
    if (activeSection === "profile")
    {
      return renderProfileSection();
    }

    if (activeSection === "password")
    {
      return renderPasswordSection();
    }

    if (activeSection === "themes")
    {
      return <ThemeSettings />;
    }

    if (activeSection === "privacy")
    {
      return renderPlaceholderSection(
        "Privacy",
        "Manage profile visibility and last seen settings."
      );
    }

    if (activeSection === "notifications")
    {
      return renderPlaceholderSection(
        "Notifications",
        "Manage message alerts and notification preferences."
      );
    }

    return null;
  };

  if (loading)
  {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--color-bg)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-fg)]">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col px-3 py-5 sm:px-4 lg:px-6">
        <div className="mb-6 flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-bold">
              Profile Settings
            </h1>

            <p className="text-sm text-[var(--color-muted-fg)]">
              Manage your account and app preferences.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm lg:w-80 lg:shrink-0">
            <div className="space-y-2">
              {sections.map((item) =>
              {
                const Icon = item.icon;

                const active =
                  activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-muted)]"
                      }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)]">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {item.label}
                      </div>

                      <div className="truncate text-xs text-[var(--color-muted-fg)]">
                        {item.description}
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      className="text-[var(--color-muted-fg)]"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 overflow-hidden">
            {renderContent()}
          </div>
        </div>

        {cropImage && (
          <AvatarCropModal
            image={cropImage}
            onClose={() => setCropImage(null)}
            onDone={handleCroppedAvatar}
          />
        )}
      </div>
    </div>
  );
}
