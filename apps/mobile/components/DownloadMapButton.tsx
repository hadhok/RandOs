import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { BoundingBox } from "@randos/core";
import { estimateTileCount, estimateDownloadSizeMB } from "@randos/core";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  bbox: BoundingBox;
  hikeName: string;
  onDownloadComplete?: () => void;
}

type DownloadState = "idle" | "downloading" | "done";

const MIN_ZOOM = 10;
const MAX_ZOOM = 15;

export function DownloadMapButton({ bbox, hikeName, onDownloadComplete }: Props) {
  const [state, setState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);

  const tileCount = estimateTileCount(bbox, MIN_ZOOM, MAX_ZOOM);
  const sizeMB = estimateDownloadSizeMB(tileCount);

  function handleDownload() {
    setState("downloading");
    setProgress(0);

    const steps = 20;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      setProgress(step / steps);
      if (step >= steps) {
        clearInterval(interval);
        setState("done");
        onDownloadComplete?.();
      }
    }, 150);
  }

  if (state === "done") {
    return (
      <View style={styles.doneContainer}>
        <Ionicons name="checkmark-circle" size={20} color="#2D6A4F" />
        <Text style={styles.doneText}>Téléchargé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sizeText}>
        {hikeName} — environ {sizeMB.toFixed(1)} Mo
      </Text>

      {state === "downloading" ? (
        <View style={styles.progressWrapper}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{Math.round(progress * 100)} %</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleDownload}>
          <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Télécharger pour offline</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sizeText: {
    fontSize: 13,
    color: "#6B7280",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D6A4F",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  progressWrapper: {
    gap: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#2D6A4F",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  doneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  doneText: {
    fontSize: 14,
    color: "#2D6A4F",
    fontWeight: "600",
  },
});
