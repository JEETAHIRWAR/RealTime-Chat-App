import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { X, Check } from "lucide-react";

import Button from "@/components/ui/Button";
import getCroppedImg from "@/utils/cropImage";

export default function AvatarCropModal({
  image,
  onClose,
  onDone,
})
{
  const [crop, setCrop] =
    useState({ x: 0, y: 0 });

  const [zoom, setZoom] =
    useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const onCropComplete = useCallback(
    (_, croppedPixels) =>
    {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleDone = async () =>
  {
    if (!croppedAreaPixels) return;

    const croppedFile =
      await getCroppedImg(
        image,
        croppedAreaPixels
      );

    onDone(croppedFile);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black text-white">
      <div className="flex h-14 items-center justify-between px-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
        >
          <X size={22} />
        </button>

        <div className="font-semibold">
          Adjust photo
        </div>

        <button
          type="button"
          onClick={handleDone}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white"
        >
          <Check size={22} />
        </button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={true}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="space-y-3 p-5">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) =>
            setZoom(Number(e.target.value))
          }
          className="w-full"
        />

        <Button
          type="button"
          onClick={handleDone}
          className="w-full"
        >
          Done
        </Button>
      </div>
    </div>
  );
}