import { useEffect, useState } from "react";
import { ArrowLeft, Save, Camera } from "lucide-react";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

import { userApi } from "@/api/user";
import { chatApi } from "@/api/chat";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage()
{
  const navigate = useNavigate();

  const { user, setAuth } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropImage, setCropImage] = useState(null);

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

      toast.success("Avatar uploaded. Click Save Changes.");
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

  if (loading)
  {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--color-bg)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-fg)]">
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-5">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xl font-bold">
              Profile Settings
            </h1>

            <p className="text-sm text-[var(--color-muted-fg)]">
              Update your public chat profile.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <form
            onSubmit={saveProfile}
            className="space-y-4"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar
                  name={name}
                  src={avatar}
                  size={88}
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

              {avatar && (
                <div className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs text-[var(--color-muted-fg)]">
                  Avatar selected
                </div>
              )}
            </div>

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
                  Save Changes
                </span>
              )}
            </Button>
          </form>
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