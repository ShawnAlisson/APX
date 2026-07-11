"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QrDisplayProps = {
  url: string;
  label?: string;
};

export default function QrDisplay({ url, label = "Scan to join battle" }: QrDisplayProps) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(url, { width: 200, margin: 2 }).then(setDataUrl).catch(() => {});
  }, [url]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR code" className="rounded-lg border" width={200} height={200} />
        ) : (
          <div className="size-[200px] animate-pulse rounded-lg bg-muted" />
        )}
        <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
      </CardContent>
    </Card>
  );
}
