export default function getCroppedImg(
  imageSrc,
  pixelCrop
)
{
  return new Promise((resolve, reject) =>
  {
    const image = new Image();

    image.src = imageSrc;
    image.crossOrigin = "anonymous";

    image.onload = () =>
    {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) =>
        {
          if (!blob)
          {
            reject(new Error("Crop failed"));
            return;
          }

          const file = new File(
            [blob],
            "avatar.jpg",
            {
              type: "image/jpeg",
            }
          );

          resolve(file);
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = reject;
  });
}